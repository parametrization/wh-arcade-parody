/** Authored, connected crossings shared by collision and scene geometry. */
export type Terrain = 'ground' | 'canyon' | 'river' | 'bridge' | 'fence' | 'climb' | 'wall';
export interface CameraDefinition {
  id: number;
  x: number;
  y: number;
  heading: number;
  range: number;
  halfAngle: number;
  period: number;
}
export function getTerrain(district: number, x: number, y: number): Terrain {
  if (x <= 0 || x >= 23 || y <= 0 || y >= 17) return 'wall';
  const crossing = [4, 5, 8, 9, 13, 14].includes(y);
  if (x === 8 || x === 9) return crossing ? 'bridge' : 'canyon';
  if (x === 15 || x === 16) return crossing ? 'bridge' : 'river';
  if (x === 20) return [5, 9, 13].includes(y) ? 'climb' : 'fence';
  // Later districts add small rocks, leaving each approach and dock loop open.
  if (district >= 1 && x === 11 && y === 11) return 'wall';
  if (district >= 2 && x === 18 && y === 3) return 'wall';
  return 'ground';
}
export function terrainBlocked(district: number, x: number, y: number) {
  return ['wall', 'canyon', 'river', 'fence'].includes(getTerrain(district, x, y));
}
export function cameras(district: number): CameraDefinition[] {
  return [
    { id: 0, x: 11, y: 3, heading: Math.PI / 2, range: 3.8, halfAngle: 0.35, period: 8 },
    ...(district >= 1
      ? [{ id: 1, x: 18, y: 12, heading: Math.PI, range: 4, halfAngle: 0.38, period: 10 }]
      : []),
    ...(district >= 2
      ? [{ id: 2, x: 22, y: 6, heading: Math.PI, range: 3.5, halfAngle: 0.35, period: 7 }]
      : []),
  ];
}
