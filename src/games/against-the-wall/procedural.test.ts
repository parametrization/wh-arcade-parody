import { expect, it } from 'vitest';
import {
  create,
  loadDistrict,
  solid,
  overlapsWall,
  path,
  step,
  beginBreach,
  chooseTunnelEndpoint,
  tunnelCandidates,
  validTunnelEndpoint,
  BORDER_Y,
  MAP_WIDTH,
  MAP_HEIGHT,
  type Actor,
} from './model';

it('generates reproducible four-area maps with safe distributed spawns and connected side routes', () => {
  expect(MAP_WIDTH * MAP_HEIGHT).toBe(64 * 48);
  for (const seed of [1, 4, 71, 992])
    for (const district of [1, 2, 3]) {
      const a = create(seed),
        b = create(seed);
      a.district = b.district = district;
      loadDistrict(a);
      loadDistrict(b);
      expect([...a.walls]).toEqual([...b.walls]);
      expect(a.enemies).toEqual(b.enemies);
      expect(a.barriers).toEqual(b.barriers);
      expect(new Set(a.enemies.map((e) => `${e.x},${e.y}`)).size).toBe(a.enemies.length);
      for (const actor of a.enemies) {
        expect(overlapsWall(a, actor.x, actor.y)).toBe(false);
        for (const p of actor.patrol!.points)
          expect(
            path(a, actor, p).length || Math.hypot(actor.x - p.x, actor.y - p.y) < 0.1,
          ).toBeTruthy();
      }
      expect(path(a, a, a.office)).toEqual([]);
      expect(a.barriers).toHaveLength(62);
      expect(new Set(a.barriers.map((b) => b.material)).size).toBe(3);
    }
  expect([...create(1).walls]).not.toEqual([...create(2).walls]);
});
it('assigns side-wide wandering and fence/building/edge routes on both sides', () => {
  const s = create(19);
  for (const side of ['north', 'south']) {
    const actors = s.enemies.filter((a) => a.patrol?.side === side);
    expect(new Set(actors.map((a) => a.patrol!.kind))).toEqual(
      new Set(['normal', 'building', 'edge', 'fence', 'wander']),
    );
    const p = actors.find((a) => a.patrol?.kind === 'wander')!.patrol!.points;
    expect(Math.max(...p.map((p) => p.x)) - Math.min(...p.map((p) => p.x))).toBeGreaterThan(50);
    expect(Math.max(...p.map((p) => p.y)) - Math.min(...p.map((p) => p.y))).toBeGreaterThan(15);
    const a = actors.find((a) => a.patrol?.kind === 'fence')!;
    s.enemies = [a];
    s.phase = 'running';
    s.x = 3.5;
    s.y = 44.5;
    s.config.vision = 0;
    const before = a.x;
    for (let i = 0; i < 40; i++) step(s, 0.1);
    expect(a.x).toBeGreaterThan(before + 5);
    s.enemies = create(19).enemies;
  }
});
function tunnel() {
  const s = create();
  s.phase = 'running';
  s.enemies = [];
  const entrance = tunnelCandidates(s, 'south')[0];
  s.x = entrance.x;
  s.y = entrance.y;
  expect(beginBreach(s)).toBe(true);
  expect(s.construction).toBeNull();
  expect(chooseTunnelEndpoint(s, entrance.x, entrance.y)).toBe(true);
  const exit = s.tunnels[0].exit;
  // Controlled safe-surface fixture; generated hazards are tested separately.
  s.walls.delete(`${Math.floor(exit.x)},${Math.floor(exit.y)}`);
  s.water.delete(`${Math.floor(exit.x)},${Math.floor(exit.y)}`);
  return { s, t: s.tunnels[0], entrance, exit };
}
it('requires a concrete entrance and10 seconds, then discovers its hidden exit and crosses both ways', () => {
  const { s, t, entrance, exit } = tunnel();
  expect(validTunnelEndpoint(s, 0, 0, 'north')).toBe(false);
  step(s, 9.99);
  expect(t.open).toBe(false);
  step(s, 0.01);
  expect(t.open).toBe(true);
  expect(solid(s, entrance.x, BORDER_Y)).toBe(true);
  expect(s.tunnelTransit).not.toBeNull();
  step(s, s.tunnelTransit!.duration);
  expect({ x: s.x, y: s.y }).toEqual(exit);
  expect(overlapsWall(s, s.x, s.y)).toBe(false);
  step(s, 10);
  expect({ x: s.x, y: s.y }).toEqual(exit);
  s.x = exit.x + 1;
  step(s, 0.01);
  s.x = exit.x;
  step(s, 0.01);
  expect(s.tunnelTransit).not.toBeNull();
  step(s, s.tunnelTransit!.duration);
  expect({ x: s.x, y: s.y }).toEqual(entrance);
});
const guard = (id: number, x: number, y: number): Actor => ({
  id,
  x,
  y,
  faction: 'ICE',
  meter: 0,
  state: 'recover',
  timer: 999,
  cooldown: 0,
  originX: x,
  originY: y,
  way: 1,
  arrival: -1,
  health: 100,
});
it('repairs wire only after30 seconds and knocks down a ladder immediately', () => {
  for (const material of ['wire', 'fence'] as const) {
    const s = create();
    s.phase = 'running';
    s.enemies = [];
    const b = s.barriers.find((b) => b.material === material)!;
    s.x = b.x + 0.5;
    s.y = BORDER_Y + 1.5;
    beginBreach(s);
    step(s, material === 'wire' ? 3 : 5);
    s.x = 3.5;
    s.y = 44.5;
    s.enemies = [guard(99, b.x + 0.5, BORDER_Y - 0.5)];
    if (material === 'wire') {
      step(s, 29.99);
      expect(b.open).toBe(true);
      step(s, 0.02);
    } else step(s, 0.01);
    expect(b.open).toBe(false);
  }
});
it('requires four live guards, two per side, for90 uninterrupted tunnel repair seconds', () => {
  const { s, t, entrance, exit } = tunnel();
  step(s, 10);
  step(s, s.tunnelTransit!.duration);
  s.x = 3.5;
  s.y = 44.5;
  s.enemies = [
    guard(1, entrance.x, entrance.y),
    guard(2, entrance.x + 0.6, entrance.y),
    guard(3, exit.x, exit.y),
  ];
  step(s, 91);
  expect(t.open).toBe(true);
  expect(t.repairProgress).toBe(0);
  s.enemies.push(guard(4, exit.x + 0.6, exit.y));
  step(s, 89.99);
  expect(t.open).toBe(true);
  s.phase = 'paused';
  step(s, 100);
  expect(t.repairProgress).toBeCloseTo(89.99);
  s.phase = 'running';
  step(s, 0.02);
  expect(t.open).toBe(false);
});
it('timed underground travel ignores input and targeting, freezes on pause and waits for a clear exit', () => {
  const { s, t, entrance, exit } = tunnel();
  step(s, 10);
  const duration = Math.hypot(exit.x - entrance.x, exit.y - entrance.y) / (s.config.walk * 0.4);
  expect(s.tunnelTransit?.duration).toBeCloseTo(duration);
  s.phase = 'paused';
  step(s, 5);
  expect(s.tunnelTransit?.remaining).toBeCloseTo(duration);
  s.phase = 'running';
  s.grace = 0;
  const watcher = guard(8, entrance.x, entrance.y);
  watcher.state = 'patrol';
  const blocker = guard(9, exit.x, exit.y);
  s.enemies = [watcher, blocker];
  step(s, duration / 2, { x: 1, y: 0, sprint: true });
  expect({ x: s.x, y: s.y }).toEqual(entrance);
  expect(s.health).toBe(100);
  expect(s.phase).toBe('running');
  step(s, duration);
  expect(s.tunnelTransit?.remaining).toBe(0);
  expect(t.open).toBe(true);
  s.enemies = [];
  step(s, 0.01);
  expect(s.tunnelTransit).toBeNull();
  expect({ x: s.x, y: s.y }).toEqual(exit);
});
it('guard ladder knockdown safely dismounts an occupied player and closes in the same frame', () => {
  for (const side of ['north', 'south'] as const) {
    const s = create();
    s.phase = 'running';
    s.enemies = [];
    const b = s.barriers.find((b) => b.material === 'fence')!;
    s.x = b.x + 0.5;
    s.y = BORDER_Y + 1.5;
    beginBreach(s);
    step(s, 5);
    s.x = b.x + 0.5;
    s.y = BORDER_Y + (side === 'north' ? 0.4 : 0.6);
    s.grace = 100;
    s.enemies = [guard(42, b.x + 1.5, BORDER_Y - 0.5)];
    // Adjacent cover must not become a dismount destination.
    s.walls.add(`${b.x + 1},${BORDER_Y + (side === 'north' ? -1 : 1)}`);
    step(s, 0.01);
    expect(b.open).toBe(false);
    expect(solid(s, b.x, b.y)).toBe(true);
    expect(overlapsWall(s, s.x, s.y)).toBe(false);
    expect(side === 'north' ? s.y < BORDER_Y : s.y > BORDER_Y + 1).toBe(true);
    expect(s.health).toBe(100);
  }
});
it('chooses reproducible hidden exits1–10tiles north with bounded lateral offset and no north selection', () => {
  const exits = [];
  for (let seed = 1; seed <= 20; seed++) {
    const run = () => {
      const s = create(seed);
      s.phase = 'running';
      s.enemies = [];
      const p = tunnelCandidates(s, 'south')[0];
      s.x = p.x;
      s.y = p.y;
      beginBreach(s);
      expect(chooseTunnelEndpoint(s, p.x, p.y)).toBe(true);
      return s;
    };
    const a = run(),
      b = run(),
      t = a.tunnels[0];
    expect(t).toEqual(b.tunnels[0]);
    expect(t.discovered).toBe(false);
    expect(tunnelCandidates(a, 'north')).toEqual([]);
    expect(BORDER_Y - Math.floor(t.exit.y)).toBeGreaterThanOrEqual(1);
    expect(BORDER_Y - Math.floor(t.exit.y)).toBeLessThanOrEqual(10);
    expect(Math.abs(t.exit.x - t.entrance.x)).toBeLessThanOrEqual(5);
    expect(a.construction).not.toBeNull();
    exits.push(`${t.exit.x},${t.exit.y}`);
  }
  expect(new Set(exits).size).toBeGreaterThan(5);
});
it.each(['collapse', 'drown'] as const)(
  'reveals fatal %s only at surfacing and holds its reason until checkpoint reset',
  (kind) => {
    const { s, t, exit } = tunnel();
    const cell = `${Math.floor(exit.x)},${Math.floor(exit.y)}`;
    if (kind === 'collapse') s.walls.add(cell);
    else s.water.add(cell);
    step(s, 10);
    expect(s.tunnelTransit).not.toBeNull();
    expect(t.discovered).toBe(false);
    const duration = s.tunnelTransit!.duration;
    step(s, duration - 0.01);
    expect(s.health).toBe(100);
    expect(t.discovered).toBe(false);
    s.phase = 'paused';
    step(s, 20);
    expect(t.discovered).toBe(false);
    s.phase = 'running';
    step(s, 0.02);
    expect(s.health).toBe(0);
    expect(s.phase).toBe('checkpoint');
    expect(t.discovered).toBe(true);
    expect(t.open).toBe(false);
    expect(s.message).toContain(kind === 'collapse' ? 'collapsed' : 'drowned');
    const reason = s.message;
    step(s, 1.9);
    expect(s.message).toBe(reason);
    expect(s.phase).toBe('checkpoint');
    step(s, 0.11);
    expect(s.phase).toBe('running');
    expect(s.health).toBe(100);
  },
);
it('ponds reproduce without occupying guard spawns or patrol paths and block surface walking', () => {
  const s = create(72),
    again = create(72);
  expect([...s.water]).toEqual([...again.water]);
  expect(s.water.size).toBeGreaterThan(0);
  for (const cell of s.water) {
    const [x, y] = cell.split(',').map(Number);
    expect(solid(s, x, y)).toBe(true);
    expect(overlapsWall(s, x + 0.5, y + 0.5)).toBe(true);
    expect(s.walls.has(cell)).toBe(false);
  }
  for (const a of s.enemies) {
    expect(s.water.has(`${Math.floor(a.x)},${Math.floor(a.y)}`)).toBe(false);
    for (const p of a.patrol!.points)
      expect(path(s, a, p).length || Math.hypot(a.x - p.x, a.y - p.y) < 0.1).toBeTruthy();
  }
});
it('does not expose an undiscovered exit through reverse entry or guard repair', () => {
  const { s, t, exit } = tunnel();
  t.open = true;
  s.construction = null;
  s.x = exit.x;
  s.y = exit.y;
  step(s, 0.01);
  expect(s.tunnelTransit).toBeNull();
  expect(t.discovered).toBe(false);
});
