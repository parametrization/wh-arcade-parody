import { describe, it, expect } from 'vitest';
import {
  activateCatch,
  buy,
  collect,
  continueRound,
  createModel,
  miss,
  resolveCatches,
  startModel,
  trade,
  practiceNext,
  practicePass,
  tick,
  moveNet,
  laneX,
  returnPromise,
  netOverlap,
} from './model';
import { createRandom } from '../../shared/random';
import { defaults, validateConfig } from './config';
describe('public dividend rules', () => {
  it('allows retrying a missed practice catch after correcting the lane', () => {
    const m = createModel(true);
    startModel(m);
    practiceNext(m, () => 0);
    expect(activateCatch(m)).toBe(true);
    resolveCatches(m);
    expect(m.targets).toHaveLength(1);
    moveNet(m, laneX[0]);
    expect(activateCatch(m)).toBe(true);
    resolveCatches(m);
    expect(m.targets).toHaveLength(0);
    expect(m.resources[0]).toBe(1);
  });
  it('automatically catches aligned cargo without a catch action', () => {
    const m = createModel();
    startModel(m);
    m.targets = [
      { id: 1, type: 0, lane: 1, y: 295, warning: 0 },
      { id: 2, type: 1, lane: 0, y: 295, warning: 0 },
    ];
    resolveCatches(m);
    expect(m.resources[0]).toBe(1);
    resolveCatches(m);
    expect(m.resources).toEqual([1, 0, 0, 0]);
    expect(m.targets).toHaveLength(1);
  });
  it('requires strictly over half a promise inside the net and returns it without a catch press', () => {
    const m = createModel();
    startModel(m);
    const promise = {
      id: 1,
      type: 4 as const,
      lane: 1,
      y: 302,
      warning: 0,
      promiseType: 2 as const,
    };
    m.targets = [promise];
    expect(netOverlap(m, promise)).toBe(0.5);
    expect(returnPromise(m, () => 0.9)).toBe(false);
    promise.y = 303;
    expect(returnPromise(m, () => 0.9)).toBe(true);
    expect(m.targets).toHaveLength(0);
    expect(m.reaction).toMatchObject({ kind: 'capitulation', type: 2, lane: 1 });
    expect(m.resources).toEqual([0, 0, 0, 0]);
  });
  it('does not collect warning previews or cargo above the rear edge', () => {
    const m = createModel();
    startModel(m);
    m.targets = [
      { id: 1, type: 0, lane: 1, y: 281, warning: 0 },
      { id: 2, type: 1, lane: 1, y: 310, warning: 1 },
    ];
    resolveCatches(m);
    expect(m.score).toBe(0);
    m.targets[0].y = 282;
    resolveCatches(m);
    expect(m.resources[0]).toBe(1);
    expect(m.targets).toHaveLength(1);
  });
  it('uses the drawn tapered sides instead of a rectangular promise catch region', () => {
    const m = createModel();
    startModel(m);
    m.netX = 354;
    const promise = { id: 1, type: 4 as const, lane: 1, y: 315, warning: 0 };
    m.targets = [promise];
    // Rectangular bounds would incorrectly report 64%; actual silhouette is 47.75%.
    expect(netOverlap(m, promise)).toBeCloseTo(0.4775);
    expect(returnPromise(m, () => 0.9)).toBe(false);
    resolveCatches(m);
    expect(m.targets).toHaveLength(1);
    moveNet(m, 350);
    resolveCatches(m);
    expect(m.storedPromises).toHaveLength(1);
  });
  it('rejects cargo outside the tapered front while accepting exact rear-edge contact', () => {
    const m = createModel();
    startModel(m);
    m.netX = 371;
    m.targets = [{ id: 1, type: 0, lane: 1, y: 350, warning: 0 }];
    // x=300..340,y=330..370 reaches rectangular bounds, but misses the tapered surface.
    resolveCatches(m);
    expect(m.targets).toHaveLength(1);
    m.netX = 320;
    m.targets[0].y = 282;
    resolveCatches(m);
    expect(m.resources[0]).toBe(1);
  });
  it('education buys more movement time by slowing falling cargo eight percent per level', () => {
    const normal = createModel(),
      educated = createModel();
    for (const m of [normal, educated]) {
      startModel(m);
      m.spawnIn = 10;
      m.targets = [{ id: 1, type: 0, lane: 0, y: 100, warning: 0 }];
    }
    educated.levels[0] = 2;
    tick(normal, 1, defaults, () => 0);
    tick(educated, 1, defaults, () => 0);
    expect(educated.targets[0].y - 100).toBeCloseTo((normal.targets[0].y - 100) * 0.84);
  });
  it('enforces one affordable upgrade per investment phase', () => {
    const m = createModel();
    m.phase = 'invest';
    m.resources = [3, 3, 3, 2];
    expect(buy(m, 0)).toBe(true);
    expect(buy(m, 1)).toBe(false);
    expect(m.resources).toEqual([0, 3, 3, 1]);
    continueRound(m);
    expect(m.round).toBe(2);
    expect(m.phase).toBe('round');
  });
  it('requires all three services after final investment and conserves exchanges', () => {
    const m = createModel();
    m.phase = 'invest';
    m.round = 5;
    m.resources = [4, 0, 3, 1];
    expect(trade(m, 0, 1)).toBe(true);
    expect(m.resources).toEqual([2, 1, 3, 1]);
    expect(trade(m, 0, 0)).toBe(false);
    m.levels = [1, 1, 0];
    expect(buy(m, 2)).toBe(true);
    continueRound(m);
    expect(m.phase).toBe('won');
  });
  it('repairs through consecutive catches and keeps hollow promises resource-free', () => {
    const m = createModel();
    startModel(m);
    m.integrity = 3;
    for (let i = 0; i < 3; i++) collect(m, { id: i, type: 0, lane: 1, y: 290, warning: 0 });
    expect(m.integrity).toBe(4);
    collect(m, { id: 5, type: 4, lane: 1, y: 290, warning: 0 });
    expect(m.resources).toEqual([3, 0, 0, 0]);
    expect(m.cooldown).toBe(0.8);
  });
  it('makes a full untimed campaign winnable with keyboard-equivalent actions', () => {
    const m = createModel(true);
    startModel(m);
    for (let round = 1; round <= 5; round++) {
      for (let item = 0; item < 20; item++) {
        practiceNext(m, () => 0.5);
        if (m.targets[0].type === 4) practicePass(m);
        else {
          activateCatch(m);
          resolveCatches(m);
        }
      }
      practiceNext(m, () => 0.5);
      expect(m.phase).toBe('invest');
      if (round <= 3) expect(buy(m, round - 1)).toBe(true);
      continueRound(m);
    }
    expect(m.phase).toBe('won');
  });
  it('rejects invalid config atomically and retains practice integrity', () => {
    expect(() => validateConfig(defaults, { speed: 0.8, practice: 'no' })).toThrow();
    expect(defaults.speed).toBe(1);
    const m = createModel(true);
    m.integrity = 1;
    miss(m, { id: 1, type: 0, lane: 0, y: 400, warning: 0 });
    expect(m.integrity).toBe(1);
  });
  it('wins timed five-round campaigns with speed-limited movement and actual catch windows', () => {
    for (const seed of [1, 42, 981]) {
      const m = createModel(),
        random = createRandom(seed);
      startModel(m);
      for (let frame = 0; frame < 18000; frame++) {
        if (m.phase === 'invest') {
          const missing = m.levels.findIndex((level) => level === 0);
          if (missing >= 0) buy(m, missing);
          continueRound(m);
        }
        if (m.phase !== 'round') break;
        const target = m.targets.filter((item) => item.type !== 4).sort((a, b) => b.y - a.y)[0];
        if (target) {
          const distance = laneX[target.lane] - m.netX;
          moveNet(m, m.netX + Math.sign(distance) * Math.min(Math.abs(distance), 300 / 60));
          if (target.y >= 291) activateCatch(m);
        }
        tick(m, 1 / 60, defaults, random.next);
      }
      expect(m.phase, `seed ${seed}`).toBe('won');
      expect(m.levels.every((level) => level >= 1)).toBe(true);
      expect(m.integrity).toBeGreaterThan(0);
    }
  });
});
