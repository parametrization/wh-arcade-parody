import { describe, expect, it } from 'vitest';
import { getTerrain, terrainBlocked } from './terrain';
import {
  createModel,
  nextDistrict,
  reachable,
  dock,
  spawn,
  tick,
  interval,
  advance,
  getCameraViews,
  cameraSees,
  setWaiting,
} from './model';
import { defaults } from './config';

function districtModel(district: number) {
  const m = createModel(71);
  for (let i = 0; i < district; i++) {
    m.phase = 'district-complete';
    nextDistrict(m);
  }
  return m;
}
const key = (c: { x: number; y: number }) => `${c.x},${c.y}`;

describe('authored canyon terrain routes', () => {
  it.each([0, 1, 2])(
    'connects every passable cell, pickup and office in district %s',
    (district) => {
      const m = districtModel(district);
      m.body = [m.body[0]];
      const cells = new Set(reachable(m).map(key));
      for (let y = 1; y < 17; y++)
        for (let x = 1; x < 23; x++) {
          if (!terrainBlocked(district, x, y))
            expect(cells.has(`${x},${y}`), `unreachable ${district}:${x},${y}`).toBe(true);
        }
      expect(cells.has(key(dock))).toBe(true);
      for (let n = 0; n < 40; n++) {
        m.pickup = null;
        spawn(m);
        expect(m.pickup).not.toBeNull();
        expect(cells.has(key(m.pickup!))).toBe(true);
        expect(terrainBlocked(district, m.pickup!.x, m.pickup!.y)).toBe(false);
      }
    },
  );

  it.each([0, 1, 2])(
    'provides walkable bridges across canyon and river in district %s',
    (district) => {
      for (const x of [8, 9, 15, 16]) {
        expect(getTerrain(district, x, 8)).toBe('bridge');
        expect(terrainBlocked(district, x, 8)).toBe(false);
      }
    },
  );

  it('blocks actual movement into holes, river and fence while permitting climb cells', () => {
    for (const type of ['canyon', 'river', 'fence'] as const) {
      let tested = false;
      for (let y = 1; y < 17 && !tested; y++)
        for (let x = 2; x < 23 && !tested; x++) {
          if (getTerrain(0, x, y) !== type || terrainBlocked(0, x - 1, y)) continue;
          const m = createModel(1, { ...defaults(), mode: 'standard' });
          m.body = [{ x: x - 1, y }];
          m.direction = 'right';
          m.phase = 'playing';
          m.safe = 0;
          m.pickup = null;
          tick(m);
          expect(m.body[0]).toEqual({ x: x - 1, y });
          expect(m.phase).toBe('jam');
          tested = true;
        }
      expect(tested, `movement fixture ${type}`).toBe(true);
    }
    const m = districtModel(0);
    m.body = [{ x: 19, y: 9 }];
    m.direction = 'right';
    m.phase = 'playing';
    m.pickup = null;
    const normal = interval(m);
    tick(m);
    expect(m.body[0]).toEqual({ x: 20, y: 9 });
    expect(getTerrain(0, 20, 9)).toBe('climb');
    expect(interval(m)).toBeCloseTo(normal * 1.8);
    tick(m);
    expect(m.body[0]).toEqual({ x: 21, y: 9 });
    expect(interval(m)).toBeCloseTo(normal);
  });
});

describe('sweeping surveillance and recovery', () => {
  it('uses the displayed sweep heading and excludes cells beyond cone and range', () => {
    const m = createModel();
    const view = getCameraViews(m)[0];
    expect(cameraSees(view, { x: 11, y: 5 })).toBe(true);
    expect(cameraSees(view, { x: 11, y: 8 })).toBe(false);
    expect(cameraSees(view, { x: 13, y: 3 })).toBe(false);
    m.time = view.period / 4;
    const swept = getCameraViews(m)[0];
    expect(swept.heading).not.toBe(view.heading);
    expect(cameraSees(swept, { x: 11, y: 5 })).toBe(false);
  });

  it('increments exposure while waiting, decays outside the cone, and freezes while not playing', () => {
    const m = createModel();
    m.phase = 'playing';
    m.safe = 0;
    m.body = [{ x: 11, y: 5 }];
    setWaiting(m, true);
    advance(m, 0.1);
    expect(m.cameraAlerts[0]).toBeCloseTo(0.1 / 1.5);
    expect(m.body).toEqual([{ x: 11, y: 5 }]);
    m.body = [{ x: 5, y: 8 }];
    advance(m, 0.025);
    expect(m.cameraAlerts[0]).toBeCloseTo(0.1 / 1.5 - 0.025);
    m.phase = 'ready';
    const time = m.time,
      alerts = [...m.cameraAlerts];
    advance(m, 4);
    expect(m.time).toBe(time);
    expect(m.cameraAlerts).toEqual(alerts);
    m.phase = 'playing';
    m.cameraEnabled = false;
    expect(getCameraViews(m)).toEqual([]);
  });

  it('recovers story mode at full camera exposure and prevents immediate retrigger', () => {
    const m = createModel(1, { ...defaults(), mode: 'story' });
    m.phase = 'playing';
    m.safe = 0;
    m.body = [{ x: 11, y: 5 }];
    m.cameraAlerts[0] = 0.99;
    setWaiting(m, true);
    advance(m, 0.02);
    expect(m.phase).toBe('ready');
    expect(m.cameraAlerts).toEqual([0, 0, 0]);
    expect(m.safe).toBe(1);
    expect(m.waiting).toBe(false);
    m.phase = 'playing';
    m.body = [{ x: 11, y: 5 }];
    setWaiting(m, true);
    advance(m, 0.1);
    expect(m.cameraAlerts[0]).toBe(0);
    expect(m.phase).toBe('playing');
  });
});

it('blocks camera sight through fence and rock but allows climb openings and open canyon', () => {
  const base = getCameraViews(districtModel(1))[0];
  const right = { ...base, x: 18, y: 6, heading: 0, range: 8, halfAngle: 0.5 };
  expect(cameraSees(right, { x: 22, y: 6 })).toBe(false);
  expect(cameraSees({ ...right, y: 5 }, { x: 22, y: 5 })).toBe(true);
  expect(cameraSees({ ...right, x: 7, y: 6 }, { x: 11, y: 6 })).toBe(true);
  expect(cameraSees({ ...right, x: 10, y: 11 }, { x: 12, y: 11 })).toBe(false);
});
