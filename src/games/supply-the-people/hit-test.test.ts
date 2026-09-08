import { describe, expect, it } from 'vitest';
import { hitTarget } from './hit-test';
import type { Crate } from './model';

describe('visible supply pointer targets', () => {
  const crates: Crate[] = [{ id: 7, x: 100, lane: 0, destination: 1, sleeve: true }];
  it('accepts the raised sleeve but ignores empty floor beneath the same crate', () => {
    expect(hitTarget(crates, 100, 110)).toEqual({ kind: 'crate', id: 7, lane: 0 });
    expect(hitTarget(crates, 100, 175)).toBeNull();
  });
  it('does not cycle a gate when the pointer is in the inter-lane gap', () => {
    expect(hitTarget(crates, 580, 135)).toEqual({ kind: 'gate', lane: 0 });
    expect(hitTarget(crates, 580, 177)).toBeNull();
    expect(hitTarget(crates, 639, 135)).toBeNull();
  });
  it('removes the raised label target once its sleeve is stripped', () => {
    expect(hitTarget([{ ...crates[0], sleeve: false }], 78, 110)).toBeNull();
    expect(hitTarget([{ ...crates[0], sleeve: false }], 100, 130)?.kind).toBe('crate');
  });
});
