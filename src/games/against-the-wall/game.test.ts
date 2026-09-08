import { describe, it, expect } from 'vitest';
import {
  create,
  step,
  sight,
  path,
  distract,
  loadDistrict,
  next,
  interact,
  type Actor,
} from './model';
const enemy = (id: number, faction: Actor['faction'], x = 12.5, y = 17.5): Actor => ({
  id,
  faction,
  x,
  y,
  meter: 0,
  state: 'patrol',
  timer: 0,
  cooldown: 0,
  originX: x,
  originY: y,
  way: 1,
  arrival: -1,
});
describe('Against the Wall simulation', () => {
  it('every authored district has a walk-only route to intake', () => {
    const s = create();
    for (let d = 1; d <= 3; d++) {
      s.district = d;
      loadDistrict(s);
      expect(path(s, s, s.office).length).toBeGreaterThan(0);
    }
  });
  it('cover blocks visibility while open corridors remain visible', () => {
    const s = create();
    expect(sight(s, 7.5, 8.5, 10.5, 8.5)).toBe(false);
    expect(sight(s, 3.5, 18.5, 7.5, 18.5)).toBe(true);
  });
  it('diagonal movement has no speed advantage', () => {
    const a = create(),
      b = create();
    a.phase = b.phase = 'running';
    step(a, 0.1, { x: 1, y: 0, sprint: false });
    step(b, 0.1, { x: 1, y: 1, sprint: false });
    expect(Math.hypot(a.x - 3.5, a.y - 18.5)).toBeCloseTo(Math.hypot(b.x - 3.5, b.y - 18.5));
  });
  it('rival investigators acquire each other and exchange damaging fire', () => {
    const s = create();
    s.phase = 'running';
    s.x = 11.5;
    s.y = 17.5;
    s.enemies = [enemy(1, 'ICE'), enemy(2, 'Cartel')];
    expect(distract(s, 12.5, 17.5)).toBe(true);
    step(s, 1 / 60);
    expect(s.enemies.map((e) => e.state)).toEqual(['combat', 'combat']);
    expect(s.enemies[0].target).toBe(2);
    for (let i = 0; i < 60; i++) step(s, 1 / 60);
    expect(s.enemies[0].health).toBeLessThan(100);
    expect(s.phase).toBe('running');
  });
  it('same-faction investigators argue for only two seconds', () => {
    const s = create();
    s.phase = 'running';
    s.x = 11.5;
    s.y = 17.5;
    s.enemies = [enemy(1, 'ICE'), enemy(2, 'ICE')];
    distract(s, 12.5, 17.5);
    step(s, 1 / 60);
    expect(s.enemies[0].timer).toBe(2);
  });
  it('invalid distraction does not consume resources; cooldown prevents encounter', () => {
    const s = create();
    s.phase = 'running';
    expect(distract(s, 29, 2)).toBe(false);
    expect(s.tokens).toBe(2);
    s.enemies = [enemy(1, 'ICE')];
    s.enemies[0].cooldown = 10;
    s.x = 11.5;
    s.y = 17.5;
    distract(s, 12.5, 17.5);
    expect(s.enemies[0].state).toBe('patrol');
  });
  it('pause freezes AI, inventory and simulation clocks', () => {
    const s = create();
    s.phase = 'paused';
    const snapshot = JSON.stringify(s);
    step(s, 8);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
  it('capture resets local resources but retains banked district help', () => {
    const s = create();
    s.phase = 'running';
    s.companions = 1;
    s.supplies = 2;
    s.localSupplies = 1;
    s.tokens = 0;
    s.grace = 0;
    s.enemies = [enemy(1, 'ICE', s.x, s.y)];
    step(s, 0.01);
    expect(s.phase).toBe('checkpoint');
    step(s, 0.6);
    expect(s.phase).toBe('running');
    expect(s.tokens).toBe(2);
    expect(s.localSupplies).toBe(0);
    expect(s.companions).toBe(1);
    expect(s.supplies).toBe(2);
  });
  it('district banking and final intake happen once without rewarding fights', () => {
    const s = create();
    s.phase = 'running';
    s.enemies = [];
    s.x = s.companion.x;
    s.y = s.companion.y;
    interact(s);
    s.x = s.office.x;
    s.y = s.office.y;
    step(s, 0.01);
    expect(s.phase).toBe('district');
    expect(s.companions).toBe(1);
    step(s, 2);
    expect(s.companions).toBe(1);
    next(s);
    s.enemies = [];
    s.x = s.office.x;
    s.y = s.office.y;
    step(s, 0.01);
    next(s);
    s.enemies = [];
    s.x = s.office.x;
    s.y = s.office.y;
    step(s, 0.01);
    expect(s.phase).toBe('won');
    expect(s.score).toBe(1200);
  });
  it('capture beats arrival in the same step', () => {
    const s = create();
    s.phase = 'running';
    s.x = s.office.x;
    s.y = s.office.y;
    s.grace = 0;
    s.enemies = [enemy(1, 'ICE', s.x, s.y)];
    step(s, 0.01);
    expect(s.phase).toBe('checkpoint');
  });
});

describe('authored districts and moving gate', () => {
  it('district layouts are distinct', () => {
    const s = create();
    const layouts = [];
    for (let d = 1; d <= 3; d++) {
      s.district = d;
      loadDistrict(s);
      layouts.push([...s.walls].sort().join('|'));
    }
    expect(new Set(layouts).size).toBe(3);
  });
  it('warns for two seconds, closes for four, and preserves an alternate route', () => {
    const s = create();
    s.district = 3;
    loadDistrict(s);
    s.phase = 'running';
    s.enemies = [];
    s.gate.nextAt = 0;
    step(s, 1 / 60);
    expect(s.gate.phase).toBe('warning');
    for (let i = 0; i < 119; i++) step(s, 1 / 60);
    expect(s.gate.phase).toBe('warning');
    step(s, 1 / 60);
    expect(s.gate.phase).toBe('closed');
    expect(path(s, s, s.office).length).toBeGreaterThan(0);
    for (let i = 0; i < 240; i++) step(s, 1 / 60);
    expect(s.gate.phase).toBe('idle');
  });
  it('walking controller reaches all three district offices without supplies or sprinting', () => {
    const s = create(4);
    s.phase = 'running';
    for (let district = 1; district <= 3; district++) {
      const route = path(s, s, s.office);
      for (const target of route) {
        for (
          let i = 0;
          i < 60 && Math.hypot(s.x - target.x, s.y - target.y) > 0.08 && s.phase === 'running';
          i++
        ) {
          const dx = target.x - s.x,
            dy = target.y - s.y;
          step(s, 1 / 60, { x: dx, y: dy, sprint: false });
        }
        if (String(s.phase) === 'district' || String(s.phase) === 'won') break;
        if (String(s.phase) === 'checkpoint')
          throw Error(`Captured on authored route in district${district}`);
      }
      expect(s.phase).toBe(district === 3 ? 'won' : 'district');
      if (district < 3) next(s);
    }
    expect(s.score).toBe(1000);
  });
});

describe('Wall collision, perception and combat regressions', () => {
  it('long movement cannot tunnel through two adjoining walls', async () => {
    const { move, overlapsWall } = await import('./model');
    const s = create();
    s.walls = new Set(['5,4', '6,4']);
    const a = { x: 3.5, y: 4.5 };
    move(s, a, 10, 0);
    expect(a.x).toBeLessThanOrEqual(4.781);
    expect(overlapsWall(s, a.x, a.y)).toBe(false);
  });
  it('circle collision rejects diagonal corner penetration and still slides along a face', async () => {
    const { move, overlapsWall } = await import('./model');
    const s = create();
    s.walls = new Set(['5,5', '6,5', '5,6', '6,6']);
    expect(overlapsWall(s, 4.86, 4.86)).toBe(true);
    const a = { x: 4.5, y: 4.5 };
    for (let i = 0; i < 20; i++) {
      move(s, a, 0.025, 0.025);
      expect(overlapsWall(s, a.x, a.y)).toBe(false);
    }
    const b = { x: 4.7, y: 5.2 };
    move(s, b, 0.8, 0.5);
    expect(b.x).toBeLessThan(4.79);
    expect(b.y).toBeGreaterThan(5.6);
  });
  it('follows a visible human before the suspicion meter fills and stops tracking at zero', () => {
    const s = create();
    s.phase = 'running';
    s.walls = new Set();
    s.x = 8.5;
    s.y = 5.5;
    s.grace = 999;
    const a = enemy(1, 'ICE', 5.5, 5.5);
    s.enemies = [a];
    step(s, 0.1);
    expect(a.state).toBe('alert');
    expect(a.meter).toBeGreaterThan(0);
    expect(a.meter).toBeLessThan(1);
    expect(a.x).toBeGreaterThan(5.5);
    expect(a.target).toBe('player');
    for (let y = 1; y < 23; y++) s.walls.add(`6,${y}`);
    step(s, 1.2);
    expect(a.meter).toBe(0);
    expect(a.target).toBeNull();
    expect(a.state).toBe('patrol');
  });
  it('committed pursuit remembers the last visible position instead of tracking through walls', () => {
    const s = create();
    s.phase = 'running';
    s.walls = new Set();
    s.x = 8.5;
    s.y = 5.5;
    s.grace = 999;
    const a = enemy(1, 'ICE', 5.5, 5.5);
    a.target = 'player';
    a.meter = 1;
    a.committed = true;
    s.enemies = [a];
    step(s, 0.01);
    expect(a.lastSeen).toEqual({ x: 8.5, y: 5.5 });
    for (let y = 1; y < 23; y++) s.walls.add(`6,${y}`);
    s.x = 10.5;
    s.y = 9.5;
    step(s, 0.1);
    expect(a.lastSeen).toEqual({ x: 8.5, y: 5.5 });
    expect(a.meter).toBeLessThan(1);
    expect(a.health).toBe(100);
    for (let i = 0; i < 90; i++) step(s, 1 / 60);
    expect(a.target).toBeNull();
    expect(a.committed).toBe(false);
  });
  it('acquires visible rival humans without a beacon and resolves damage into persistent deaths', () => {
    const s = create();
    s.phase = 'running';
    s.walls = new Set();
    s.x = 25.5;
    s.y = 20.5;
    const a = enemy(1, 'ICE', 5.5, 5.5),
      b = enemy(2, 'Cartel', 8.5, 5.5);
    b.heading = Math.PI;
    s.enemies = [a, b];
    for (let i = 0; i < 300; i++) step(s, 1 / 60);
    expect(s.enemies.some((e) => e.state === 'dead')).toBe(true);
    const fallen = s.enemies.find((e) => e.state === 'dead')!;
    expect(fallen.health).toBe(0);
    const position = { x: fallen.x, y: fallen.y };
    for (let i = 0; i < 100; i++) step(s, 1 / 60);
    expect({ x: fallen.x, y: fallen.y }).toEqual(position);
    expect(fallen.target).toBeNull();
    expect(fallen.moving).toBe(false);
    expect(s.enemies).toContain(fallen);
  });
  it('same factions and ICE/Border Patrol allies never acquire or damage one another', async () => {
    const { hostile } = await import('./model');
    expect(hostile('ICE', 'Border Patrol')).toBe(false);
    expect(hostile('Cartel', 'Cartel')).toBe(false);
    expect(hostile('Paramilitary', 'ICE')).toBe(true);
    const s = create();
    s.phase = 'running';
    s.walls = new Set();
    s.x = 25.5;
    s.y = 20.5;
    const a = enemy(1, 'ICE', 5.5, 5.5),
      b = enemy(2, 'Border Patrol', 8.5, 5.5);
    b.heading = Math.PI;
    s.enemies = [a, b];
    for (let i = 0; i < 240; i++) step(s, 1 / 60);
    expect(a.health).toBe(100);
    expect(b.health).toBe(100);
    expect(a.target ?? null).toBeNull();
  });
  it('dead actors cannot capture the player, take targets, or block walkable paths', () => {
    const s = create();
    s.phase = 'running';
    s.walls = new Set();
    s.grace = 0;
    const a = enemy(1, 'Cartel', s.x, s.y);
    a.state = 'dead';
    a.health = 0;
    s.enemies = [a];
    expect(path(s, s, { x: s.x + 2, y: s.y }).length).toBeGreaterThan(0);
    step(s, 0.1);
    expect(s.phase).toBe('running');
    expect(s.health).toBe(100);
    expect(a.state).toBe('dead');
  });
  it('enemy gunfire depletes player health and returns to a healthy checkpoint', () => {
    const s = create();
    s.phase = 'running';
    s.walls = new Set();
    s.x = 8.5;
    s.y = 5.5;
    s.grace = 0;
    s.health = 20;
    const a = enemy(1, 'ICE', 5.5, 5.5);
    a.meter = 1;
    a.committed = true;
    a.target = 'player';
    s.enemies = [a];
    step(s, 0.01);
    expect(s.phase).toBe('checkpoint');
    expect(s.health).toBe(0);
    step(s, 0.6);
    expect(s.health).toBe(100);
    expect(s.phase).toBe('running');
  });
  it('walking phase advances only for actual displacement, not idle or blocked input', async () => {
    const { move } = await import('./model');
    const s = create();
    s.phase = 'running';
    s.enemies = [];
    step(s, 0.5);
    expect(s.walkDistance).toBe(0);
    step(s, 0.1, { x: 1, y: 0, sprint: false });
    expect(s.walkDistance).toBeGreaterThan(0);
    const a = { x: 1.22, y: 5.5, walkDistance: 0, moving: false };
    move(s, a, -1, 0);
    expect(a.walkDistance).toBe(0);
    expect(a.moving).toBe(false);
  });
});

it('line of sight blocks thin corner intersections rather than sampling past them', () => {
  const s = create();
  s.walls = new Set(['5,5']);
  expect(sight(s, 3.698, 5.594, 7.046, 4.072)).toBe(false);
  expect(sight(s, 3.5, 4.5, 7.5, 4.5)).toBe(true);
});
it('gate closure defers while an adjacent actor radius overlaps its tile', async () => {
  const { gateStep, overlapsWall } = await import('./model');
  const s = create();
  s.district = 2;
  s.walls = new Set();
  s.enemies = [];
  s.x = 17.9;
  s.y = 6.5;
  s.gate = { x: 18, y: 6, phase: 'warning', remaining: 0, nextAt: 0 };
  expect(overlapsWall(s, s.x, s.y)).toBe(false);
  gateStep(s, 0.01);
  expect(s.gate.phase).toBe('warning');
  expect(overlapsWall(s, s.x, s.y)).toBe(false);
});
