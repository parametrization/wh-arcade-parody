export const materialNames = [
  'limestone',
  'concrete',
  'soil',
  'sandstone',
  'wood',
  'leather',
  'steel',
  'mesh',
  'canvas',
  'wool',
  'denim',
  'straw',
  'water',
  'rock',
  'plaster',
  'asphalt',
] as const;
export type MaterialName = (typeof materialNames)[number];
let atlas: HTMLImageElement | null = null;
function image() {
  if (!atlas && typeof Image !== 'undefined') {
    atlas = new Image();
    atlas.src = '/assets/fidelity/materials.png';
  }
  return atlas?.complete && atlas.naturalWidth ? atlas : null;
}
/** Readiness of the exact atlas instance used by texture drawing. */
export function materialReady() {
  return image() !== null;
}
/** Project atlas UVs onto a mesh face; texture moves with geometry, never the screen. */
export function textureFace(
  c: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  name: MaterialName,
  opacity = 0.25,
) {
  const source = image();
  if (!source || points.length < 3 || opacity <= 0) return;
  const index = materialNames.indexOf(name),
    size = source.naturalWidth / 4;
  const sx = (index % 4) * size,
    sy = Math.floor(index / 4) * size;
  const uv =
    points.length === 4
      ? [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]
      : points.map((_, i) => [
          0.5 + Math.cos((i * Math.PI * 2) / points.length) * 0.5,
          0.5 + Math.sin((i * Math.PI * 2) / points.length) * 0.5,
        ]);
  c.save();
  c.globalAlpha *= opacity;
  for (let i = 1; i < points.length - 1; i++) {
    const ids = [0, i, i + 1],
      [p, q, r] = ids.map((i) => points[i]),
      [u, v, w] = ids.map((i) => uv[i]);
    const ax = v[0] - u[0],
      ay = v[1] - u[1],
      bx = w[0] - u[0],
      by = w[1] - u[1],
      det = ax * by - ay * bx;
    if (Math.abs(det) < 1e-7) continue;
    const a = ((q.x - p.x) * by - (r.x - p.x) * ay) / det,
      b = ((q.y - p.y) * by - (r.y - p.y) * ay) / det;
    const cc = ((r.x - p.x) * ax - (q.x - p.x) * bx) / det,
      d = ((r.y - p.y) * ax - (q.y - p.y) * bx) / det;
    c.save();
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(q.x, q.y);
    c.lineTo(r.x, r.y);
    c.closePath();
    c.clip();
    c.transform(a, b, cc, d, p.x - a * u[0] - cc * u[1], p.y - b * u[0] - d * u[1]);
    c.drawImage(source, sx + 0.5, sy + 0.5, size - 1, size - 1, 0, 0, 1, 1);
    c.restore();
  }
  c.restore();
}
export function textureRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  name: MaterialName,
  opacity = 0.3,
) {
  textureFace(
    c,
    [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
    name,
    opacity,
  );
}

const tiles = new Map<MaterialName, HTMLCanvasElement>();
const patterns = new WeakMap<CanvasRenderingContext2D, Map<MaterialName, CanvasPattern>>();
/** World-anchored repeating UVs: adjacent terrain triangles share texels and scale. */
export function textureWorldFace(
  c: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  world: readonly { x: number; y: number; z: number }[],
  name: MaterialName,
  opacity = 0.25,
) {
  const source = image();
  if (!source || points.length < 3 || points.length !== world.length) return;
  let tile = tiles.get(name);
  if (!tile) {
    tile = document.createElement('canvas');
    tile.width = tile.height = 256;
    const index = materialNames.indexOf(name),
      size = source.naturalWidth / 4;
    tile
      .getContext('2d')!
      .drawImage(
        source,
        (index % 4) * size + 0.5,
        Math.floor(index / 4) * size + 0.5,
        size - 1,
        size - 1,
        0,
        0,
        256,
        256,
      );
    tiles.set(name, tile);
  }
  let cache = patterns.get(c);
  if (!cache) {
    cache = new Map();
    patterns.set(c, cache);
  }
  let pattern = cache.get(name);
  if (!pattern) {
    pattern = c.createPattern(tile, 'repeat') ?? undefined;
    if (!pattern) return;
    pattern.setTransform(new DOMMatrix().scale(3 / 256));
    cache.set(name, pattern);
  }
  const range = (axis: 'x' | 'y' | 'z') =>
    Math.max(...world.map((p) => p[axis])) - Math.min(...world.map((p) => p[axis]));
  const uv =
    range('z') < 0.05
      ? world.map((p) => [p.x, p.y])
      : range('x') >= range('y')
        ? world.map((p) => [p.x, -p.z])
        : world.map((p) => [p.y, -p.z]);
  c.save();
  c.globalAlpha *= opacity;
  for (let i = 1; i < points.length - 1; i++) {
    const ids = [0, i, i + 1],
      [p, q, r] = ids.map((i) => points[i]),
      [u, v, w] = ids.map((i) => uv[i]);
    const ax = v[0] - u[0],
      ay = v[1] - u[1],
      bx = w[0] - u[0],
      by = w[1] - u[1],
      det = ax * by - ay * bx;
    if (Math.abs(det) < 1e-7) continue;
    const a = ((q.x - p.x) * by - (r.x - p.x) * ay) / det,
      b = ((q.y - p.y) * by - (r.y - p.y) * ay) / det,
      cc = ((r.x - p.x) * ax - (q.x - p.x) * bx) / det,
      d = ((r.y - p.y) * ax - (q.y - p.y) * bx) / det;
    c.save();
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(q.x, q.y);
    c.lineTo(r.x, r.y);
    c.closePath();
    c.clip();
    c.transform(a, b, cc, d, p.x - a * u[0] - cc * u[1], p.y - b * u[0] - d * u[1]);
    c.fillStyle = pattern;
    const minX = Math.min(u[0], v[0], w[0]),
      minY = Math.min(u[1], v[1], w[1]);
    c.fillRect(minX, minY, Math.max(u[0], v[0], w[0]) - minX, Math.max(u[1], v[1], w[1]) - minY);
    c.restore();
  }
  c.restore();
}
