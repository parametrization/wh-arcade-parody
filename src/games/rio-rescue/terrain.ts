export const MAP_WIDTH = 48,
  MAP_HEIGHT = 36;
export type Terrain =
  | 'ground'
  | 'canyon'
  | 'river'
  | 'bridge'
  | 'fence'
  | 'climb'
  | 'wall'
  | 'mesa'
  | 'plateau'
  | 'mountain';
export interface CameraDefinition {
  id: number;
  x: number;
  y: number;
  heading: number;
  range: number;
  halfAngle: number;
  period: number;
}
interface MapData {
  cells: Terrain[];
  heights: number[];
}
const cache = new Map<string, MapData>();
function generate(district: number, seed: number): MapData {
  const key = `${district}:${seed}`;
  const cached = cache.get(key);
  if (cached) return cached;
  let rng = (seed + district * 104729) >>> 0;
  const random = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  const cells: Terrain[] = Array(MAP_WIDTH * MAP_HEIGHT).fill('ground'),
    heights = Array(cells.length).fill(0);
  const features = Array.from({ length: 12 }, (_, i) => ({
    x: 10 + random() * 33,
    y: 3 + random() * 29,
    rx: 2 + random() * 4,
    ry: 2 + random() * 5,
    type: (['canyon', 'mesa', 'plateau', 'mountain'] as const)[i % 4],
    height: 1 + random() * 3,
  }));
  const phase = random() * 6.28;
  const fenceX = 43 + (seed % 2);
  const climbs = new Set([
    8,
    9,
    24,
    25,
    3 + Math.floor(random() * 3),
    14 + Math.floor(random() * 4),
    30 + Math.floor(random() * 3),
  ]);
  for (let y = 0; y < MAP_HEIGHT; y++)
    for (let x = 0; x < MAP_WIDTH; x++) {
      const i = y * MAP_WIDTH + x;
      if (x === 0 || y === 0 || x === 47 || y === 35) {
        cells[i] = 'wall';
        heights[i] = 1;
        continue;
      }
      for (const f of features) {
        const r = ((x - f.x) / f.rx) ** 2 + ((y - f.y) / f.ry) ** 2;
        if (r < 1 + Math.sin(x * 1.7 + y * 0.9 + phase) * 0.16) {
          cells[i] = f.type;
          heights[i] =
            f.type === 'canyon' ? -2.5 : f.height * (f.type === 'mountain' ? 1 - r * 0.5 : 1);
        }
      }
      const riverX =
        29 + Math.round(Math.sin(y * 0.22 + phase) * 3 + Math.sin(y * 0.51 + phase) * 1.5);
      if (Math.abs(x - riverX) <= 1) {
        cells[i] = 'river';
        heights[i] = -0.4;
      }
      // Two cross-map access corridors and west-bank refuge guarantee safe returns.
      if (x <= 7 || y === 8 || y === 9 || y === 24 || y === 25) {
        cells[i] = cells[i] === 'river' || cells[i] === 'canyon' ? 'bridge' : 'ground';
        heights[i] = 0;
      }
      // Final border spans the eastern approach; varied climb sections keep both sides reachable.
      if (x >= fenceX - 3) {
        cells[i] = 'ground';
        heights[i] = 0;
      }
      if (x === fenceX) {
        cells[i] = climbs.has(y) ? 'climb' : 'fence';
        heights[i] = 0;
      }
    }
  const data = { cells, heights };
  cache.set(key, data);
  return data;
}
export function getTerrain(district: number, x: number, y: number, seed = 1): Terrain {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return 'wall';
  return generate(district, seed).cells[Math.floor(y) * MAP_WIDTH + Math.floor(x)];
}
export function terrainHeight(district: number, x: number, y: number, seed = 1) {
  return generate(district, seed).heights[Math.floor(y) * MAP_WIDTH + Math.floor(x)] ?? 0;
}
export function terrainBlocked(district: number, x: number, y: number, seed = 1) {
  return ['wall', 'canyon', 'fence', 'mountain', 'mesa', 'plateau'].includes(
    getTerrain(district, x, y, seed),
  );
}
export function riverCurrent(district: number, x: number, y: number, seed = 1) {
  return getTerrain(district, x, y, seed) === 'river' ? { x: 0, y: 1 } : null;
}
export function cameras(district: number, seed = 1): CameraDefinition[] {
  const out: CameraDefinition[] = [];
  for (let i = 0; i <= district; i++) {
    let x = 10 + (((seed * 7 + i * 13) >>> 0) % 32),
      y = 3 + (((seed * 11 + i * 9) >>> 0) % 28);
    for (let j = 0; j < MAP_WIDTH * MAP_HEIGHT; j++) {
      if (!terrainBlocked(district, x, y, seed) && getTerrain(district, x, y, seed) !== 'river')
        break;
      x++;
      if (x >= 46) {
        x = 8;
        y = y >= 33 ? 2 : y + 1;
      }
    }
    out.push({ id: i, x, y, heading: Math.PI / 2, range: 3.8, halfAngle: 0.35, period: 8 + i });
  }
  return out;
}
