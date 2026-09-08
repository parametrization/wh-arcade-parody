export const MAP_WIDTH = 64,
  MAP_HEIGHT = 48,
  BORDER_Y = 23;
export type BarrierMaterial = 'wire' | 'fence' | 'concrete';
export interface Barrier {
  x: number;
  y: number;
  material: BarrierMaterial;
  progress: number;
  open: boolean;
  remaining: number;
  repairProgress: number;
}
export const barrierRules = {
  wire: { seconds: 3, lifetime: 0, speed: 1 },
  fence: { seconds: 5, lifetime: 20, speed: 0.65 },
  concrete: { seconds: 10, lifetime: 0, speed: 0.4 },
} as const;
export function createBarriers(seed = 1): Barrier[] {
  let rng = seed >>> 0,
    remaining = 0,
    material: BarrierMaterial = 'wire';
  const random = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  return Array.from({ length: MAP_WIDTH - 2 }, (_, i) => {
    if (!remaining) {
      material = (['wire', 'fence', 'concrete'] as const)[Math.floor(i / 7) % 3];
      remaining = 4 + Math.floor(random() * 6);
    }
    remaining--;
    return {
      x: i + 1,
      y: BORDER_Y,
      material,
      progress: 0,
      open: false,
      remaining: 0,
      repairProgress: 0,
    };
  });
}
