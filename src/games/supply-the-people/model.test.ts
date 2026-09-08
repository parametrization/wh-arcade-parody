import { describe, it, expect } from 'vitest';
import {
  createModel,
  dispatch,
  stripCrate,
  upgrade,
  tick,
  startModel,
  cycleGate,
  lockGate,
} from './model';
import { createRandom } from '../../shared/random';
import { defaults, validateConfig } from './config';
describe('cooperative rules', () => {
  it('strips a sleeve once without discarding food', () => {
    const m = createModel();
    startModel(m);
    m.crates = [{ id: 1, lane: 0, destination: 0, x: 40, sleeve: true }];
    expect(stripCrate(m, 1)).toBe(true);
    expect(stripCrate(m, 1)).toBe(false);
    expect(m.score).toBe(5);
    expect(m.crates).toHaveLength(1);
  });
  it('recovers misroutes and balances deliveries without exceeding budget', () => {
    const m = createModel();
    startModel(m);
    dispatch(m, { id: 1, lane: 0, destination: 1, x: 500, sleeve: true });
    expect(m.budget).toBe(88);
    expect(m.recovery).toEqual([1]);
    for (let i = 0; i < 3; i++)
      dispatch(m, {
        id: i,
        lane: i as 0 | 1 | 2,
        destination: i as 0 | 1 | 2,
        x: 500,
        sleeve: false,
      });
    expect(m.score).toBe(50);
    expect(m.budget).toBe(93);
  });
  it('requires balanced campaign delivery and upgrade selection is single use', () => {
    const m = createModel();
    m.phase = 'upgrade';
    upgrade(m, 'bell');
    upgrade(m, 'bell');
    expect(m.shift).toBe(2);
    expect(m.bellBonus).toBe(2);
    m.shift = 3;
    m.elapsed = 45;
    m.crates = [];
    m.delivered = [20, 8, 8];
    tick(m, 1 / 60, defaults, () => 0.5);
    expect(m.phase).toBe('won');
  });
  it('preserves practice budget and rejects a config patch atomically', () => {
    const m = createModel(true);
    startModel(m);
    m.budget = 1;
    dispatch(m, { id: 1, lane: 0, destination: 2, x: 500, sleeve: true });
    expect(m.budget).toBe(1);
    expect(() => validateConfig(defaults, { speed: 0.8, shiftSeconds: -5 })).toThrow();
    expect(defaults.speed).toBe(1);
  });
  it('wins full default campaigns with an observable strip-and-route strategy', () => {
    for (const seed of [1, 42, 981]) {
      const m = createModel(),
        random = createRandom(seed);
      startModel(m);
      for (let frame = 0; frame < 18000; frame++) {
        if (m.phase === 'upgrade') upgrade(m, 'handling');
        if (m.phase !== 'shift') break;
        for (const crate of m.crates) stripCrate(m, crate.id);
        for (let lane = 0; lane < 3; lane++) {
          const next = m.crates.filter((crate) => crate.lane === lane).sort((a, b) => b.x - a.x)[0];
          if (next) while (m.gates[lane] !== next.destination) cycleGate(m, lane as 0 | 1 | 2);
          lockGate(m, lane as 0 | 1 | 2);
        }
        tick(m, 1 / 60, defaults, random.next);
      }
      expect(m.phase, `seed ${seed}`).toBe('won');
      expect(Math.min(...m.delivered)).toBeGreaterThanOrEqual(8);
      expect(m.budget).toBe(100);
    }
  });
  it('continues endless campaigns beyond shift three', () => {
    const m = createModel(false, true);
    startModel(m);
    m.shift = 3;
    m.elapsed = 45;
    tick(m, 1 / 60, defaults, () => 0.5);
    expect(m.phase).toBe('upgrade');
    upgrade(m, 'recovery');
    expect(m.shift).toBe(4);
    expect(m.phase).toBe('shift');
  });
});
