import { describe, it, expect } from 'vitest';
import { getTerrain, terrainHeight, terrainBlocked, cameras } from './terrain';
import {
  createModel,
  reachable,
  returnable,
  dock,
  spawn,
  tick,
  movementRoute,
  WIDTH,
  HEIGHT,
  getCameraViews,
  cameraSees,
  advance,
  setWaiting,
} from './model';
import { createMotion } from './motion';
const cells = () =>
  Array.from({ length: WIDTH * HEIGHT }, (_, i) => ({ x: i % WIDTH, y: Math.floor(i / WIDTH) }));
describe('seeded large landscapes', () => {
  it('has four times the original area and reproducible varied elevations', () => {
    expect(WIDTH * HEIGHT).toBe(24 * 18 * 4);
    const a = cells().map((c) => getTerrain(0, c.x, c.y, 42)),
      b = cells().map((c) => getTerrain(0, c.x, c.y, 43));
    expect(a).not.toEqual(b);
    expect(a).toEqual(cells().map((c) => getTerrain(0, c.x, c.y, 42)));
    for (const kind of ['canyon', 'river', 'bridge', 'mountain', 'mesa', 'plateau'])
      expect(a).toContain(kind);
    expect(new Set(cells().map((c) => terrainHeight(0, c.x, c.y, 42))).size).toBeGreaterThan(8);
  });
  it.each([1, 42, 99])('protects start, dock and bridge routes with seed%s', (seed) => {
    for (let district = 0; district < 3; district++) {
      const m = createModel(seed);
      m.district = district;
      expect(m.body.every((c) => !terrainBlocked(district, c.x, c.y, seed))).toBe(true);
      const legal = reachable(m);
      const home = returnable(m);
      expect(legal).toContainEqual(dock);
      for (let i = 0; i < 10; i++) {
        m.pickup = null;
        spawn(m);
        expect(legal).toContainEqual(m.pickup);
        expect(terrainBlocked(district, m.pickup!.x, m.pickup!.y, seed)).toBe(false);
        expect(home.has(`${m.pickup!.x},${m.pickup!.y}`)).toBe(true);
        for (const dx of [-1, 0, 1])
          for (const dy of [-1, 0, 1]) {
            expect(terrainBlocked(district, m.pickup!.x + dx, m.pickup!.y + dy, seed)).toBe(false);
            expect(getTerrain(district, m.pickup!.x + dx, m.pickup!.y + dy, seed)).not.toBe(
              'river',
            );
          }
      }
      for (let x = 1; x < 47; x++) expect(terrainBlocked(district, x, 8, seed)).toBe(false);
      for (const c of cameras(district, seed))
        expect(terrainBlocked(district, c.x, c.y, seed)).toBe(false);
    }
  });
  it('moves swimming leader and convoy through both cardinal cells without diagonal clipping', () => {
    const m = createModel(42);
    m.phase = 'playing';
    m.cameraEnabled = false;
    m.pickup = null;
    const entry = cells().find(
      (c) =>
        getTerrain(0, c.x, c.y, 42) === 'river' &&
        !terrainBlocked(0, c.x, c.y + 1, 42) &&
        getTerrain(0, c.x - 1, c.y, 42) === 'ground' &&
        !terrainBlocked(0, c.x - 2, c.y, 42),
    )!;
    expect(entry).toBeDefined();
    m.body = [
      { x: entry.x - 1, y: entry.y },
      { x: entry.x - 2, y: entry.y },
    ];
    m.direction = 'right';
    const motion = createMotion(m);
    const route = movementRoute(m, m.body[0], 'right');
    expect(route).toEqual([entry, { x: entry.x, y: entry.y + 1 }]);
    tick(m);
    expect(m.body).toEqual([route[1], route[0]]);
    motion.update(m);
    m.acc = 0.24 / 4;
    const quarter = motion.sample(m)[0];
    expect(quarter.y).toBe(entry.y);
    expect(quarter.x).toBeCloseTo(entry.x - 0.5);
    m.acc = 0.24 * 0.75;
    const later = motion.sample(m)[0];
    expect(later.x).toBe(entry.x);
    expect(later.y).toBeCloseTo(entry.y + 0.5);
  });
  it('never puts the leader into a blocked downstream cell', () => {
    const m = createModel(42);
    m.phase = 'playing';
    m.pickup = null;
    m.safe = 0;
    const entry = cells().find(
      (c) =>
        getTerrain(0, c.x, c.y, 42) === 'river' &&
        terrainBlocked(0, c.x, c.y + 1, 42) &&
        !terrainBlocked(0, c.x - 1, c.y, 42),
    )!;
    expect(entry).toBeDefined();
    m.body = [{ x: entry.x - 1, y: entry.y }];
    m.direction = 'right';
    tick(m);
    expect(terrainBlocked(0, m.body[0].x, m.body[0].y, 42)).toBe(false);
    expect(m.phase).toBe('jam');
  });
  it('sweeps shared cameras, detects waiting heads and freezes while paused', () => {
    const m = createModel(42);
    m.phase = 'playing';
    m.safe = 0;
    const view = getCameraViews(m)[0];
    const visible = cells().find(
      (c) =>
        cameraSees(view, c) &&
        !terrainBlocked(0, c.x, c.y, 42) &&
        Math.hypot(c.x - view.x, c.y - view.y) > 1,
    )!;
    expect(visible).toBeDefined();
    m.body = [visible];
    setWaiting(m, true);
    advance(m, 0.01);
    expect(m.cameraAlerts[0]).toBeGreaterThan(0);
    m.phase = 'ready';
    const time = m.time;
    advance(m, 3);
    expect(m.time).toBe(time);
  });
});

it('provides turning space beside the final fence instead of trapping a long convoy', () => {
  for (let y = 1; y < 35; y++)
    for (let x = 41; x <= 43; x++) expect(terrainBlocked(1, x, y, 43)).toBe(false);
  expect(getTerrain(1, 44, 33, 43)).toBe('fence');
});
it.each(['mesa', 'plateau'] as const)('blocks camera sight through raised %s terrain', (kind) => {
  const tile = cells().find((p) => getTerrain(0, p.x, p.y, 42) === kind)!;
  expect(tile).toBeDefined();
  const camera = {
    id: 0,
    x: tile.x - 1,
    y: tile.y,
    heading: 0,
    range: 4,
    halfAngle: 0.4,
    period: 8,
    district: 0,
    seed: 42,
    alert: 0,
  };
  expect(cameraSees(camera, { x: tile.x + 1, y: tile.y })).toBe(false);
});
