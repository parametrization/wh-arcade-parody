import {
  textureWorldFace,
  materialReady,
  type MaterialName,
} from '../../shared/fidelity/materials';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  tunnelCandidates,
  isNight,
  canDistract,
  type State,
  type Actor,
} from './model';
import { visionBoundary, DISTRACTION_RANGE } from './visibility';

type V = { x: number; y: number; z: number };
type Mesh = {
  p: V[];
  color: string;
  depth: number;
  material?: MaterialName;
  staticTerrain?: boolean;
};
interface TextureRaster {
  image: HTMLCanvasElement;
  x: number;
  y: number;
}
interface TerrainTextureCache {
  camera: string;
  stable: number;
  pixels: number;
  faces: Map<string, TextureRaster>;
  ground?: HTMLCanvasElement;
}
const terrainTextures = new WeakMap<CanvasRenderingContext2D, TerrainTextureCache>();
/** Cache only atlas projection, never actors, light cones, water ripples or depth order. */
function textureRaster(
  c: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  world: V[],
  material: MaterialName,
  opacity: number,
  cache: TerrainTextureCache,
) {
  if (cache.stable < 1 || !materialReady() || c.globalAlpha !== 1) {
    textureWorldFace(c, points, world, material, opacity);
    return;
  }
  const key =
    material + ':' + opacity + ':' + world.map((p) => p.x + ',' + p.y + ',' + p.z).join(';');
  const hit = cache.faces.get(key);
  if (hit) {
    c.drawImage(hit.image, hit.x, hit.y);
    return;
  }
  const x = Math.max(0, Math.floor(Math.min(...points.map((p) => p.x)))),
    y = Math.max(0, Math.floor(Math.min(...points.map((p) => p.y))));
  const right = Math.min(c.canvas.width, Math.ceil(Math.max(...points.map((p) => p.x)))),
    bottom = Math.min(c.canvas.height, Math.ceil(Math.max(...points.map((p) => p.y))));
  const width = right - x,
    height = bottom - y;
  if (width <= 0 || height <= 0) return;
  // At most 16 MiB of pixel storage per renderer; moving cameras bypass allocations.
  if (cache.pixels + width * height > 4 * 1024 * 1024) {
    textureWorldFace(c, points, world, material, opacity);
    return;
  }
  const image = document.createElement('canvas');
  image.width = width;
  image.height = height;
  const ctx = image.getContext('2d')!;
  textureWorldFace(
    ctx,
    points.map((p) => ({ x: p.x - x, y: p.y - y })),
    world,
    material,
    opacity,
  );
  cache.faces.set(key, { image, x, y });
  cache.pixels += width * height;
  c.drawImage(image, x, y);
}
const distance = 16;
const focal = 1000;
/** Perspective camera axes are orthogonal; input rays meet the simulation ground plane. */
export function unprojectScene(s: State, x: number, y: number) {
  const sy = y - 360;
  const dy = (distance * sy) / (focal * 0.73 + sy * 0.68);
  const d = distance - dy * 0.68;
  return { x: s.x + ((x - 480) * d) / focal, y: s.y + dy };
}
export function projectScene(s: State, x: number, y: number, z = 0) {
  const d = Math.max(1, distance - (y - s.y) * 0.68 - z * 0.73);
  return { x: 480 + ((x - s.x) * focal) / d, y: 360 + (((y - s.y) * 0.73 - z * 0.68) * focal) / d };
}
export function drawScene(
  c: CanvasRenderingContext2D,
  s: State,
  aim: { x: number; y: number } | null,
  variant: string,
  reducedMotion: boolean,
  tunnelCursor: { x: number; y: number } | null = null,
) {
  c.save();
  const night = isNight(s);
  const cameraKey = `${s.x}:${s.y}:${c.canvas.width}:${c.canvas.height}:${night}:${materialReady()}:${s.seed}:${s.district}:${[...s.walls].join('|')}:${[...s.water].join('|')}`;
  let textureCache = terrainTextures.get(c);
  if (!textureCache || textureCache.camera !== cameraKey) {
    textureCache = { camera: cameraKey, stable: 0, pixels: 0, faces: new Map() };
    terrainTextures.set(c, textureCache);
  } else textureCache.stable++;

  const depth = (p: V) => distance - (p.y - s.y) * 0.68 - p.z * 0.73;
  const project = (p: V) => projectScene(s, p.x, p.y, p.z);
  const v = (x: number, y: number, z = 0): V => ({ x, y, z });
  const floor: Mesh[] = [],
    meshes: Mesh[] = [];
  let collectingTerrain = true,
    rasterizingGround = false;
  const face = (
    p: V[],
    color: string,
    ground = false,
    material?: MaterialName,
    dynamic = false,
  ) => {
    if (p.some((p) => depth(p) < 1)) return;
    (ground ? floor : meshes).push({
      p,
      color,
      material,
      staticTerrain: ground && collectingTerrain && !dynamic,
      depth: p.reduce((n, p) => n + depth(p), 0) / p.length,
    });
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    base: string,
    top: string,
    side: string,
  ) => {
    face(
      [v(x, y, z + h), v(x + w, y, z + h), v(x + w, y + d, z + h), v(x, y + d, z + h)],
      top,
      false,
      w > 0.5 && h > 0.3 ? 'concrete' : undefined,
    );
    face(
      [v(x, y, z), v(x + w, y, z), v(x + w, y, z + h), v(x, y, z + h)],
      side,
      false,
      w > 0.5 && h > 0.3 ? 'concrete' : undefined,
    );
    face(
      [v(x, y + d, z), v(x + w, y + d, z), v(x + w, y + d, z + h), v(x, y + d, z + h)],
      base,
      false,
      w > 0.5 && h > 0.3 ? 'concrete' : undefined,
    );
    for (const xx of [x, x + w])
      face([v(xx, y, z), v(xx, y + d, z), v(xx, y + d, z + h), v(xx, y, z + h)], side);
  };
  const beam = (a: V, b: V, width: number, color: string) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1,
      ox = (-(b.y - a.y) / d) * width,
      oy = ((b.x - a.x) / d) * width;
    face(
      [
        v(a.x + ox, a.y + oy, a.z),
        v(b.x + ox, b.y + oy, b.z),
        v(b.x - ox, b.y - oy, b.z),
        v(a.x - ox, a.y - oy, a.z),
      ],
      color,
    );
    // Crossed strip gives wire and limbs a silhouette from either view angle.
    face(
      [
        v(a.x, a.y, a.z + width),
        v(b.x, b.y, b.z + width),
        v(b.x, b.y, b.z - width),
        v(a.x, a.y, a.z - width),
      ],
      color,
    );
  };
  const labels: { p: V; text: string; color: string }[] = [];
  const sky = c.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, variant === 'C' ? '#435773' : '#6c8b9b');
  sky.addColorStop(0.65, '#c6bfa4');
  sky.addColorStop(1, '#a89575');
  c.fillStyle = sky;
  c.fillRect(0, 0, 960, 640);
  for (let layer = 0; layer < 4; layer++) {
    c.fillStyle = ['#9ca8a1', '#929b8e', '#7e8b7c', '#68796a'][layer];
    c.beginPath();
    c.moveTo(0, 640);
    for (let x = -80; x <= 1040; x += 80)
      c.lineTo(x, 95 + layer * 58 + Math.sin(x * 0.012 + layer) * 30 + (x % 160 === 0 ? 20 : 0));
    c.lineTo(960, 640);
    c.fill();
  }
  const barrierKeys = new Set(s.barriers.map((b) => `${b.x},${b.y}`));
  for (let y = 0; y < MAP_HEIGHT; y++)
    for (let x = 0; x < MAP_WIDTH; x++) {
      const p = project(v(x + 0.5, y + 0.5));
      if (p.x < -130 || p.x > 1090 || p.y < -180 || p.y > 850) continue;
      if (s.water.has(`${x},${y}`)) {
        face(
          [v(x, y, 0.01), v(x + 1, y, 0.01), v(x + 1, y + 1, 0.01), v(x, y + 1, 0.01)],
          '#326c88',
          true,
          'water',
        );
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          if (s.water.has(`${x + dx},${y + dy}`)) continue;
          const ax = dx === 1 ? x + 1 : dx === -1 ? x : x + 0.05,
            ay = dy === 1 ? y + 1 : dy === -1 ? y : y + 0.05;
          const bx = dx ? ax : x + 0.95,
            by = dy ? ay : y + 0.95;
          beam(v(ax, ay, 0.018), v(bx, by, 0.018), 0.012, '#b6c3b64c');
        }
        const flow = reducedMotion ? 0 : (s.time * 0.22) % 1;
        for (let k = 0; k < 3; k++) {
          const yy = y + ((k / 3 + flow) % 1);
          face(
            [
              v(x + 0.14, yy, 0.015),
              v(x + 0.8, yy, 0.015),
              v(x + 0.76, yy + 0.025, 0.015),
              v(x + 0.12, yy + 0.025, 0.015),
            ],
            '#7ab9c366',
            true,
            undefined,
            true,
          );
        }
        continue;
      }
      const seed = (x * 31 + y * 17) % 9;
      const color = '#ad9f80';
      face([v(x, y), v(x + 1, y), v(x + 1, y + 1), v(x, y + 1)], color, true, 'soil');
      for (let grit = 0; grit < 5; grit++) {
        const gx = x + ((x * 37 + y * 19 + grit * 43) % 97) / 97,
          gy = y + ((x * 17 + y * 41 + grit * 31) % 89) / 89;
        face(
          [v(gx, gy, 0.002), v(gx + 0.028, gy - 0.015, 0.002), v(gx + 0.06, gy + 0.02, 0.002)],
          grit % 2 ? '#675d4940' : '#e6d5ac35',
          true,
        );
      }
      if (s.walls.has(`${x},${y}`) && !barrierKeys.has(`${x},${y}`)) {
        box(x, y, 0, 1, 1, 0.85, '#a49780', '#d0c1a1', '#8c8471');
        for (let k = 1; k <= 2; k++)
          beam(v(x, y + 1.005, k * 0.27), v(x + 1, y + 1.005, k * 0.27), 0.012, '#756f62');
      } else if (seed === 0 && !barrierKeys.has(`${x},${y}`)) {
        const xx = x + 0.17,
          yy = y + 0.2;
        face(
          [v(xx - 0.13, yy), v(xx + 0.14, yy - 0.08), v(xx + 0.1, yy + 0.16)],
          '#847c6344',
          true,
        );
        face([v(xx - 0.1, yy), v(xx, yy - 0.1, 0.13), v(xx + 0.12, yy + 0.07)], '#8d8770');
        face([v(xx, yy - 0.1, 0.13), v(xx + 0.12, yy + 0.07), v(xx + 0.1, yy + 0.14)], '#b1ab8d');
        for (let k = 0; k < 3; k++)
          face(
            [
              v(x + 0.72, y + 0.8),
              v(x + 0.67 + k * 0.06, y + 0.8, 0.2 + k * 0.05),
              v(x + 0.8, y + 0.84),
            ],
            '#778366',
          );
      }
    }
  collectingTerrain = false;
  for (const b of s.barriers) {
    const { x, y } = b;
    const screen = project(v(x + 0.5, y + 0.5));
    if (screen.x < -160 || screen.x > 1120 || screen.y < -150 || screen.y > 1000) continue;
    if (b.repairProgress > 0)
      labels.push({
        p: v(x + 0.5, y + 0.5, 1.4),
        text: `MENDING ${Math.ceil(30 - b.repairProgress)}s`,
        color: '#ffb58f',
      });
    const height = b.material === 'wire' ? 0.9 : b.material === 'fence' ? 1.65 : 1.85;
    if (b.material === 'concrete') {
      if (b.open) {
        // Open tunnel is a genuine gap between piers, with a heavy lintel overhead.
        box(x, y, 0, 0.16, 1, height, '#9da294', '#c3c7b3', '#767f78');
        box(x + 0.84, y, 0, 0.16, 1, height, '#9da294', '#c3c7b3', '#767f78');
        box(x + 0.16, y, 0.65, 0.68, 1, height - 0.65, '#9da294', '#c3c7b3', '#767f78');
        face(
          [
            v(x + 0.16, y + 1, 0.65),
            v(x + 0.3, y + 1, 0.82),
            v(x + 0.7, y + 1, 0.82),
            v(x + 0.84, y + 1, 0.65),
          ],
          '#555f58',
        );
        labels.push({ p: v(x + 0.5, y + 1.1, 0.85), text: 'TUNNEL', color: '#dce7cb' });
      } else box(x, y, 0, 1, 1, height, '#a6aa9a', '#d4d4bb', '#858f83');
      for (const z of [0.5, 1, 1.5])
        beam(v(x + 0.03, y + 1.005, z), v(x + 0.97, y + 1.005, z), 0.013, '#778176');
      box(x + 0.05, y + 0.1, height, 0.9, 0.8, 0.09, '#b3b6a4', '#e0ddc4', '#909a8b');
    } else {
      for (const px of [x + 0.05, x + 0.95]) {
        box(px - 0.025, y + 0.48, 0, 0.05, 0.05, height, '#7a8883', '#bfcbc1', '#526662');
        beam(v(px, y + 0.5, height), v(px, y + 0.35, height + 0.16), 0.02, '#879b93');
      }
      if (b.material === 'wire') {
        for (let k = 0; k < 4; k++) {
          const z = 0.17 + k * 0.2;
          if (b.open) {
            beam(v(x + 0.05, y + 0.5, z), v(x + 0.25, y + 0.62, z * 0.5), 0.014, '#a5b2a5');
            beam(v(x + 0.8, y + 0.4, z * 0.6), v(x + 0.95, y + 0.5, z), 0.014, '#a5b2a5');
          } else {
            beam(v(x + 0.05, y + 0.5, z), v(x + 0.95, y + 0.5, z), 0.012, '#c0c5af');
            for (let j = 1; j < 5; j++) {
              const xx = x + j * 0.2;
              beam(
                v(xx - 0.04, y + 0.47, z - 0.035),
                v(xx + 0.04, y + 0.53, z + 0.035),
                0.008,
                '#566d66',
              );
            }
          }
        }
      } else {
        for (let k = 0; k <= 7; k++) {
          const xx = x + k / 7;
          beam(v(xx, y + 0.5, 0), v(Math.min(x + 1, xx + 0.4), y + 0.5, height), 0.009, '#a2b1a6');
          beam(v(xx, y + 0.5, height), v(Math.min(x + 1, xx + 0.4), y + 0.5, 0), 0.009, '#758d84');
        }
        if (b.open) {
          for (const xx of [x + 0.28, x + 0.72])
            beam(v(xx, y + 1, 0), v(xx, y + 0.45, height + 0.1), 0.035, '#d8b77b');
          for (let k = 0; k < 7; k++) {
            const q = k / 6;
            beam(
              v(x + 0.28, y + 1 - q * 0.55, q * (height + 0.1)),
              v(x + 0.72, y + 1 - q * 0.55, q * (height + 0.1)),
              0.025,
              '#e6cf94',
            );
          }
          labels.push({
            p: v(x + 0.5, y + 0.5, height + 0.35),
            text: `LADDER ${Math.ceil(b.remaining)}s`,
            color: '#fff0b3',
          });
        }
      }
      // Short segmented coils create actual raised razor-wire geometry.
      if (!b.open)
        for (let j = 0; j < 4; j++)
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4,
              aa = ((k + 1) * Math.PI) / 4;
            beam(
              v(
                x + 0.15 + j * 0.22 + Math.cos(a) * 0.11,
                y + 0.5 + Math.sin(a) * 0.09,
                height + 0.08 + Math.sin(a) * 0.11,
              ),
              v(
                x + 0.15 + j * 0.22 + Math.cos(aa) * 0.11,
                y + 0.5 + Math.sin(aa) * 0.09,
                height + 0.08 + Math.sin(aa) * 0.11,
              ),
              0.006,
              '#a7b9ae',
            );
          }
    }
    if (b.progress > 0 && !b.open)
      labels.push({
        p: v(x + 0.5, y + 0.7, height + 0.2),
        text: `${Math.round(b.progress * 100)}%`,
        color: '#ffe5a1',
      });
  }
  // Tunnel portals occupy selected walkable bank cells; the concrete above stays solid.
  for (const tunnel of s.tunnels) {
    if (!tunnel.open) continue;
    for (const point of tunnel.discovered ? [tunnel.entrance, tunnel.exit] : [tunnel.entrance]) {
      const { x, y } = point;
      face(
        [
          v(x - 0.38, y - 0.35, 0.02),
          v(x + 0.38, y - 0.35, 0.02),
          v(x + 0.38, y + 0.35, 0.02),
          v(x - 0.38, y + 0.35, 0.02),
        ],
        '#15202a',
        true,
      );
      for (const side of [-1, 1])
        box(x + side * 0.36 - 0.045, y - 0.35, 0, 0.09, 0.7, 0.12, '#af8c63', '#d7b17d', '#695c45');
      beam(v(x - 0.36, y - 0.35, 0.12), v(x + 0.36, y - 0.35, 0.12), 0.05, '#b69969');
      labels.push({
        p: v(x, y + 0.75, 0.08),
        text:
          tunnel.repairProgress > 0
            ? `SEALING ${Math.ceil(90 - tunnel.repairProgress)}s`
            : 'TUNNEL · STEP IN',
        color: '#dbcb9b',
      });
    }
  }
  if (s.tunnelPlacement) {
    for (const side of ['south'] as const) {
      for (const p of tunnelCandidates(s, side)) {
        const selected =
          tunnelCursor && Math.hypot(p.x - tunnelCursor.x, p.y - tunnelCursor.y) < 0.1;
        const color = selected ? '#ffe59b' : side === 'south' ? '#93f5d0' : '#89baff';
        const x = p.x,
          y = p.y,
          r = 0.42,
          t = 0.04;
        for (const [ax, ay, bx, by] of [
          [x - r, y - r, x + r, y - r],
          [x + r, y - r, x + r, y + r],
          [x + r, y + r, x - r, y + r],
          [x - r, y + r, x - r, y - r],
        ]) {
          face(
            [
              v(ax - t, ay - t, 0.06),
              v(bx + t, by - t, 0.06),
              v(bx + t, by + t, 0.06),
              v(ax - t, ay + t, 0.06),
            ],
            color,
            true,
          );
        }
      }
    }
  }
  // Directional cover shadows soften at the outer edge, with no collision changes.
  for (const cell of s.walls) {
    const [x, y] = cell.split(',').map(Number);
    if (s.walls.has(`${x + 1},${y + 1}`)) continue;
    const center = project(v(x + 0.5, y + 0.5));
    if (center.x < -120 || center.x > 1080 || center.y < -100 || center.y > 740) continue;
    for (let penumbra = 0; penumbra < 3; penumbra++) {
      const spread = penumbra * 0.04;
      face(
        [
          v(x + 0.18 - spread, y + 0.18 - spread, 0.004),
          v(x + 1.02 + spread, y + 0.18 - spread, 0.004),
          v(x + 1.6 + spread, y + 1.45 + spread, 0.004),
          v(x + 0.58 - spread, y + 1.45 + spread, 0.004),
        ],
        night ? '#08121b08' : '#1b282214',
        true,
      );
    }
  }
  const visibleGroundRegion = (x: number, y: number, r: number) => {
    const corners = [v(x - r, y - r), v(x + r, y - r), v(x + r, y + r), v(x - r, y + r)];
    if (corners.some((p) => depth(p) < 1)) return true;
    const screen = corners.map(project);
    return (
      Math.max(...screen.map((p) => p.x)) >= 0 &&
      Math.min(...screen.map((p) => p.x)) <= c.canvas.width &&
      Math.max(...screen.map((p) => p.y)) >= 0 &&
      Math.min(...screen.map((p) => p.y)) <= c.canvas.height
    );
  };
  // Detection fan is the exact model ray mesh, including narrow wall-corner gaps.
  for (const e of s.enemies) {
    if (e.state === 'dead' || !visibleGroundRegion(e.x, e.y, s.config.vision)) continue;
    const boundary = visionBoundary(s, e);
    face(
      [v(e.x, e.y, 0.025), ...boundary.map((p) => v(p.x, p.y, 0.025))],
      night ? '#f4edaa85' : e.meter > 0 ? '#e8b26750' : '#b7d8a630',
      true,
    );
  }
  // Welcoming office sits on its real model destination, with a portico and lit glazing.
  const ox = s.office.x,
    oy = s.office.y;
  box(ox - 1.15, oy - 0.8, 0, 2.3, 1.3, 1.7, '#c3c9b3', '#e4dfc2', '#8fa499');
  face(
    [
      v(ox - 1.35, oy - 0.9, 1.7),
      v(ox, oy - 0.9, 2.18),
      v(ox + 1.35, oy - 0.9, 1.7),
      v(ox + 1.35, oy + 0.65, 1.7),
      v(ox, oy + 0.65, 2.18),
      v(ox - 1.35, oy + 0.65, 1.7),
    ],
    '#688e85',
  );
  box(ox - 0.27, oy + 0.51, 0, 0.54, 0.025, 1.05, '#7bbf9f', '#b8e8bd', '#406f65');
  for (const side of [-1, 1]) {
    face(
      [
        v(ox + side * 0.72 - 0.22, oy + 0.512, 0.65),
        v(ox + side * 0.72 + 0.22, oy + 0.512, 0.65),
        v(ox + side * 0.72 + 0.22, oy + 0.512, 1.28),
        v(ox + side * 0.72 - 0.22, oy + 0.512, 1.28),
      ],
      '#eadca1',
    );
    beam(
      v(ox + side * 0.72, oy + 0.52, 0.65),
      v(ox + side * 0.72, oy + 0.52, 1.28),
      0.02,
      '#667e76',
    );
    box(ox + side * 0.95 - 0.025, oy + 0.75, 0, 0.05, 0.05, 1.42, '#b9cbbb', '#e2ddbe', '#869e94');
  }
  box(ox - 1.15, oy + 0.48, 1.4, 2.3, 0.45, 0.1, '#638e80', '#a4c3a2', '#587b72');
  beam(v(ox + 1.35, oy, 0), v(ox + 1.35, oy, 2.25), 0.023, '#bbc8b7');
  face(
    [v(ox + 1.35, oy, 2.25), v(ox + 1.95, oy, 2.2), v(ox + 1.9, oy, 1.9), v(ox + 1.35, oy, 1.95)],
    '#b3dca8',
  );
  labels.push({ p: v(ox, oy + 0.6, 2.33), text: 'ASYLUM OFFICE', color: '#d9f4ca' });
  const person = (
    x: number,
    y: number,
    heading: number,
    gait: number,
    coat: string,
    skin: string,
    player: boolean,
    dead: boolean,
    climb = false,
    crawl = false,
  ) => {
    const cs = Math.cos(heading),
      sn = Math.sin(heading);
    const ground = climb ? Math.sin((y - Math.floor(y)) * Math.PI) * 1.75 : 0;
    const local = (a: number, b: number, h: number) => {
      // Adult head-to-body ratio; face attachments shrink together around the neck.
      if (h > 0.97) {
        a *= 0.8;
        b *= 0.8;
        h = 0.97 + (h - 0.97) * 0.8;
      }
      return v(x + a * cs - b * sn, y + a * sn + b * cs, ground + h);
    };
    const screen = project(local(0, 0, 0.5));
    if (screen.x < -100 || screen.x > 1060 || screen.y < -120 || screen.y > 800) return;
    const shade = (hex: string, light: number) => {
      const rgb = parseInt(hex.slice(1), 16);
      return (
        '#' +
        [16, 8, 0]
          .map((shift) =>
            Math.min(255, Math.max(0, Math.round(((rgb >> shift) & 255) * light)))
              .toString(16)
              .padStart(2, '0'),
          )
          .join('')
      );
    };
    // Rounded mesh rings give silhouettes hips, shoulders, knees and cheekbones.
    const oval = (
      a: number,
      b: number,
      z: number,
      rx: number,
      ry: number,
      rz: number,
      color: string,
    ) => {
      const rings = 6,
        sides = 10;
      for (let j = 0; j < rings; j++)
        for (let i = 0; i < sides; i++) {
          const points: V[] = [];
          for (const [k, l] of [
            [i, j],
            [i + 1, j],
            [i + 1, j + 1],
            [i, j + 1],
          ]) {
            const phi = (k / sides) * Math.PI * 2,
              theta = (l / rings) * Math.PI;
            points.push(
              local(
                a + Math.cos(phi) * Math.sin(theta) * rx,
                b + Math.sin(phi) * Math.sin(theta) * ry,
                z + Math.cos(theta) * rz,
              ),
            );
          }
          const normal = ((i + 0.5) / sides) * Math.PI * 2;
          face(
            points,
            shade(
              color,
              0.66 +
                0.27 * Math.max(0, Math.cos(normal + heading + 1)) +
                0.15 * Math.cos((j / rings) * Math.PI),
            ),
          );
        }
    };
    const limb = (a: number[], b: number[], ra: number, rb: number, color: string) => {
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        dz = b[2] - a[2],
        length = Math.hypot(dx, dy, dz) || 1;
      const ux = -dy / (Math.hypot(dx, dy) || 1),
        uy = dx / (Math.hypot(dx, dy) || 1);
      const tangent = Math.hypot(dx, dy) < 0.001 ? [1, 0, 0] : [ux, uy, 0];
      const second = [
        (-dz * tangent[1]) / length,
        (dz * tangent[0]) / length,
        (dx * tangent[1] - dy * tangent[0]) / length,
      ];
      for (let i = 0; i < 10; i++) {
        const points: V[] = [];
        for (const [end, index] of [
          [0, i],
          [1, i],
          [1, i + 1],
          [0, i + 1],
        ]) {
          const p = end ? b : a,
            r = end ? rb : ra,
            t = (index / 10) * Math.PI * 2;
          points.push(
            local(
              p[0] + r * (Math.cos(t) * tangent[0] + Math.sin(t) * second[0]),
              p[1] + r * (Math.cos(t) * tangent[1] + Math.sin(t) * second[1]),
              p[2] + r * Math.sin(t) * second[2],
            ),
          );
        }
        face(
          points,
          shade(color, 0.7 + 0.3 * Math.max(0, Math.cos((i / 10) * Math.PI * 2 + heading))),
        );
      }
    };
    // Nested translucent ellipses soften both contact and directional cast shadows.
    for (let layer = 0; layer < 4; layer++) {
      const points = Array.from({ length: 18 }, (_, i) => {
        const t = (i / 18) * Math.PI * 2;
        return v(
          x + 0.08 + Math.cos(t) * (0.32 + layer * 0.055),
          y + 0.08 + Math.sin(t) * (0.19 + layer * 0.03),
          0.006 + layer * 0.0003,
        );
      });
      face(points, layer === 0 ? '#15201825' : '#1520180c', true);
    }
    if (dead || crawl) {
      oval(0, 0, 0.18, 0.4, 0.17, 0.14, coat);
      oval(0.39, 0, 0.2, 0.15, 0.12, 0.13, skin);
      for (const side of [-1, 1]) {
        limb([-0.2, side * 0.1, 0.13], [-0.65, side * 0.13 + gait, 0.06], 0.095, 0.055, '#39424a');
        limb([0.16, side * 0.16, 0.19], [0.35 - gait, side * 0.28, 0.045], 0.065, 0.04, coat);
      }
      return;
    }
    for (const side of [-1, 1]) {
      const step = side * gait,
        lift = Math.max(0, step) * 0.42,
        knee = [-step * 0.4, side * 0.095, 0.31 + lift * 0.4],
        hip = [0, side * 0.095, 0.56],
        ankle = [step, side * 0.1, 0.08 + lift];
      limb(hip, knee, 0.092, 0.067, '#3e4a52');
      limb(knee, ankle, 0.068, 0.049, '#354047');
      oval(step + 0.035, side * 0.1, 0.055 + lift, 0.105, 0.067, 0.052, '#292b28');
      const shoulder = [0, side * 0.2, 0.9],
        elbow = [step * 0.45, side * 0.24, climb ? 0.93 : 0.7],
        hand = [-step, side * 0.24, climb ? 1.03 + step * 0.3 : 0.49 + lift * 0.3];
      limb(shoulder, elbow, 0.081, 0.061, coat);
      limb(elbow, hand, 0.062, 0.04, coat);
      oval(hand[0], hand[1], hand[2], 0.044, 0.041, 0.064, skin);
      // Seams and crumpled elbow fabric retain a subdued tactile highlight.
      beam(
        local(elbow[0] - 0.035, elbow[1], elbow[2]),
        local(elbow[0] + 0.045, elbow[1], elbow[2] - 0.025),
        0.006,
        '#c5c0a433',
      );
    }
    oval(0, 0, 0.7, 0.135, 0.18, 0.255, coat);
    oval(-0.015, 0, 0.54, 0.125, 0.15, 0.105, '#424942');
    limb([0, 0, 0.94], [0, 0, 1.025], 0.052, 0.05, skin);
    oval(0.012, 0, 1.105, 0.115, 0.095, 0.15, skin);
    // Ears, brow, nose and jaw are separate dimensional features.
    for (const side of [-1, 1]) {
      oval(0.015, side * 0.098, 1.1, 0.029, 0.019, 0.045, skin);
      oval(0.112, side * 0.045, 1.13, 0.011, 0.021, 0.012, '#2c2522');
      beam(local(0.108, side * 0.065, 1.155), local(0.122, side * 0.025, 1.153), 0.005, '#43372e');
    }
    oval(0.125, 0, 1.102, 0.036, 0.026, 0.042, skin);
    beam(local(0.117, -0.035, 1.057), local(0.122, 0.035, 1.057), 0.005, '#775443');
    oval(-0.02, 0, 1.208, 0.106, 0.096, 0.051, player ? '#3b3029' : coat);
    if (!player) oval(0.08, 0, 1.197, 0.109, 0.109, 0.015, '#3e473c');
    if (player) {
      oval(-0.145, 0, 0.72, 0.105, 0.155, 0.19, '#78674f');
      for (const side of [-1, 1])
        beam(local(-0.09, side * 0.12, 0.88), local(0.06, side * 0.12, 0.61), 0.013, '#514735');
    } else {
      oval(0.12, 0, 0.75, 0.035, 0.135, 0.13, '#424b43');
      for (const side of [-1, 1]) oval(0.135, side * 0.08, 0.71, 0.029, 0.042, 0.065, '#636a57');
    }
    beam(local(0.137, 0, 0.6), local(0.132, 0, 0.91), 0.004, '#292e2a');
    for (const side of [-1, 1]) {
      beam(local(0.11, side * 0.075, 0.61), local(0.125, side * 0.12, 0.79), 0.004, '#c3bfa53b');
      beam(
        local(0, side * 0.159, 0.55),
        local(-gait * 0.3, side * 0.115, 0.32),
        0.003,
        '#a8b2ab50',
      );
      for (let fold = 0; fold < 3; fold++)
        beam(
          local(0.1, side * 0.09, 0.63 + fold * 0.052),
          local(0.128, side * 0.05, 0.62 + fold * 0.052),
          0.003,
          '#181f2348',
        );
    }
  };
  const cast = [...s.enemies.map((e) => ({ x: e.x, y: e.y, e })), { x: s.x, y: s.y, e: null }];
  if (!s.companion.helped)
    person(s.companion.x, s.companion.y, Math.PI / 2, 0, '#c8a064', '#cb9e7d', true, false);
  for (const actor of cast) {
    const e: Actor | null = actor.e,
      player = !e;
    if (player && s.tunnelTransit) continue;
    const heading = e?.heading ?? s.heading;
    const gait =
      !reducedMotion && (e?.moving ?? s.moving)
        ? Math.sin((e?.walkDistance ?? s.walkDistance) * 10) * 0.12
        : 0;
    const coat = player
      ? '#4aaea3'
      : e!.faction === 'Cartel'
        ? '#987082'
        : e!.faction === 'Paramilitary'
          ? '#8c9384'
          : e!.faction === 'ICE'
            ? '#567a9a'
            : '#7b946f';
    person(
      actor.x,
      actor.y,
      heading,
      gait,
      coat,
      player ? '#bd8b68' : '#d2a27e',
      player,
      player ? s.health <= 0 : e?.state === 'dead',
      player && s.crossing?.material === 'fence',
      player && s.crossing?.material === 'concrete',
    );
    if (e?.state !== 'dead')
      labels.push({
        p: v(actor.x, actor.y, 1.32),
        text: player ? 'ALEX' : (e!.group ?? e!.faction),
        color: player ? '#cdf4dc' : '#e5e4cc',
      });
    if (e && e.state !== 'dead') {
      if (night) {
        const dx = Math.cos(heading),
          dy = Math.sin(heading);
        const hand = v(e.x + 0.12 * dx - 0.22 * dy, e.y + 0.12 * dy + 0.22 * dx, 0.47);
        const lens = v(hand.x + 0.22 * dx, hand.y + 0.22 * dy, 0.47);
        beam(hand, lens, 0.045, '#768d99');
        beam(v(lens.x - 0.02 * dx, lens.y - 0.02 * dy, 0.47), lens, 0.052, '#f4edaa85');
      }
      if (e.state === 'combat')
        beam(
          v(e.x + 0.1 * Math.cos(heading), e.y + 0.1 * Math.sin(heading), 0.67),
          v(e.x + 0.48 * Math.cos(heading), e.y + 0.48 * Math.sin(heading), 0.65),
          0.027,
          '#3d4c4d',
        );
      if ((e.shot ?? 0) > 0 && !reducedMotion) {
        const px = e.x + 0.5 * Math.cos(heading),
          py = e.y + 0.5 * Math.sin(heading);
        face(
          [v(px - 0.09, py, 0.65), v(px, py, 0.79), v(px + 0.09, py, 0.65), v(px, py, 0.56)],
          '#ffe5a0',
        );
      }
    }
  }
  for (const item of s.items) {
    if (item.taken) continue;
    box(
      item.x - 0.16,
      item.y - 0.14,
      0,
      0.32,
      0.28,
      0.25,
      item.type === 'water' ? '#649eae' : '#b3a06f',
      '#d5d7b3',
      '#73877a',
    );
  }
  if (aim) {
    for (let i = 0; i < 120; i += 2) {
      const a = (i * Math.PI) / 60,
        b = ((i + 1) * Math.PI) / 60;
      face(
        [
          v(s.x + Math.cos(a) * DISTRACTION_RANGE, s.y + Math.sin(a) * DISTRACTION_RANGE, 0.04),
          v(s.x + Math.cos(b) * DISTRACTION_RANGE, s.y + Math.sin(b) * DISTRACTION_RANGE, 0.04),
          v(
            s.x + Math.cos(b) * (DISTRACTION_RANGE - 0.025),
            s.y + Math.sin(b) * (DISTRACTION_RANGE - 0.025),
            0.04,
          ),
          v(
            s.x + Math.cos(a) * (DISTRACTION_RANGE - 0.025),
            s.y + Math.sin(a) * (DISTRACTION_RANGE - 0.025),
            0.04,
          ),
        ],
        '#93f5d0',
        true,
      );
    }
  }
  if (!s.companion.helped)
    labels.push({ p: v(s.companion.x, s.companion.y, 1.32), text: 'E · HELP', color: '#ffe5a1' });
  if (s.gate.phase === 'warning')
    labels.push({
      p: v(s.gate.x + 0.5, s.gate.y + 0.5, 0.2),
      text: `GATE ${Math.ceil(s.gate.remaining)}s`,
      color: '#ffe593',
    });
  for (const mark of [s.beacon, aim])
    if (mark) {
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12,
          b = ((i + 1) * Math.PI) / 12;
        face(
          [
            v(mark.x + Math.cos(a) * 0.4, mark.y + Math.sin(a) * 0.4, 0.045),
            v(mark.x + Math.cos(b) * 0.4, mark.y + Math.sin(b) * 0.4, 0.045),
            v(mark.x + Math.cos(b) * 0.34, mark.y + Math.sin(b) * 0.34, 0.045),
            v(mark.x + Math.cos(a) * 0.34, mark.y + Math.sin(a) * 0.34, 0.045),
          ],
          mark === aim ? (canDistract(s, mark.x, mark.y) ? '#93f5d0' : '#ff7790') : '#ffe59b',
          true,
        );
      }
    }
  const paint = (mesh: Mesh) => {
    const points = mesh.p.map(project);
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    const luminous = ['#f4edaa85', '#ffe5a0', '#eadca1', '#93f5d0', '#ff7790', '#ffe59b'].includes(
      mesh.color,
    );
    if (night && !luminous && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(mesh.color)) {
      const rgb = Number.parseInt(mesh.color.slice(1, 7), 16);
      const r = Math.round(((rgb >> 16) & 255) * 0.27),
        g = Math.round(((rgb >> 8) & 255) * 0.34),
        b = Math.round((rgb & 255) * 0.47);
      c.fillStyle = `rgba(${r},${g},${b},${mesh.color.length === 9 ? Number.parseInt(mesh.color.slice(7), 16) / 255 : 1})`;
    } else c.fillStyle = mesh.color;
    if (night && mesh.color === '#f4edaa85' && points.length > 6) {
      const source = points[0],
        radius = Math.max(
          ...points.slice(1).map((p) => Math.hypot(p.x - source.x, p.y - source.y)),
        );
      const glow = c.createRadialGradient(source.x, source.y, 0, source.x, source.y, radius);
      glow.addColorStop(0, '#fff2c58c');
      glow.addColorStop(0.28, '#e9dba755');
      glow.addColorStop(0.8, '#d8d5a51d');
      glow.addColorStop(1, '#d8d5a500');
      c.fillStyle = glow;
    }
    c.fill();
    if (mesh.material) {
      if (rasterizingGround)
        textureWorldFace(c, points, mesh.p, mesh.material, night ? 0.11 : 0.34);
      else textureRaster(c, points, mesh.p, mesh.material, night ? 0.11 : 0.34, textureCache!);
    }
  };
  // Ground is its own pass; foreground raised meshes then occlude bodies by physical depth.
  if (night) {
    c.fillStyle = '#071529ce';
    c.fillRect(0, 0, 960, 640);
  }
  if (textureCache!.stable >= 1 && materialReady() && c.globalAlpha === 1) {
    if (!textureCache!.ground) {
      const main = c,
        layer = document.createElement('canvas');
      layer.width = c.canvas.width;
      layer.height = c.canvas.height;
      c = layer.getContext('2d')!;
      rasterizingGround = true;
      floor.filter((mesh) => mesh.staticTerrain).forEach(paint);
      rasterizingGround = false;
      c = main;
      textureCache!.ground = layer;
      textureCache!.pixels += layer.width * layer.height;
    }
    c.drawImage(textureCache!.ground, 0, 0);
    floor.filter((mesh) => !mesh.staticTerrain).forEach(paint);
  } else floor.forEach(paint);
  meshes.sort((a, b) => b.depth - a.depth).forEach(paint);
  // Placement guides deliberately overlay cover, so the far-side exits remain selectable.
  if (s.tunnelPlacement) {
    c.save();
    for (const side of ['south'] as const)
      for (const p of tunnelCandidates(s, side)) {
        const selected =
          tunnelCursor && Math.hypot(p.x - tunnelCursor.x, p.y - tunnelCursor.y) < 0.1;
        const color = selected ? '#ffe59b' : side === 'south' ? '#93f5d0' : '#89baff';
        const points = [
          [-0.43, -0.43],
          [0.43, -0.43],
          [0.43, 0.43],
          [-0.43, 0.43],
        ].map(([x, y]) => project(v(p.x + x, p.y + y, 0.06)));
        if (points.every((p) => p.x < 0 || p.x > 960 || p.y < 0 || p.y > 640)) continue;
        c.beginPath();
        points.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
        c.closePath();
        c.fillStyle = selected ? '#fff2a63b' : '#80c9ff14';
        c.fill();
        c.strokeStyle = color;
        c.lineWidth = selected ? 3 : 1.5;
        c.setLineDash([]);
        c.stroke();
      }
    c.restore();
  }
  c.textAlign = 'center';
  c.font = 'bold 11px Arial, sans-serif';
  for (const label of labels) {
    const p = project(label.p);
    if (/^(TUNNEL|SEALING)/.test(label.text)) {
      for (const actor of cast) {
        if (actor.e?.state === 'dead') continue;
        const at = project(v(actor.x, actor.y, 1.32));
        if (Math.abs(p.x - at.x) < 110 && Math.abs(p.y - at.y) < 65) p.x += p.x < 760 ? 140 : -140;
      }
    }
    if (p.x < 30 || p.x > 930 || p.y < 30 || p.y > 610) continue;
    const w = c.measureText(label.text).width;
    c.fillStyle = '#172e36df';
    c.fillRect(p.x - w / 2 - 4, p.y - 12, w + 8, 16);
    c.fillStyle = label.color;
    c.fillText(label.text, p.x, p.y);
  }
  const meters = [
    ...(s.tunnelTransit
      ? []
      : [{ x: s.x, y: s.y, health: s.health, attention: null as number | null }]),
    ...s.enemies
      .filter((e) => e.state !== 'dead')
      .map((e) => ({ x: e.x, y: e.y, health: e.health ?? 100, attention: e.meter })),
  ];
  c.font = 'bold 9px Arial, sans-serif';
  for (const actor of meters) {
    const p = project(v(actor.x, actor.y, 1.32));
    if (p.x < 48 || p.x > 912 || p.y < 30 || p.y > 580) continue;
    const x = Math.round(p.x - 43),
      y = Math.round(p.y - (actor.attention === null ? 30 : 44)),
      health = Math.max(0, Math.min(100, actor.health));
    c.fillStyle = '#07151fee';
    c.beginPath();
    c.roundRect(x - 2, y - 2, 90, actor.attention === null ? 17 : 31, 3);
    c.fill();
    c.strokeStyle = '#c2d8c32c';
    c.lineWidth = 0.6;
    c.stroke();
    c.textAlign = 'left';
    c.fillStyle = '#e7f5e7';
    c.fillText('HP', x + 2, y + 8);
    c.fillStyle = '#314a49';
    c.fillRect(x + 20, y + 1, 44, 7);
    c.fillStyle = health < 30 ? '#fa9d83' : '#7ee2ad';
    c.fillRect(x + 20, y + 1, (44 * health) / 100, 7);
    c.textAlign = 'right';
    c.fillStyle = '#edf8dc';
    c.fillText(String(Math.round(health)), x + 85, y + 8);
    if (actor.attention !== null) {
      const attention = Math.max(0, Math.min(1, actor.attention));
      c.textAlign = 'left';
      c.fillStyle = '#efddb4';
      c.fillText('!', x + 8, y + 21);
      c.fillStyle = '#454338';
      c.fillRect(x + 20, y + 14, 44, 7);
      c.fillStyle = '#f3c466';
      c.fillRect(x + 20, y + 14, 44 * attention, 7);
      c.textAlign = 'right';
      c.fillStyle = '#fff0c4';
      c.fillText(`${Math.round(attention * 100)}%`, x + 85, y + 21);
    }
  }
  c.textAlign = 'center';
  c.font = 'bold 11px Arial, sans-serif';
  if (s.tunnelPlacement) {
    c.fillStyle = '#112939f0';
    c.fillRect(180, 572, 600, 34);
    c.fillStyle = '#ffe59b';
    c.textAlign = 'center';
    c.fillText(`CHOOSE WALL ENTRY · ARROWS + ENTER OR CLICK A MARKED TILE`, 480, 594);
  }
  if (s.phase === 'checkpoint' && s.health <= 0 && /collapse|drown/i.test(s.message)) {
    c.fillStyle = '#2c1724f0';
    c.fillRect(180, 260, 600, 100);
    c.textAlign = 'center';
    c.fillStyle = '#ffc3a8';
    c.font = 'bold 24px Arial, sans-serif';
    c.fillText(/drown/i.test(s.message) ? 'DROWNED' : 'TUNNEL COLLAPSE', 480, 296);
    c.font = '14px Arial, sans-serif';
    c.fillStyle = '#f3e0cd';
    c.fillText('Returning to the district checkpoint…', 480, 328);
  }
  if (s.tunnelTransit) {
    const transit = s.tunnelTransit;
    c.fillStyle = '#102b36ed';
    c.fillRect(220, 558, 520, 64);
    c.fillStyle = '#dce7cb';
    c.textAlign = 'center';
    c.fillText(
      transit.remaining > 0
        ? `MOVING UNDERGROUND · ${Math.ceil(transit.remaining)}s`
        : 'WAITING FOR A CLEAR EXIT',
      480,
      580,
    );
    c.fillStyle = '#405c64';
    c.fillRect(240, 598, 480, 8);
    c.fillStyle = '#c6c896';
    c.fillRect(240, 598, 480 * (1 - transit.remaining / transit.duration), 8);
  }
  if (s.construction) {
    const b = s.barriers.find((b) => b.x === s.construction!.x && b.y === s.construction!.y);
    const action =
      b?.material === 'wire'
        ? 'CUTTING WIRE'
        : b?.material === 'fence'
          ? 'BUILDING LADDER'
          : 'DIGGING TUNNEL';
    c.fillStyle = '#1b343aed';
    c.fillRect(260, 564, 440, 52);
    c.fillStyle = '#c5f0cd';
    c.fillText(`${action} · ${Math.round(s.construction.progress * 100)}%`, 480, 584);
    c.fillStyle = '#50685f';
    c.fillRect(280, 595, 400, 7);
    c.fillStyle = '#a8dfac';
    c.fillRect(280, 595, 400 * s.construction.progress, 7);
  }
  const office = project(v(ox, oy));
  if (office.x < 40 || office.x > 920 || office.y < 30 || office.y > 590) {
    c.fillStyle = '#163c34e8';
    c.fillRect(12, 12, 210, 28);
    c.fillStyle = '#c9f1c4';
    c.textAlign = 'left';
    c.fillText(`${office.x < 480 ? '←' : '→'} ASYLUM OFFICE`, 25, 31);
  }
  // Overview keeps the enlarged seeded district navigable while the main camera follows Alex.
  const mx = 778,
    my = 16,
    scale = 2.5;
  c.fillStyle = '#10242dea';
  c.fillRect(mx - 8, my - 8, MAP_WIDTH * scale + 16, MAP_HEIGHT * scale + 32);
  c.fillStyle = '#334f54';
  c.fillRect(mx, my, MAP_WIDTH * scale, MAP_HEIGHT * scale);
  c.fillStyle = '#4a9cb6';
  for (const tile of s.water) {
    const [x, y] = tile.split(',').map(Number);
    c.fillRect(mx + x * scale, my + y * scale, scale, scale);
  }
  c.fillStyle = '#a49a7d';
  for (const tile of s.walls) {
    const [x, y] = tile.split(',').map(Number);
    c.fillRect(mx + x * scale, my + y * scale, scale, scale);
  }
  for (const b of s.barriers) {
    c.fillStyle = b.open
      ? '#86edb4'
      : b.material === 'wire'
        ? '#b7cfb3'
        : b.material === 'fence'
          ? '#d8b779'
          : '#a6abb8';
    c.fillRect(mx + b.x * scale, my + b.y * scale, scale, scale);
  }
  for (const e of s.enemies) {
    if (e.state === 'dead') continue;
    c.fillStyle = e.faction === 'ICE' || e.faction === 'Border Patrol' ? '#8fbce7' : '#e9a09d';
    c.fillRect(mx + e.x * scale - 1, my + e.y * scale - 1, 3, 3);
  }
  for (const p of [s.office, s]) {
    c.fillStyle = p === s ? '#ffffff' : '#93f5d0';
    c.fillRect(mx + p.x * scale - 2, my + p.y * scale - 2, 4, 4);
  }
  if (s.tunnelPlacement)
    for (const side of ['south'] as const)
      for (const p of tunnelCandidates(s, side)) {
        c.fillStyle = side === 'south' ? '#93f5d0' : '#89baff';
        c.fillRect(mx + p.x * scale - 1, my + p.y * scale - 1, 3, 3);
      }
  c.textAlign = 'left';
  c.font = '10px Arial, sans-serif';
  c.fillStyle = '#dce5d7';
  c.fillText(`SEED ${s.seed}`, mx, my + MAP_HEIGHT * scale + 15);
  c.restore();
}
