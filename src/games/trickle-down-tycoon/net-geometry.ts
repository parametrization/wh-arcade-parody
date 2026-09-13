export type Point = [number, number];
export const ICON_SIZE = 40;

/** Shared vertices for the net's rear, front and beveled sides. */
export function netGeometry(x: number, width: number) {
  const rearLeft: Point = [x - width, 302],
    rearRight: Point = [x + width, 302];
  const shoulderLeft: Point = [x - width + 9, 315],
    shoulderRight: Point = [x + width - 9, 315];
  const sideLeft: Point = [x - width + 10, 324],
    sideRight: Point = [x + width - 10, 324];
  const frontLeft: Point = [x - width + 20, 334],
    frontRight: Point = [x + width - 20, 334];
  return {
    outline: [rearLeft, rearRight, sideRight, frontRight, frontLeft, sideLeft],
    back: [rearLeft, rearRight, shoulderRight, shoulderLeft],
    front: [shoulderLeft, shoulderRight, frontRight, frontLeft],
    left: [rearLeft, shoulderLeft, frontLeft, sideLeft],
    right: [rearRight, shoulderRight, frontRight, sideRight],
  };
}

/** Sutherland–Hodgman intersection with the icon's axis-aligned bounds. */
export function netIconIntersection(netX: number, width: number, iconX: number, iconY: number) {
  let polygon = netGeometry(netX, width).outline;
  const half = ICON_SIZE / 2;
  for (const [axis, boundary, direction] of [
    [0, iconX - half, 1],
    [0, iconX + half, -1],
    [1, iconY - half, 1],
    [1, iconY + half, -1],
  ]) {
    if (!polygon.length) break;
    const result: Point[] = [];
    const inside = (point: Point) => (point[axis] - boundary) * direction >= 0;
    let previous = polygon[polygon.length - 1];
    for (const current of polygon) {
      if (inside(current) !== inside(previous)) {
        const t = (boundary - previous[axis]) / (current[axis] - previous[axis]);
        result.push([
          previous[0] + t * (current[0] - previous[0]),
          previous[1] + t * (current[1] - previous[1]),
        ]);
      }
      if (inside(current)) result.push(current);
      previous = current;
    }
    polygon = result;
  }
  return polygon;
}
export function polygonArea(polygon: Point[]) {
  return (
    Math.abs(
      polygon.reduce((sum, point, index) => {
        const next = polygon[(index + 1) % polygon.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0),
    ) / 2
  );
}
