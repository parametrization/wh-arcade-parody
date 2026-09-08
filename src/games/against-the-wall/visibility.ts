import { MAP_WIDTH, MAP_HEIGHT } from './barriers';
import type { Actor, State } from './model';
export const VISION_HALF_ANGLE = (35 * Math.PI) / 180;
export const DISTRACTION_RANGE = 4.01;

/** First contact with a closed tile, including an exact corner touch. */
export function wallEntry(ax: number, ay: number, bx: number, by: number, x: number, y: number) {
  let enter = 0,
    exit = 1;
  for (const [origin, direction, min, max] of [
    [ax, bx - ax, x, x + 1],
    [ay, by - ay, y, y + 1],
  ]) {
    if (Math.abs(direction) < 1e-12) {
      if (origin < min || origin > max) return Infinity;
    } else {
      const a = (min - origin) / direction,
        b = (max - origin) / direction;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (enter > exit) return Infinity;
    }
  }
  return enter;
}

/** Ground-plane field of view, using the same tile intersection as detection. */
export function visionBoundary(s: State, e: Actor) {
  const heading = e.heading ?? (e.way < 0 ? Math.PI : 0),
    range = s.config.vision;
  const tiles: { x: number; y: number }[] = [];
  const angles = [-VISION_HALF_ANGLE, VISION_HALF_ANGLE];
  for (let i = -34; i <= 34; i += 2) angles.push((i * Math.PI) / 180);
  for (let x = Math.floor(e.x - range); x <= Math.floor(e.x + range); x++)
    for (let y = Math.floor(e.y - range); y <= Math.floor(e.y + range); y++) {
      if (!(
        x < 1 ||
        x >= MAP_WIDTH - 1 ||
        y < 1 ||
        y >= MAP_HEIGHT - 1 ||
        s.walls.has(`${x},${y}`)
      ))
        continue;
      tiles.push({ x, y });
      // Trace both sides of each corner so a narrow gap is not bridged by the mesh.
      for (const [cx, cy] of [
        [x, y],
        [x + 1, y],
        [x, y + 1],
        [x + 1, y + 1],
      ]) {
        const a = Math.atan2(cy - e.y, cx - e.x) - heading;
        const relative = Math.atan2(Math.sin(a), Math.cos(a));
        for (const offset of [-1e-6, 0, 1e-6]) {
          const r = relative + offset;
          if (r > -VISION_HALF_ANGLE && r < VISION_HALF_ANGLE) angles.push(r);
        }
      }
    }
  return [...new Set(angles)]
    .sort((a, b) => a - b)
    .map((angle) => {
      const dx = Math.cos(heading + angle) * range,
        dy = Math.sin(heading + angle) * range;
      let t = 1;
      for (const tile of tiles)
        t = Math.min(t, wallEntry(e.x, e.y, e.x + dx, e.y + dy, tile.x, tile.y));
      return { x: e.x + dx * t, y: e.y + dy * t };
    });
}
