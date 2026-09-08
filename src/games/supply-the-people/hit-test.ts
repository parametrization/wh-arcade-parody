import type { Crate, Destination } from './model';

export type SupplyHit =
  { kind: 'crate'; id: number; lane: Destination } | { kind: 'gate'; lane: Destination };

/** Pointer targets follow the drawn crate/sleeve and gate, not the whole lane. */
export function hitTarget(crates: readonly Crate[], x: number, y: number): SupplyHit | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  for (let index = crates.length - 1; index >= 0; index--) {
    const crate = crates[index];
    const top = 119 + crate.lane * 79;
    const left = Math.round(crate.x) - (crate.sleeve ? 24 : 18);
    const right = Math.round(crate.x) + (crate.sleeve ? 25 : 20);
    if (x >= left && x <= right && y >= top - (crate.sleeve ? 11 : 5) && y <= top + 35) {
      return { kind: 'crate', id: crate.id, lane: crate.lane };
    }
  }
  for (let lane = 0; lane < 3; lane++) {
    const top = 107 + lane * 79;
    if (x >= 522 && x <= 630 && y >= top && y <= top + 61) {
      return { kind: 'gate', lane: lane as Destination };
    }
  }
  return null;
}
