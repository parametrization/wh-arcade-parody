import { describe, expect, it } from 'vitest';
import { create, step, BORDER_Y, overlapsWall, loadDistrict } from './model';
import { hearBoss, stepBoss, firingInterval } from './boss';
function world() {
  const s = create(7);
  s.phase = 'running';
  s.enemies = [];
  s.walls.clear();
  s.water.clear();
  s.x = 50.5;
  s.y = 40.5;
  return s;
}
function tick(s: ReturnType<typeof create>, seconds: number) {
  for (let t = 0; t < seconds - 1e-8; t += 0.05) {
    s.time += 0.05;
    stepBoss(s, 0.05);
  }
}
describe('GB Smallman encounter', () => {
  it('investigates southern noises without crossing the border or hurting the player', () => {
    const s = world();
    hearBoss(s, { x: 20.5, y: 40.5 });
    expect(s.boss.target.y).toBeLessThan(BORDER_Y);
    for (let i = 0; i < 300; i++) {
      tick(s, 0.05);
      expect(s.boss.y).toBeLessThan(BORDER_Y);
      expect(overlapsWall(s, s.boss.x, s.boss.y)).toBe(false);
    }
    expect(s.health).toBe(100);
  });
  it('times out a silent survey after ten seconds and returns without reinforcements', () => {
    const s = world();
    s.boss.phase = 'survey';
    s.boss.remaining = 10;
    tick(s, 9.95);
    expect(s.boss.phase).toBe('survey');
    tick(s, 0.1);
    expect(['return', 'idle']).toContain(s.boss.phase);
    tick(s, 5);
    expect(s.boss.phase).toBe('idle');
    expect(s.enemies).toHaveLength(0);
  });
  it('requires five seconds of radio and ten of phone, then dispatches exactly four distinct safe responders once', () => {
    const s = world();
    s.boss.phase = 'radio';
    s.boss.remaining = 5;
    tick(s, 4.95);
    expect(s.boss.phase).toBe('radio');
    tick(s, 0.1);
    expect(s.boss.phase).toBe('phone');
    tick(s, 9.9);
    expect(s.enemies).toHaveLength(0);
    tick(s, 0.2);
    expect(s.enemies).toHaveLength(4);
    expect(s.enemies.filter((e) => e.faction === 'ICE')).toHaveLength(2);
    expect(s.enemies.filter((e) => e.faction === 'Border Patrol')).toHaveLength(2);
    expect(new Set(s.enemies.map((e) => `${e.x},${e.y}`)).size).toBe(4);
    for (const e of s.enemies) {
      expect(overlapsWall(s, e.x, e.y)).toBe(false);
      expect(e.y).toBeLessThan(BORDER_Y);
      expect(firingInterval(e)).toBe(0.4);
    }
    expect(firingInterval({})).toBe(0.8);
    tick(s, 40);
    hearBoss(s, s, true);
    tick(s, 40);
    expect(s.enemies).toHaveLength(4);
  });
  it('fresh noise interrupts a call but completed dispatch ignores interruptions', () => {
    const s = world();
    s.boss.phase = 'phone';
    s.boss.remaining = 1;
    hearBoss(s, { x: 20.5, y: 10.5 }, true);
    expect(s.boss.phase).toBe('investigate');
    expect(s.enemies).toHaveLength(0);
    s.boss.phase = 'return';
    s.boss.calls = 1;
    hearBoss(s, { x: 30, y: 10 }, true);
    expect(s.boss.phase).toBe('return');
  });
  it('expires trails on simulation time, triggers each overlap once and freezes fully when paused', () => {
    const s = world();
    s.boss.trails = [{ x: s.x, y: s.y, expires: 30, id: 1 }];
    tick(s, 0.05);
    expect(s.boss.triggered).toBe(1);
    const target = { ...s.boss.target };
    s.boss.phase = 'radio';
    s.boss.remaining = 5;
    tick(s, 0.05);
    expect(s.boss.phase).toBe('radio');
    expect(s.boss.target).toEqual(target);
    s.phase = 'paused';
    const before = JSON.stringify(s.boss);
    step(s, 31);
    stepBoss(s, 31);
    expect(JSON.stringify(s.boss)).toBe(before);
    s.phase = 'running';
    s.time = 30.01;
    stepBoss(s, 0.01);
    expect(s.boss.trails).toHaveLength(0);
    s.boss.trails.push({ x: 3, y: 3, expires: 99, id: 2 });
    loadDistrict(s);
    expect(s.boss.trails).toHaveLength(0);
    expect(s.boss.calls).toBe(0);
  });
  it('navigates around walls and maintains twice ordinary patrol speed on open ground', () => {
    const s = world();
    s.boss.x = 8.5;
    s.boss.y = 4.5;
    hearBoss(s, { x: 12.5, y: 4.5 });
    tick(s, 0.5);
    expect(s.boss.walkDistance).toBeCloseTo(2.2);
    s.walls.add('11,4');
    hearBoss(s, { x: 14.5, y: 4.5 }, true);
    for (let i = 0; i < 80; i++) {
      tick(s, 0.05);
      expect(overlapsWall(s, s.boss.x, s.boss.y)).toBe(false);
    }
  });
});
