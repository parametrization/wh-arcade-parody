import { describe, it, expect } from 'vitest';
import { defaults } from './config';
import { createRandom } from '../../shared/random';
import {
  advanceLoading,
  createModel,
  dispatch,
  loadingStages,
  startModel,
  stripCrate,
  tick,
} from './model';

function ready() {
  const m = createModel();
  startModel(m);
  return m;
}

describe('warehouse loading pipeline', () => {
  it('announces material, visits its truck, retrieves, returns and places exactly once', () => {
    const m = ready();
    tick(m, 0.7, defaults, () => 0.9);
    expect(m.crates).toHaveLength(0);
    expect(m.loadingJobs[0]).toMatchObject({
      lane: 0,
      destination: 0,
      truck: 0,
      sleeve: false,
      phase: 'announce',
      elapsed: 0,
    });
    for (let i = 0; i < loadingStages.length; i++) {
      expect(m.loadingJobs[0].phase).toBe(loadingStages[i].phase);
      advanceLoading(m, loadingStages[i].duration);
    }
    expect(m.loadingJobs).toEqual([]);
    expect(m.crates).toEqual([{ id: 1, lane: 0, destination: 0, sleeve: false, x: 24 }]);
    advanceLoading(m, 10);
    expect(m.crates).toHaveLength(1);
    expect(m.score).toBe(0);
  });

  it('assigns all three lane workers to material-matching normal trucks', () => {
    const m = ready();
    for (let lane = 0; lane < 3; lane++) {
      m.nextSpawn = 0;
      tick(m, 0.01, defaults, () => 0.9);
      expect(m.loadingJobs[lane]).toMatchObject({ lane, destination: lane, truck: lane });
    }
    expect(new Set(m.loadingJobs.map((job) => job.lane)).size).toBe(3);
    advanceLoading(m, 3);
    expect(m.crates.map((crate) => crate.lane)).toEqual([0, 1, 2]);
  });

  it('routes gold packaging through the gold truck and preserves both sleeve outcomes', () => {
    for (const stripped of [false, true]) {
      const m = ready();
      tick(m, 0.7, defaults, () => 0);
      expect(m.loadingJobs[0]).toMatchObject({ truck: 3, sleeve: true });
      advanceLoading(m, 2.5);
      const crate = m.crates[0];
      if (stripped) {
        expect(stripCrate(m, crate.id)).toBe(true);
        expect(stripCrate(m, crate.id)).toBe(false);
      }
      dispatch(m, crate);
      expect(m.score).toBe(stripped ? 15 : 10);
      expect(m.budget).toBe(stripped ? 100 : 92);
    }
  });

  it('loads recovered material before newly selected material without changing its lane ownership', () => {
    const m = ready();
    m.recovery = [2];
    tick(m, 0.7, defaults, () => 0.9);
    expect(m.loadingJobs[0]).toMatchObject({ lane: 0, destination: 2, truck: 2 });
    expect(m.recovery).toEqual([]);
    advanceLoading(m, 2.5);
    expect(m.crates[0]).toMatchObject({ lane: 0, destination: 2 });
  });

  it('drains pending jobs before completing a shift and does not advance outside active play', () => {
    const m = ready();
    tick(m, 0.7, defaults, () => 0.9);
    m.elapsed = defaults.shiftSeconds;
    tick(m, 0.01, defaults, () => 0.9);
    expect(m.phase).toBe('shift');
    const before = structuredClone(m.loadingJobs);
    advanceLoading(m, 0);
    advanceLoading(m, Number.NaN);
    expect(m.loadingJobs).toEqual(before);
    m.phase = 'title';
    advanceLoading(m, 5);
    expect(m.loadingJobs).toEqual(before);
    m.phase = 'shift';
    advanceLoading(m, 3);
    expect(m.crates).toHaveLength(1);
    m.crates = [];
    tick(m, 0.01, defaults, () => 0.9);
    expect(m.phase).toBe('upgrade');
  });

  it('is deterministic and never assigns simultaneous jobs to one worker', () => {
    const a = ready(),
      b = ready();
    const ra = createRandom(77),
      rb = createRandom(77);
    for (let frame = 0; frame < 1200; frame++) {
      tick(a, 1 / 60, defaults, ra.next);
      tick(b, 1 / 60, defaults, rb.next);
      expect(new Set(a.loadingJobs.map((job) => job.lane)).size).toBe(a.loadingJobs.length);
    }
    expect(a).toEqual(b);
  });
});
