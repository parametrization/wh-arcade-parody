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
  it('rival investigators clash and offer the full story escape window', () => {
    const s = create();
    s.phase = 'running';
    s.x = 11.5;
    s.y = 17.5;
    s.enemies = [enemy(1, 'ICE'), enemy(2, 'Cartel')];
    expect(distract(s, 12.5, 17.5)).toBe(true);
    step(s, 1 / 60);
    expect(s.enemies.map((e) => e.state)).toEqual(['clash', 'clash']);
    expect(s.enemies[0].timer).toBe(8);
    for (let i = 0; i < 60; i++) step(s, 1 / 60);
    expect(s.enemies[0].state).toBe('clash');
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
