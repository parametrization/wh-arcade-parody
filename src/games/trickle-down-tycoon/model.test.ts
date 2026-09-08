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
  it('only catches aligned targets during a live window', () => {
    const m = createModel();
    startModel(m);
    m.targets = [
      { id: 1, type: 0, lane: 1, y: 295, warning: 0 },
      { id: 2, type: 1, lane: 0, y: 295, warning: 0 },
    ];
    resolveCatches(m);
    expect(m.resources[0]).toBe(0);
    activateCatch(m);
    resolveCatches(m);
    expect(m.resources).toEqual([1, 0, 0, 0]);
    expect(m.targets).toHaveLength(1);
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
