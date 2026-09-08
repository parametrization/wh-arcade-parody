import { describe, expect, it } from 'vitest';
import { create, step, isNight, secondsToLightChange, combatHostile, type Actor } from './model';
function pair(time: number) {
  const s = create();
  s.time = time;
  s.phase = 'running';
  s.walls.clear();
  s.enemies = [];
  s.x = 25;
  s.y = 20;
  for (let i = 0; i < 2; i++)
    s.enemies.push({
      id: i,
      faction: i ? 'Border Patrol' : 'ICE',
      x: 10 + i * 2,
      y: 5,
      originX: 10 + i * 2,
      originY: 5,
      heading: i ? Math.PI : 0,
      meter: 1,
      state: 'combat',
      target: 1 - i,
      committed: true,
      health: 100,
      timer: 0,
      cooldown: 0,
      way: 1,
      arrival: -1,
    } as Actor);
  return s;
}
describe('night simulation rules', () => {
  it('alternates exactly at simulation minute boundaries', () => {
    for (const [time, night, left] of [
      [0, false, 60],
      [59.5, false, 0.5],
      [60, true, 60],
      [119.5, true, 0.5],
      [120, false, 60],
      [180, true, 60],
    ] as const) {
      expect(isNight({ time })).toBe(night);
      expect(secondsToLightChange({ time })).toBe(left);
    }
  });
  it('keeps daylight alliances and permits every distinct faction pairing at night', () => {
    expect(combatHostile({ time: 0 }, 'ICE', 'Border Patrol')).toBe(false);
    for (const a of ['ICE', 'Border Patrol', 'Cartel', 'Paramilitary'] as const)
      for (const b of ['ICE', 'Border Patrol', 'Cartel', 'Paramilitary'] as const)
        expect(combatHostile({ time: 60 }, a, b)).toBe(true);
  });
  it('exchanges fire between federal allies at night but drops their targets at dawn', () => {
    const s = pair(60);
    step(s, 0.01);
    expect(s.enemies.map((e) => e.health)).toEqual([75, 75]);
    s.time = 119.99;
    s.enemies.forEach((e) => (e.fireCooldown = 0));
    step(s, 0.02);
    expect(s.enemies.map((e) => e.health)).toEqual([75, 75]);
    expect(s.enemies.map((e) => e.target)).toEqual([null, null]);
  });
  it('lets same-faction actors acquire one another at night without targeting themselves', () => {
    const s = pair(60);
    s.enemies.forEach((e) => {
      e.faction = 'Cartel';
      e.target = null;
      e.meter = 0;
      e.state = 'patrol';
    });
    step(s, 0.9);
    expect(s.enemies.map((e) => e.target)).toEqual([1, 0]);
  });
  it('does not advance the light cycle while paused', () => {
    const s = pair(59.9);
    s.phase = 'paused';
    step(s, 10);
    expect(s.time).toBe(59.9);
    expect(isNight(s)).toBe(false);
  });
});
