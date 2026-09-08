import { describe, it, expect } from 'vitest';
import { createModel, queueTurn, tick, advance, share, retry, spawn, dock, GOALS } from './model';
import { defaults, validateConfig } from './config';
describe('Rio rescue rules', () => {
  it('seeds pickups reproducibly and rejects reverse/overfull queued turns', () => {
    const a = createModel(42),
      b = createModel(42);
    expect(a.pickup).toEqual(b.pickup);
    expect(queueTurn(a, 'left')).toBe(false);
    expect(queueTurn(a, 'up')).toBe(true);
    expect(queueTurn(a, 'left')).toBe(true);
    expect(queueTurn(a, 'down')).toBe(false);
  });
  it('grows for rescue while helpers do not count as rescued', () => {
    const m = createModel();
    m.phase = 'playing';
    m.pickup = { x: 5, y: 8 };
    tick(m);
    expect(m.body).toHaveLength(4);
    expect(m.aboard).toBe(1);
    expect(m.banked).toBe(0);
  });
  it('permits the vacating tail but rejects growth onto it', () => {
    const m = createModel();
    m.phase = 'playing';
    m.body = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 4, y: 5 },
    ];
    m.direction = 'left';
    m.pickup = null;
    tick(m);
    expect(m.phase).toBe('playing');
    const n = createModel();
    n.phase = 'playing';
    n.body = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 4, y: 5 },
    ];
    n.direction = 'left';
    n.pickup = { x: 4, y: 5 };
    tick(n);
    expect(n.phase).toBe('jam');
  });
  it('banks once on delivery and opens the final small group', () => {
    const m = createModel();
    m.phase = 'playing';
    m.banked = 5;
    m.aboard = 1;
    m.pickup = null;
    spawn(m);
    expect(m.dockOpen).toBe(true);
    m.body = [
      { x: 2, y: 8 },
      { x: 3, y: 8 },
      { x: 4, y: 8 },
    ];
    m.direction = 'left';
    tick(m);
    expect(m.banked).toBe(GOALS[0]);
    expect(m.score).toBe(100);
    tick(m);
    expect(m.score).toBe(100);
    advance(m, 0.6);
    expect(m.phase).toBe('district-complete');
    expect(m.score).toBe(350);
    expect(dock.x).toBe(1);
  });
  it('Share consumes charges once and clears active tape', () => {
    const m = createModel();
    m.phase = 'playing';
    m.charges = 1;
    m.hazard = { id: 1, kind: 'banner', cells: [], phase: 'active', remaining: 2 };
    expect(share(m)).toBe(true);
    expect(m.hazard).toBeNull();
    expect(m.charges).toBe(0);
    expect(share(m)).toBe(false);
  });
  it('single step remains stationary until requested and retry restores the checkpoint', () => {
    const c = defaults();
    c.mode = 'single-step';
    const m = createModel(1, c);
    m.phase = 'playing';
    advance(m, 5);
    expect(m.body[0].x).toBe(4);
    advance(m, 0, true);
    expect(m.body[0].x).toBe(5);
    retry(m);
    expect(m.body[0].x).toBe(4);
    expect(m.phase).toBe('ready');
  });
  it('validates tuning atomically', () => {
    const c = defaults();
    expect(() => validateConfig(c, { 'tick.startMs': 180, 'tick.minMs': 220 })).toThrow();
    expect(c['tick.startMs']).toBe(240);
  });
});

it('can complete all three authored districts through legal movement and deliveries', async () => {
  const { movementRoute, nextDistrict, equal, WIDTH, HEIGHT } = await import('./model');
  const { terrainBlocked } = await import('./terrain');
  const m = createModel(42);
  m.phase = 'playing';
  let moves = 0;
  const phase = () => m.phase;
  while (phase() !== 'won' && moves < 6000) {
    if (phase() === 'delivering') {
      advance(m, 0.61);
      continue;
    }
    if (phase() === 'district-complete') {
      nextDistrict(m);
      m.phase = 'playing';
      continue;
    }
    expect(m.phase).toBe('playing');
    const target = m.dockOpen ? dock : m.pickup!;
    expect(target).not.toBeNull();
    const paths: [{ x: number; y: number }, ('up' | 'right' | 'down' | 'left')[]][] = [
        [m.body[0], []],
      ],
      seen = new Set<string>();
    let route: ('up' | 'right' | 'down' | 'left')[] | undefined;
    while (paths.length) {
      const [c, path] = paths.shift()!;
      const key = `${c.x},${c.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (equal(c, target)) {
        route = path;
        break;
      }
      for (const [d, dx, dy] of [
        ['up', 0, -1],
        ['right', 1, 0],
        ['down', 0, 1],
        ['left', -1, 0],
      ] as const) {
        const swimming = movementRoute(m, c, d);
        const n = swimming.at(-1)!;
        if (
          n.x < 0 ||
          n.y < 0 ||
          n.x >= WIDTH ||
          n.y >= HEIGHT ||
          swimming.some(
            (cell) =>
              terrainBlocked(m.district, cell.x, cell.y, m.seed) ||
              m.body.slice(1).some((b) => equal(b, cell)),
          )
        )
          continue;
        paths.push([n, [...path, d]]);
      }
    }
    if (!route)
      throw Error(
        JSON.stringify({
          district: m.district,
          target,
          body: m.body,
          direction: m.direction,
          moves,
        }),
      );
    expect(
      route?.length,
      JSON.stringify({ district: m.district, target, body: m.body, direction: m.direction, moves }),
    ).toBeGreaterThan(0);
    queueTurn(m, route![0]);
    tick(m);
    moves++;
  }
  expect(m.phase).toBe('won');
  expect(m.score).toBeGreaterThanOrEqual(3750);
});

it('hazards warn first and cancel if a convoy occupies the reserved strip', () => {
  const m = createModel(2);
  m.district = 1;
  m.phase = 'playing';
  m.pickup = { x: 8, y: 8 };
  m.acc = -100;
  m.time = 20;
  m.safe = 0;
  advance(m, 0.01);
  expect(m.hazard?.phase).toBe('warning');
  const reserved = m.hazard!.cells[0];
  m.body = [reserved, { x: reserved.x - 1, y: reserved.y }, { x: reserved.x - 2, y: reserved.y }];
  advance(m, 3);
  expect(m.hazard).toBeNull();
  expect(m.nextFloat).toBeCloseTo(m.time + 3);
});

it('Share preserves fractional movement progress and never multiplies accumulated effects', () => {
  const m = createModel();
  m.phase = 'playing';
  m.charges = 2;
  m.acc = 0.12;
  share(m);
  expect(m.acc).toBeCloseTo(0.18);
  expect(m.slow).toBe(3);
  share(m);
  expect(m.acc).toBeCloseTo(0.18);
  expect(m.slow).toBe(3);
});

it('retry restores the last delivery including banked points and charges', () => {
  const m = createModel();
  m.phase = 'playing';
  m.aboard = 3;
  m.charges = 2;
  m.dockOpen = true;
  m.body = [
    { x: 2, y: 8 },
    { x: 3, y: 8 },
    { x: 4, y: 8 },
  ];
  m.direction = 'left';
  tick(m);
  advance(m, 0.61);
  m.score += 55;
  m.charges = 0;
  m.aboard = 1;
  retry(m);
  expect(m.banked).toBe(3);
  expect(m.score).toBe(300);
  expect(m.charges).toBe(2);
  expect(m.aboard).toBe(0);
});

it('rewind restores route state but does not rewind its cooldown', () => {
  const c = defaults();
  c.mode = 'story';
  const m = createModel(3, c);
  m.phase = 'playing';
  m.safe = 0;
  m.pickup = null;
  for (let i = 0; i < 10; i++) {
    m.monotonic += 0.24;
    tick(m);
  }
  m.body = [
    { x: 46, y: 8 },
    { x: 45, y: 8 },
    { x: 44, y: 8 },
  ];
  m.direction = 'right';
  tick(m);
  expect(m.phase).toBe('ready');
  expect(m.lastRewind).toBe(m.monotonic);
  m.safe = 0;
  m.phase = 'playing';
  m.body = [
    { x: 46, y: 8 },
    { x: 45, y: 8 },
    { x: 44, y: 8 },
  ];
  m.direction = 'right';
  tick(m);
  expect(m.phase).toBe('jam');
});

it('clearing active tape starts its cooldown instead of immediately scheduling it again', () => {
  const m = createModel();
  m.district = 2;
  m.phase = 'playing';
  m.rescued = 2;
  m.charges = 1;
  m.time = 30;
  m.nextBanner = 16;
  m.nextFloat = 100;
  m.hazard = { id: 1, kind: 'banner', cells: [{ x: 12, y: 6 }], phase: 'active', remaining: 2 };
  expect(share(m)).toBe(true);
  advance(m, 1 / 60);
  expect(m.hazard).toBeNull();
  expect(m.nextBanner).toBe(46);
  expect(m.nextHazard).toBe(46);
});
