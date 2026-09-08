import { expect, it } from 'vitest';
import { create, sees, sight, canDistract, distract, step, type Actor } from './model';
import { visionBoundary, DISTRACTION_RANGE } from './visibility';
const observer = (): Actor => ({
  x: 6.5,
  y: 6.5,
  id: 1,
  faction: 'ICE',
  meter: 0,
  state: 'patrol',
  timer: 0,
  cooldown: 0,
  originX: 6.5,
  originY: 6.5,
  way: 1,
  arrival: -1,
  heading: 0,
});
function inside(points: { x: number; y: number }[], x: number, y: number) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}
it('painted vision agrees with detection around a wall and its corners', () => {
  const s = create(),
    e = observer();
  s.walls = new Set(['8,6', '8,7']);
  const polygon = [e, ...visionBoundary(s, e)];
  for (let x = 6.63; x < 11.4; x += 0.31)
    for (let y = 3.13; y < 10; y += 0.31) {
      // Samples stay away from the discretized outer arc.
      if (Math.abs(Math.hypot(x - e.x, y - e.y) - s.config.vision) < 0.01) continue;
      expect(inside(polygon, x, y), `target ${x},${y}`).toBe(sees(s, e, { x, y }));
    }
  expect(sight(s, 6.5, 6.5, 9.5, 6.5)).toBe(false);
});
it('vision uses facing and range at map boundaries', () => {
  const s = create(),
    e = observer();
  s.walls.clear();
  e.x = 1.5;
  e.heading = Math.PI;
  s.config.vision = 3;
  const points = visionBoundary(s, e);
  expect(points.every((p) => p.x >= 1 - 1e-9)).toBe(true);
  expect(sees(s, e, { x: 2.5, y: 6.5 })).toBe(false);
  expect(sees(s, e, { x: 1.1, y: 6.5 })).toBe(true);
});
it('distraction preview eligibility matches placement at range and wall limits', () => {
  const s = create();
  s.phase = 'running';
  s.walls.clear();
  s.x = 10;
  s.y = 10;
  expect(canDistract(s, 10 + DISTRACTION_RANGE, 10)).toBe(true);
  expect(canDistract(s, 14.02, 10)).toBe(false);
  s.walls.add('11,10');
  expect(canDistract(s, 11.5, 10.5)).toBe(false);
  expect(distract(s, 11.5, 10.5)).toBe(false);
});
for (const story of [true, false])
  it(`sprint lasts four seconds in ${story ? 'story' : 'standard'} mode then requires release`, () => {
    const s = create();
    s.phase = 'running';
    s.config.story = story;
    s.walls.clear();
    s.enemies = [];
    s.items = [];
    const x = s.x;
    for (let i = 0; i < 240; i++) step(s, 1 / 60, { x: 1, y: 0, sprint: true });
    expect(s.stamina).toBe(0);
    expect(s.x - x).toBeCloseTo(s.config.run * 4);
    const exhaustedX = s.x;
    for (let i = 0; i < 60; i++) step(s, 1 / 60, { x: 1, y: 0, sprint: true });
    expect(s.x - exhaustedX).toBeCloseTo(s.config.walk);
    expect(s.sprintLocked).toBe(true);
    step(s, 1, { x: 0, y: 0, sprint: false });
    expect(s.sprintLocked).toBe(false);
    expect(s.stamina).toBeGreaterThan(0);
    step(s, 0.1, { x: 0, y: -1, sprint: true });
    expect(s.sprinting).toBe(true);
    expect(s.heading).toBeCloseTo(-Math.PI / 2);
  });
it('paused stamina and facing do not change', () => {
  const s = create();
  s.phase = 'paused';
  s.stamina = 30;
  s.heading = 1;
  step(s, 2, { x: 0, y: -1, sprint: true });
  expect(s.stamina).toBe(30);
  expect(s.heading).toBe(1);
});
