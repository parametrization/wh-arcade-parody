export type BarrierMaterial = 'wire' | 'fence' | 'concrete';
export interface Barrier {
  x: number;
  y: number;
  material: BarrierMaterial;
  progress: number;
  open: boolean;
  remaining: number;
}
export const barrierRules = {
  wire: { seconds: 3, lifetime: 0, speed: 1 },
  fence: { seconds: 5, lifetime: 20, speed: 0.65 },
  concrete: { seconds: 10, lifetime: 0, speed: 0.4 },
} as const;
export function createBarriers(): Barrier[] {
  return Array.from({ length: 30 }, (_, i) => ({
    x: i + 1,
    y: 10,
    material: i < 10 ? 'wire' : i < 20 ? 'fence' : 'concrete',
    progress: 0,
    open: false,
    remaining: 0,
  }));
}
