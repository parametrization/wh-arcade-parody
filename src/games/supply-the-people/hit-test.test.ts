import { describe, expect, it } from 'vitest';
import { hitTarget } from './hit-test';
import type { Crate } from './model';

describe('visible supply pointer targets', () => {
  const crates: Crate[] = [{ id: 7, x: 100, lane: 0, destination: 1, sleeve: true }];
  it('accepts the raised sleeve but ignores empty floor beneath the same crate', () => {
    expect(hitTarget(crates, 100, 273)).toEqual({ kind: 'crate', id: 7, lane: 0 });
    expect(hitTarget(crates, 100, 340)).toBeNull();
  });
  it('does not cycle a gate when the pointer is in the inter-lane gap', () => {
    expect(hitTarget(crates, 580, 300)).toEqual({ kind: 'gate', lane: 0 });
    expect(hitTarget(crates, 580, 345)).toBeNull();
    expect(hitTarget(crates, 639, 300)).toBeNull();
  });
  it('removes the raised label target once its sleeve is stripped', () => {
    expect(hitTarget([{ ...crates[0], sleeve: false }], 78, 273)).toBeNull();
    expect(hitTarget([{ ...crates[0], sleeve: false }], 100, 295)?.kind).toBe('crate');
  });
});

it('maps each visible lane and rejects truck loading workspace and inter-lane gaps', () => {
  for (const [lane, y] of [300, 410, 520].entries()) {
    const crate: Crate = {
      id: lane + 1,
      x: 200,
      lane: lane as 0 | 1 | 2,
      destination: 0,
      sleeve: true,
    };
    expect(hitTarget([crate], 200, y)).toEqual({ kind: 'crate', id: lane + 1, lane });
    expect(hitTarget([crate], 580, y)).toEqual({ kind: 'gate', lane });
    expect(hitTarget([crate], 200, y + 50)).toBeNull();
  }
  expect(hitTarget([], 100, 150)).toBeNull();
  expect(hitTarget([], NaN, 300)).toBeNull();
});
