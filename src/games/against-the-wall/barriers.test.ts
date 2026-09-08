import { describe, expect, it } from 'vitest';
import { create, loadDistrict, path, move, step, solid, beginBreach, barrierRules } from './model';

describe('continuous authored border', () => {
  it.each([1, 2, 3])('seals north from south without an end-run in district %s', (district) => {
    const s = create();
    s.district = district;
    loadDistrict(s);
    expect(s.y).toBeGreaterThan(11);
    expect(s.office.y).toBeLessThan(10);
    for (let x = 0; x < 32; x++) expect(solid(s, x, 10), `barrier ${x},10`).toBe(true);
    expect(path(s, s, s.office)).toEqual([]);
    for (const x of [1.22, 30.78]) {
      const a = { x, y: 11.5 };
      move(s, a, 0, -4);
      expect(a.y).toBeGreaterThanOrEqual(11.219);
    }
  });

  it.each([1, 2, 3])(
    'places federal patrols north and cartel/paramilitary actors south in district %s',
    (district) => {
      const s = create();
      s.district = district;
      loadDistrict(s);
      expect(s.enemies.length).toBeGreaterThan(0);
      expect(
        s.enemies
          .filter((a) => a.faction === 'Cartel')
          .map((a) => a.group)
          .sort(),
      ).toEqual(['CJNG', 'Gulf', 'Sinaloa']);
      expect(s.enemies.some((a) => a.faction === 'ICE')).toBe(true);
      expect(s.enemies.some((a) => a.faction === 'Border Patrol')).toBe(true);
      for (const actor of s.enemies) {
        if (actor.faction === 'ICE' || actor.faction === 'Border Patrol')
          expect(actor.y).toBeLessThan(10);
        else expect(actor.y).toBeGreaterThan(11);
      }
    },
  );
});

function setup(material: 'wire' | 'fence' | 'concrete') {
  const s = create();
  s.phase = 'running';
  s.enemies = [];
  const b = s.barriers.find(
    (b) => b.material === material && !solid(s, b.x, 11) && !solid(s, b.x, 9),
  )!;
  expect(b).toBeDefined();
  s.x = b.x + 0.5;
  s.y = 11.5;
  return { s, b };
}
describe('constructed crossings', () => {
  it.each(['wire', 'fence', 'concrete'] as const)(
    '%s requires its full construction time and opens a route',
    (material) => {
      const { s, b } = setup(material),
        seconds = barrierRules[material].seconds;
      expect(beginBreach(s)).toBe(true);
      step(s, seconds - 0.01);
      expect(b.open).toBe(false);
      expect(solid(s, b.x, b.y)).toBe(true);
      step(s, 0.01);
      expect(b.open).toBe(true);
      expect(s.construction).toBeNull();
      expect(solid(s, b.x, b.y)).toBe(false);
      expect(path(s, s, s.office).length).toBeGreaterThan(0);
      s.x = b.x + 0.5;
      s.y = b.y + 0.5;
      const before = s.y;
      step(s, 0.05, { x: 0, y: -1, sprint: false });
      expect(before - s.y).toBeCloseTo(s.config.walk * 0.05 * barrierRules[material].speed);
    },
  );
  it.each(['wire', 'concrete'] as const)('%s remains open after twenty seconds', (material) => {
    const { s, b } = setup(material);
    beginBreach(s);
    step(s, barrierRules[material].seconds);
    step(s, 30);
    expect(b.open).toBe(true);
    expect(solid(s, b.x, b.y)).toBe(false);
  });
  it('expires the ladder after20 seconds but defers closure for a full-body overlap', () => {
    const { s, b } = setup('fence');
    beginBreach(s);
    step(s, 5);
    step(s, 19.99);
    expect(b.open).toBe(true);
    s.x = b.x + 0.5;
    s.y = b.y + 1.1;
    step(s, 0.02);
    expect(b.open).toBe(true);
    expect(solid(s, b.x, b.y)).toBe(false);
    s.y = b.y + 1.3;
    step(s, 0.01);
    expect(b.open).toBe(false);
    expect(solid(s, b.x, b.y)).toBe(true);
  });
  it('movement cancels construction and pause freezes progress and expiration', () => {
    const { s, b } = setup('wire');
    beginBreach(s);
    step(s, 1);
    expect(b.progress).toBeCloseTo(1 / 3);
    s.phase = 'paused';
    const snapshot = JSON.stringify(s);
    step(s, 10);
    expect(JSON.stringify(s)).toBe(snapshot);
    s.phase = 'running';
    step(s, 0.1, { x: 1, y: 0, sprint: false });
    expect(s.construction).toBeNull();
    expect(b.progress).toBe(0);
    expect(b.open).toBe(false);
    const f = setup('fence');
    beginBreach(f.s);
    step(f.s, 5);
    f.s.phase = 'paused';
    step(f.s, 40);
    expect(f.b.remaining).toBe(20);
    expect(f.b.open).toBe(true);
  });
  it('rejects distant and non-running construction', () => {
    const s = create();
    expect(beginBreach(s)).toBe(false);
    s.phase = 'running';
    expect(beginBreach(s)).toBe(false);
    expect(s.construction).toBeNull();
  });
});
