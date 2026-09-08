import { describe, expect, it } from 'vitest';
import { defaults } from './config';
import {
  collect,
  createModel,
  startModel,
  returnPromise,
  tickReaction,
  toggleUmbrella,
  tick,
  practiceNext,
  laneX,
  buy,
} from './model';

function ready(practice = false) {
  const m = createModel(practice);
  startModel(m);
  return m;
}
function promise(m: ReturnType<typeof ready>, type: 0 | 1 | 2 | 3, lane: number) {
  collect(m, { id: ++m.serial, type: 4, promiseType: type, lane, y: 295, warning: 0 });
}

describe('returned promise reactions', () => {
  it('retains original resource and lane in FIFO order and refuses concurrent returns', () => {
    const m = ready();
    promise(m, 2, 0);
    promise(m, 1, 2);
    expect(m.storedPromises).toEqual([
      { type: 2, lane: 0 },
      { type: 1, lane: 2 },
    ]);
    expect(returnPromise(m, () => 0)).toBe(true);
    expect(m.reaction).toMatchObject({ kind: 'flood', phase: 'filling', type: 2, lane: 0 });
    const snapshot = structuredClone(m.reaction);
    expect(returnPromise(m, () => 0.9)).toBe(false);
    expect(m.reaction).toEqual(snapshot);
    expect(m.storedPromises).toEqual([{ type: 1, lane: 2 }]);
    tickReaction(m, 20);
    expect(returnPromise(m, () => 0.9)).toBe(true);
    expect(m.reaction).toMatchObject({ kind: 'capitulation', type: 1, lane: 2 });
  });

  it('requires a stored promise and a running round', () => {
    const m = ready();
    expect(returnPromise(m, () => 0)).toBe(false);
    promise(m, 0, 1);
    m.phase = 'invest';
    expect(returnPromise(m, () => 0)).toBe(false);
    expect(m.storedPromises).toHaveLength(1);
  });

  it('keeps filling dry, then accumulates fractional aligned exposure only without an umbrella', () => {
    const m = ready();
    promise(m, 0, 1);
    returnPromise(m, () => 0);
    tickReaction(m, 1.5);
    expect(m.reaction?.phase).toBe('filling');
    expect(m.wetSeconds).toBe(0);
    tickReaction(m, 0.5);
    expect(m.reaction?.phase).toBe('overflow');
    tickReaction(m, 0.25);
    expect(m.wetSeconds).toBeCloseTo(0.25);
    expect(m.speedMult).toBeCloseTo(0.9975);
    toggleUmbrella(m);
    expect(m.umbrella).toBe(true);
    tickReaction(m, 0.5);
    expect(m.wetSeconds).toBeCloseTo(0.25);
    toggleUmbrella(m);
    m.netX = laneX[0];
    tickReaction(m, 0.5);
    expect(m.wetSeconds).toBeCloseTo(0.25);
  });

  it('does not terminate a round or advance practice while a reaction is active', () => {
    const m = ready();
    promise(m, 0, 1);
    returnPromise(m, () => 0);
    m.elapsed = defaults.roundSeconds;
    m.spawnIn = 99;
    tick(m, 0.1, defaults, () => 0);
    expect(m.phase).toBe('round');
    const p = ready(true);
    promise(p, 0, 1);
    returnPromise(p, () => 0);
    p.spawned = 20;
    practiceNext(p, () => 0);
    expect(p.phase).toBe('round');
    expect(p.targets).toHaveLength(0);
    tickReaction(p, 20);
    practiceNext(p, () => 0);
    expect(p.phase).toBe('invest');
  });

  it('starts a fresh practice session without reactions, wet penalties, or inventory', () => {
    const old = ready(true);
    promise(old, 0, 1);
    returnPromise(old, () => 0);
    tickReaction(old, 3);
    toggleUmbrella(old);
    const fresh = createModel(true);
    expect(fresh.reaction).toBeNull();
    expect(fresh.storedPromises).toEqual([]);
    expect(fresh.wetSeconds).toBe(0);
    expect(fresh.speedMult).toBe(1);
    expect(fresh.umbrella).toBe(false);
    expect(fresh.practice).toBe(true);
  });
});

describe('reaction timing and public score awards', () => {
  it.each([0, 0.5, 1])(
    'uses a two-second fill and the sampled overflow duration (%s)',
    (sample) => {
      const m = ready();
      promise(m, 0, 1);
      let calls = 0;
      returnPromise(m, () => (calls++ === 0 ? 0 : sample));
      const overflow = 5 + sample * 10;
      tickReaction(m, 2 + overflow - 0.01);
      expect(m.reaction?.phase).toBe('overflow');
      tickReaction(m, 0.02);
      expect(m.reaction).toBeNull();
      expect(m.wetSeconds).toBeCloseTo(overflow);
    },
  );

  it('integrates wet exposure consistently across frame sizes and phase boundaries', () => {
    const large = ready(),
      small = ready();
    for (const m of [large, small]) {
      promise(m, 0, 1);
      returnPromise(m, () => 0);
    }
    tickReaction(large, 3.75);
    for (let i = 0; i < 375; i++) tickReaction(small, 0.01);
    expect(large.wetSeconds).toBeCloseTo(1.75);
    expect(small.wetSeconds).toBeCloseTo(large.wetSeconds);
    expect(small.speedMult).toBeCloseTo(large.speedMult);
  });

  it('holds the capitulation award through anger and zoom, then automatically grants once', () => {
    const m = ready();
    m.resources = [2, 1, 0, 0];
    promise(m, 2, 0);
    returnPromise(m, () => 0.9);
    tickReaction(m, 1);
    expect(m.reaction?.phase).toBe('zoom');
    tickReaction(m, 2.99);
    expect(m.score).toBe(0);
    expect(m.resources).toEqual([2, 1, 0, 0]);
    tickReaction(m, 0.02);
    expect(m.reaction?.phase).toBe('flying');
    tickReaction(m, 0.8);
    expect(m.reaction).toBeNull();
    expect(m.resources).toEqual([2, 1, 1, 0]);
    expect(m.bonusPercent).toBe(10);
    expect(m.score).toBe(33);
    tickReaction(m, 10);
    expect(m.score).toBe(33);
  });

  it('uses a minimum one-resource award and applies capped global bonuses to catches and purchases', () => {
    const m = ready();
    promise(m, 0, 1);
    returnPromise(m, () => 0.9);
    tickReaction(m, 5);
    expect(m.score).toBe(11);
    expect(m.resources).toEqual([1, 0, 0, 0]);
    m.bonusPercent = 195;
    promise(m, 1, 2);
    returnPromise(m, () => 0.9);
    tickReaction(m, 5);
    expect(m.bonusPercent).toBe(200);
    const before = m.score;
    collect(m, { id: 9, type: 2, lane: 0, y: 295, warning: 0 });
    expect(m.score - before).toBe(30);
    m.resources = [3, 0, 0, 1];
    m.phase = 'invest';
    const beforeBuy = m.score;
    expect(buy(m, 0)).toBe(true);
    expect(m.score - beforeBuy).toBe(150);
  });
});
