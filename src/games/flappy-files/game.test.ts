import { describe, it, expect } from 'vitest';
import { create, flap, step, eventStep, burger, pause, resume, nextChapter, spawn } from './model';
import { defaults, validate } from './config';
describe('Flappy Files rules', () => {
  it('freezes the seven-second obstruction while paused and clears it exactly at timeout', () => {
    const m = create();
    flap(m);
    m.event.phase = 'obscuring';
    m.event.remaining = 7;
    pause(m);
    for (let i = 0; i < 600; i++) step(m, 1 / 60);
    expect(m.event.remaining).toBe(7);
    resume(m);
    for (let i = 0; i < 419; i++) eventStep(m, 1 / 60);
    expect(m.event.phase).toBe('obscuring');
    eventStep(m, 1 / 60);
    expect(m.event.phase).toBe('exiting');
    expect(m.event.cause).toBe('timeout');
  });
  it('H consumes one burger and immediately dismisses entry or obstruction', () => {
    for (const phase of ['entering', 'obscuring'] as const) {
      const m = create();
      flap(m);
      m.burgers = 2;
      m.event.phase = phase;
      m.event.remaining = 7;
      expect(burger(m)).toBe(true);
      expect(m.event.phase).toBe('exiting');
      expect(m.burgers).toBe(1);
      expect(burger(m)).toBe(false);
      expect(m.burgers).toBe(1);
    }
  });
  it('empty and inactive throws do not consume inventory', () => {
    const m = create();
    flap(m);
    m.burgers = 1;
    expect(burger(m)).toBe(false);
    m.event.phase = 'obscuring';
    m.burgers = 0;
    expect(burger(m)).toBe(false);
    expect(m.event.phase).toBe('obscuring');
  });
  it('alternates independently animated entrance sides', () => {
    const m = create();
    m.clearances = 8;
    m.nextId = 12;
    eventStep(m, 1 / 60);
    expect(m.event.side).toBe('left');
    m.event.phase = 'cooldown';
    m.event.remaining = 0;
    eventStep(m, 1 / 60);
    expect(m.event.side).toBe('right');
  });
  it('collision beats clearance scoring', () => {
    const m = create();
    flap(m);
    m.y = 50;
    m.columns = [
      {
        id: 1,
        x: 140,
        gapY: 200,
        gap: 144,
        passed: false,
        burger: false,
        collected: false,
        name: 'Mike Johnson',
        topName: 'John Thune',
      },
    ];
    step(m, 1 / 60);
    expect(m.phase).toBe('falling');
    expect(m.clearances).toBe(0);
  });
  it('counts each passed pair once and delivers every ten', () => {
    const m = create();
    flap(m);
    m.y = 170;
    m.clearances = 9;
    m.columns = [
      {
        id: 1,
        x: 100,
        gapY: 100,
        gap: 240,
        passed: false,
        burger: false,
        collected: false,
        name: 'JD Vance',
        topName: 'Donald Trump',
      },
    ];
    step(m, 1 / 60);
    expect(m.clearances).toBe(10);
    expect(m.deliveries).toBe(1);
    step(m, 1 / 60);
    expect(m.clearances).toBe(10);
  });
  it('retains inventory across chapters and completes story at sixty', () => {
    const m = create();
    flap(m);
    m.phase = 'chapter';
    m.burgers = 2;
    m.clearances = 20;
    nextChapter(m);
    expect(m.chapter).toBe(2);
    expect(m.burgers).toBe(2);
    m.clearances = 59;
    m.deliveries = 5;
    m.y = 170;
    m.columns = [
      {
        id: 60,
        x: 100,
        gapY: 100,
        gap: 240,
        passed: false,
        burger: false,
        collected: false,
        name: 'JD Vance',
        topName: 'Donald Trump',
      },
    ];
    step(m, 1 / 60);
    expect(m.phase).toBe('won');
    expect(m.deliveries).toBe(6);
  });
  it('keeps endless running at sixty', () => {
    const m = create(1, defaults, 'endless');
    flap(m);
    m.clearances = 59;
    m.y = 170;
    m.columns = [
      {
        id: 60,
        x: 100,
        gapY: 100,
        gap: 240,
        passed: false,
        burger: false,
        collected: false,
        name: 'JD Vance',
        topName: 'Donald Trump',
      },
    ];
    step(m, 1 / 60);
    expect(m.phase).toBe('running');
  });
  it('seeds gaps and scheduled pickups deterministically within bounds', () => {
    const a = create(456),
      b = create(456);
    for (let i = 0; i < 30; i++) {
      spawn(a, i * 240);
      spawn(b, i * 240);
    }
    expect(a.columns).toEqual(b.columns);
    expect(a.columns[2].burger).toBe(true);
    for (const c of a.columns) {
      expect(c.gapY).toBeGreaterThanOrEqual(48);
      expect(c.gapY + c.gap).toBeLessThanOrEqual(350);
    }
  });
  it('validates configuration atomically including related fields', () => {
    expect(() => validate(defaults, { 'scroll.start': 200 })).toThrow();
    expect(() => validate(defaults, { 'distraction.obscureSeconds': 2 })).toThrow();
    expect(() => validate(defaults, { 'burger.capacity': NaN })).toThrow();
    expect(defaults['scroll.start']).toBe(110);
  });
});

describe('Flappy full-run fixtures', () => {
  it('a deterministic flight controller can deliver all six story packets', () => {
    const m = create(19);
    flap(m);
    for (let tick = 0; tick < 60 * 240 && m.phase !== 'won'; tick++) {
      if (m.phase === 'chapter') nextChapter(m);
      const target = m.columns.find((c) => c.x + 48 >= 142);
      const center = target ? target.gapY + target.gap / 2 : 194;
      if (m.y + 20 > center + 15 && m.vy > 0) flap(m);
      step(m, 1 / 60);
      if (m.phase === 'lost' || m.phase === 'falling')
        throw Error(
          `Controller collision at column ${m.clearances}, y=${m.y}, gap=${target?.gapY}`,
        );
    }
    expect(m.phase).toBe('won');
    expect(m.deliveries).toBe(6);
  });
});

describe('pickup and death lifecycle boundaries', () => {
  it('caps burger inventory and cannot collect the same pickup twice', () => {
    const m = create();
    flap(m);
    m.burgers = 3;
    m.y = 174;
    m.vy = 0;
    m.columns = [
      {
        id: 1,
        x: 142,
        gapY: 100,
        gap: 184,
        passed: false,
        burger: true,
        collected: false,
        name: 'JD Vance',
        topName: 'Donald Trump',
      },
    ];
    step(m, 1 / 60);
    expect(m.burgers).toBe(3);
    expect(m.columns[0].collected).toBe(true);
    m.burgers = 1;
    step(m, 1 / 60);
    expect(m.burgers).toBe(1);
  });
  it('death cancels obstruction and stops its timers', () => {
    const m = create();
    flap(m);
    m.event.phase = 'obscuring';
    m.event.remaining = 5;
    m.y = 351;
    m.vy = 500;
    step(m, 1 / 60);
    expect(m.phase).toBe('lost');
    expect(m.event.phase).toBe('idle');
    const time = m.time;
    step(m, 7);
    expect(m.time).toBe(time);
  });
});
