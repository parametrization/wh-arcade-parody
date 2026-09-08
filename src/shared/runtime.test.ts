import { describe, expect, it } from 'vitest';
import { createRandom } from './random';
import { createStorage } from './storage';
import { createLoop, type FrameScheduler } from './loop';
import { createAssets } from './assets';

function frames() {
  let id = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const scheduler: FrameScheduler = {
    request(callback) { callbacks.set(++id, callback); return id; },
    cancel(handle) { callbacks.delete(handle); },
  };
  return {
    scheduler,
    count: () => callbacks.size,
    at(time: number) { const next = [...callbacks.values()]; callbacks.clear(); next.forEach(callback => callback(time)); },
  };
}

describe('seeded randomness', () => {
  it('replays a seed and restores its internal position', () => {
    const a = createRandom(314), b = createRandom(314);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
    const state = a.state;
    const next = a.next();
    a.setState(state);
    expect(a.next()).toBe(next);
    a.seed(314);
    expect(a.next()).toBe(createRandom(314).next());
  });
  it('respects inclusive bounds and rejects invalid integer ranges', () => {
    const rng = createRandom(9);
    expect(new Set(Array.from({ length: 100 }, () => rng.int(2, 3)))).toEqual(new Set([2, 3]));
    expect(() => rng.int(3, 2)).toThrow(RangeError);
  });
});

describe('storage fallback', () => {
  it('keeps writes and deletions when storage rejects operations', () => {
    const storage = createStorage('test', {
      getItem: () => '{"version":1,"value":100}',
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    });
    expect(storage.get('score', 0)).toBe(100);
    storage.set('score', 200);
    expect(storage.get('score', 0)).toBe(200);
    storage.remove('score');
    expect(storage.get('score', 0)).toBe(0);
  });
  it('rejects malformed records and old schema versions', () => {
    const backend = { getItem: () => 'not json', setItem() {}, removeItem() {} };
    expect(createStorage('test', backend).get('score', 8)).toBe(8);
    const storage = createStorage('test', null);
    storage.set('score', 100, 2);
    expect(storage.get('score', 8)).toBe(8);
    expect(storage.get('score', 8, 2)).toBe(100);
  });
});

describe('fixed simulation clock', () => {
  it('caps stalled updates and resumes without advancing paused time', () => {
    const f = frames();
    let ticks = 0;
    const loop = createLoop(() => ticks++, () => {}, f.scheduler);
    loop.start(); loop.start();
    expect(f.count()).toBe(1);
    f.at(0); f.at(1000);
    expect(ticks).toBe(5);
    loop.pause();
    expect(f.count()).toBe(0);
    f.at(100000);
    expect(ticks).toBe(5);
    loop.resume(); f.at(100000); f.at(100017);
    expect(ticks).toBe(6);
    loop.destroy(); loop.start();
    expect(f.count()).toBe(0);
  });
  it('allows update to pause itself without scheduling another frame', () => {
    const f = frames();
    const loop = createLoop(() => loop.pause(), () => {}, f.scheduler);
    loop.start(); f.at(0); f.at(17);
    expect(loop.running).toBe(false);
    expect(f.count()).toBe(0);
  });
});

it('rejects ambiguous asset identities and missing assets', async () => {
  const record = { id: 'eagle', path: '/assets/eagle.png', author: 'Project', rights: 'Original' };
  expect(() => createAssets([record, record])).toThrow('Duplicate');
  const assets = createAssets([record]);
  expect(assets.url('eagle')).toBe('/assets/eagle.png');
  await expect(assets.image('missing')).rejects.toThrow('Unknown asset');
  assets.destroy();
  await expect(assets.image('eagle')).rejects.toThrow('disposed');
});


it('resets simulation time without a second loop or paused-time catch-up', () => {
  const f = frames();
  let updates = 0;
  const loop = createLoop(() => updates++, () => {}, f.scheduler);
  loop.start(); f.at(0); f.at(34);
  expect(updates).toBe(2);
  loop.reset();
  expect(loop.time).toBe(0);
  expect(f.count()).toBe(1);
  f.at(20000);
  expect(updates).toBe(2);
  f.at(20017);
  expect(updates).toBe(3);
  expect(loop.time).toBeCloseTo(1 / 60);
  loop.destroy();
});

it('does not duplicate frames when an update pauses and resumes synchronously', () => {
  const f = frames();
  const loop = createLoop(() => { loop.pause(); loop.resume(); }, () => {}, f.scheduler);
  loop.start(); f.at(0); f.at(17);
  expect(f.count()).toBe(1);
  loop.destroy();
  expect(f.count()).toBe(0);
});

it('survives blocked reads and preserves the last valid write after serialization failure', () => {
  const store = createStorage('blocked', {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
  });
  expect(store.get('value', 7)).toBe(7);
  store.set('value', 11);
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  store.set('value', cyclic);
  expect(store.get('value', 7)).toBe(11);
});

it('clears only explicitly known versioned game namespaces', async () => {
  const { clearGameScores } = await import('./storage');
  const values = new Map([
    ['wh-arcade-parody.flappy-files.v1.best', '8'],
    ['wh-arcade-parody.flappy-files.v2.run', '10'],
    ['wh-arcade-parody.flappy-files-extra.v1.best', '20'],
    ['wh-arcade-parody.rio-rescue.v1.best', '30'],
    ['wh-arcade-parody.settings.preferences', 'prefs'],
    ['wh-arcade-parody.controls.bindings', 'keys'],
    ['other-site.score', '99'],
  ]);
  const backend = {
    get length() { return values.size; },
    key(index: number) { return [...values.keys()][index] ?? null; },
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
  clearGameScores(['flappy-files', 'settings', 'controls', '../'], backend);
  expect(values.has('wh-arcade-parody.flappy-files.v1.best')).toBe(false);
  expect(values.has('wh-arcade-parody.flappy-files.v2.run')).toBe(false);
  expect(values.size).toBe(5);
  expect(() => clearGameScores(['flappy-files'], {
    ...backend,
    get length(): number { throw new Error('blocked'); },
  })).not.toThrow();
});

it('score reset also clears shared memory while retaining control preferences', async () => {
  const { clearGameScores } = await import('./storage');
  const game = createStorage('test-game.v1');
  const controls = createStorage('controls');
  game.set('best', 88);
  controls.set('bindings', { flap: ['KeyF'] });
  clearGameScores(['test-game']);
  expect(game.get('best', 0)).toBe(0);
  expect(createStorage('test-game.v1').get('best', 0)).toBe(0);
  expect(controls.get('bindings', {})).toEqual({ flap: ['KeyF'] });
});

it('validates and persists only usable action binding overrides', async () => {
  const { validateBindings, saveBindings, loadBindings } = await import('./input');
  expect(validateBindings({ flap: ['KeyF', 'KeyF'], pause: [false], empty: [], long: ['x'.repeat(65)], valid: ['ArrowUp'] })).toEqual({ flap: ['KeyF'], valid: ['ArrowUp'] });
  expect(validateBindings(null)).toEqual({});
  expect(validateBindings(['Space'])).toEqual({});
  saveBindings({ flap: ['KeyF'] });
  expect(loadBindings()).toEqual({ flap: ['KeyF'] });
  saveBindings({});
  expect(loadBindings()).toEqual({});
});
