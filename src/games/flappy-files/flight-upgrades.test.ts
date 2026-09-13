import { describe, expect, it } from 'vitest';
import {
  create,
  flap,
  spawn,
  step,
  letterPosition,
  chooseFlightUpgrade,
  burstUnlocked,
  pause,
  resume,
  speed,
} from './model';

function airborne() {
  const m = create(42);
  flap(m);
  spawn(m, 500);
  m.y = 150;
  m.vy = 0;
  return m;
}
describe('letter flight upgrades', () => {
  it('collects a held letter once without colliding and freezes all timers while choosing', () => {
    const m = airborne(),
      col = m.columns[0];
    col.x = 130;
    const letter = letterPosition(m, col);
    m.y = letter.y - 20;
    step(m, 0);
    expect(m.phase).toBe('running');
    expect(col.letterCollected).toBe(true);
    expect(m.flight.pending).toBe(1);
    const before = JSON.stringify(m);
    step(m, 7);
    expect(JSON.stringify(m)).toBe(before);
    expect(chooseFlightUpgrade(m, 'speed')).toBe(true);
    step(m, 0);
    expect(m.flight.pending).toBe(0);
    expect(m.flight.speedFactor).toBeCloseTo(0.95);
    expect(chooseFlightUpgrade(m, 'speed')).toBe(false);
  });
  it('unlocks at 80 percent remaining on either axis after five same-axis choices', () => {
    for (const choice of ['speed', 'variance'] as const) {
      const m = airborne();
      m.flight.pending = 6;
      expect(chooseFlightUpgrade(m, 'fly')).toBe(false);
      for (let i = 0; i < 4; i++) chooseFlightUpgrade(m, choice);
      expect(burstUnlocked(m)).toBe(false);
      chooseFlightUpgrade(m, choice);
      expect(burstUnlocked(m)).toBe(true);
      expect(Math.min(m.flight.speedFactor, m.flight.varianceFactor)).toBeCloseTo(0.95 ** 5);
      expect(chooseFlightUpgrade(m, 'fly')).toBe(true);
      expect(m.flight.remaining).toBe(8);
    }
  });
  it('slower bounce preserves impulse height while variance reduces it', () => {
    const normal = airborne(),
      slow = airborne(),
      short = airborne();
    slow.flight.pending = short.flight.pending = 1;
    chooseFlightUpgrade(slow, 'speed');
    chooseFlightUpgrade(short, 'variance');
    flap(normal);
    flap(slow);
    flap(short);
    expect(slow.vy).toBe(normal.vy);
    expect(short.vy ** 2 / normal.vy ** 2).toBeCloseTo(0.95);
    step(normal, 0.02);
    step(slow, 0.02);
    expect(Math.abs(slow.y - 150)).toBeLessThan(Math.abs(normal.y - 150));
  });
  it('Fly doubles world speed and obeys precise directional control', () => {
    const m = airborne(),
      baseline = speed(m);
    m.flight.speedFactor = 0.77;
    m.flight.pending = 1;
    chooseFlightUpgrade(m, 'fly');
    expect(speed(m)).toBeCloseTo(baseline * 2);
    step(m, 0.1, { right: true, up: true });
    expect(m.x).toBeCloseTo(158);
    expect(m.y).toBeCloseTo(135);
    step(m, 0.1, {});
    expect(m.y).toBeCloseTo(135);
    pause(m);
    const before = JSON.stringify(m);
    step(m, 20, { left: true });
    expect(JSON.stringify(m)).toBe(before);
    resume(m);
    m.flight.remaining = 0.1;
    step(m, 0.1, {});
    expect(m.flight.mode).toBe('normal');
    expect(speed(m)).toBeCloseTo(baseline);
  });
  it('Helicopter lifts on held input and settles to gentle descent on release', () => {
    const m = airborne();
    m.flight.varianceFactor = 0.77;
    m.flight.pending = 1;
    chooseFlightUpgrade(m, 'helicopter');
    for (let i = 0; i < 30; i++) step(m, 1 / 60, { lift: true });
    expect(m.y).toBeLessThan(150);
    expect(m.vy).toBeLessThan(-90);
    for (let i = 0; i < 60; i++) step(m, 1 / 60, {});
    expect(m.vy).toBeGreaterThan(25);
    expect(m.vy).toBeLessThanOrEqual(28);
  });
});
