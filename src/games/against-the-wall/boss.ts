import {
  BORDER_Y,
  MAP_WIDTH,
  key,
  move,
  overlapsWall,
  path,
  sight,
  type Actor,
  type State,
} from './model';
export type BossPhase =
  'idle' | 'investigate' | 'survey' | 'to-radio' | 'radio' | 'phone' | 'return' | 'retired';
type Point = { x: number; y: number };
export interface Boss extends Point {
  phase: BossPhase;
  remaining: number;
  heading: number;
  walkDistance: number;
  moving: boolean;
  cantina: Point;
  target: Point;
  interest: Point;
  route: Point[];
  trails: (Point & { expires: number; id: number; touched?: boolean })[];
  trailId: number;
  lastTrail: number;
  triggered: number;
  calls: number;
  lastNoise: number;
}
export function initialBoss(): Boss {
  return {
    x: 4.5,
    y: 4.5,
    phase: 'idle',
    remaining: 0,
    heading: 0,
    walkDistance: 0,
    moving: false,
    cantina: { x: 4.5, y: 4.5 },
    target: { x: 4.5, y: 4.5 },
    interest: { x: 4.5, y: 4.5 },
    route: [],
    trails: [],
    trailId: 0,
    lastTrail: 0,
    triggered: -1,
    calls: 0,
    lastNoise: -10,
  };
}
function reachable(s: State, point: Point): Point {
  const candidates: Point[] = [];
  for (let y = 1; y < BORDER_Y; y++)
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      const p = { x: x + 0.5, y: y + 0.5 };
      if (!overlapsWall(s, p.x, p.y)) candidates.push(p);
    }
  candidates.sort(
    (a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y),
  );
  for (const p of candidates)
    if (key(p.x, p.y) === key(s.boss.x, s.boss.y) || path(s, s.boss, p, 'north').length) return p;
  return { x: s.boss.x, y: s.boss.y };
}
export function resetBoss(s: State) {
  s.boss = initialBoss();
  // A legal staging entrance, not a new collision block in an established route.
  const staging: Point[] = [];
  for (let y = 3; y < BORDER_Y - 3; y++)
    for (let x = 3; x < MAP_WIDTH - 3; x++) {
      let clear = true;
      if (!s.walls.has(key(x, y - 1))) continue;
      for (let dy = 0; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          if (overlapsWall(s, x + dx + 0.5, y + dy + 0.5)) clear = false;
      if (clear) staging.push({ x: x + 0.5, y: y + 0.5 });
    }
  staging.sort((a, b) => Math.hypot(a.x - 8.5, a.y - 9.5) - Math.hypot(b.x - 8.5, b.y - 9.5));
  const p = reachable(s, staging[0] ?? { x: 8.5, y: 4.5 });
  s.boss.x = p.x;
  s.boss.y = p.y;
  s.boss.cantina = { ...p };
  s.boss.target = { ...p };
}
function routeTo(s: State, p: Point, phase: BossPhase) {
  const b = s.boss;
  b.target = reachable(s, p);
  b.route = path(s, b, b.target, 'north');
  b.phase = phase;
  b.remaining = 0;
}
export function hearBoss(s: State, p: Point, force = false) {
  const b = s.boss;
  if (s.phase !== 'running' || (b.phase === 'return' && b.calls > 0) || b.phase === 'retired')
    return;
  if (!force && s.time - b.lastNoise < 3) return;
  b.lastNoise = s.time;
  b.interest = { x: p.x, y: p.y };
  routeTo(s, p, 'investigate');
}
export const firingInterval = (actor: Pick<Actor, 'reinforcement'>) =>
  actor.reinforcement ? 0.4 : 0.8;
function dispatch(s: State) {
  const b = s.boss,
    spots: Point[] = [];
  search: for (let radius = 1; radius < 8 && spots.length < 4; radius++)
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const p = { x: b.cantina.x + dx, y: b.cantina.y + dy };
        if (
          p.y >= BORDER_Y ||
          overlapsWall(s, p.x, p.y) ||
          Math.hypot(p.x - s.x, p.y - s.y) < 1 ||
          spots.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 2) ||
          s.enemies.some((e) => Math.hypot(e.x - p.x, e.y - p.y) < 1) ||
          !path(s, b.cantina, p, 'north').length
        )
          continue;
        spots.push(p);
        if (spots.length === 4) break search;
      }
  if (spots.length < 4) return false;
  const first = Math.max(-1, ...s.enemies.map((e) => e.id)) + 1;
  spots.slice(0, 4).forEach((p, i) => {
    const faction = i < 2 ? 'Border Patrol' : 'ICE';
    s.enemies.push({
      ...p,
      id: first + i,
      faction,
      group: `POSSE ${i + 1} · ${i < 2 ? 'BP' : 'ICE'}`,
      reinforcement: true,
      meter: 0,
      state: 'investigate',
      timer: 0,
      cooldown: 0,
      originX: p.x,
      originY: p.y,
      way: 1,
      arrival: -1,
      health: 100,
      target: null,
      committed: false,
      heading: Math.atan2(b.target.y - p.y, b.target.x - p.x),
      fireCooldown: 0,
      patrol: {
        kind: 'cantina response',
        points: [p, reachable(s, b.interest), b.cantina],
        index: 1,
        side: 'north',
      },
    });
  });
  b.calls++;
  s.message =
    'GB Smallman called four tactical reinforcements. The cantina can dispatch once per district.';
  return true;
}
export function stepBoss(s: State, dt: number) {
  if (s.phase !== 'running') return;
  const b = s.boss;
  b.moving = false;
  b.trails = b.trails.filter((p) => p.expires > s.time);
  const wet = b.trails.find((p) => !p.touched && Math.hypot(p.x - s.x, p.y - s.y) < 0.38);
  if (wet) {
    for (const mark of b.trails)
      if (Math.hypot(mark.x - s.x, mark.y - s.y) < 0.38) mark.touched = true;
    b.triggered = wet.id;
    hearBoss(s, s, true);
  }
  if (b.phase === 'retired' || b.phase === 'idle') return;
  const visible =
    s.y < BORDER_Y && Math.hypot(s.x - b.x, s.y - b.y) < 8 && sight(s, b.x, b.y, s.x, s.y);
  const disturbance = s.beacon ?? s.construction;
  const active =
    disturbance &&
    Math.hypot(disturbance.x - b.x, disturbance.y - b.y) < 3 &&
    sight(s, b.x, b.y, disturbance.x, disturbance.y);
  if ((b.phase === 'investigate' || b.phase === 'survey') && (visible || active))
    routeTo(s, b.cantina, 'to-radio');
  if (['investigate', 'to-radio', 'return'].includes(b.phase)) {
    if (b.route[0] && overlapsWall(s, b.route[0].x, b.route[0].y))
      b.route = path(s, b, b.target, 'north');
    let distance = dt * 4.4;
    while (distance > 0 && b.route.length) {
      const p = b.route[0],
        dx = p.x - b.x,
        dy = p.y - b.y,
        len = Math.hypot(dx, dy),
        d = Math.min(distance, len);
      b.heading = Math.atan2(dy, dx);
      if (len > 1e-6) move(s, b, (dx / len) * d, (dy / len) * d);
      distance -= d;
      if (len <= d + 1e-6) b.route.shift();
      else break;
    }
    if (b.moving && s.time - b.lastTrail >= 0.35) {
      b.lastTrail = s.time;
      b.trails.push({ x: b.x, y: b.y, expires: s.time + 30, id: ++b.trailId });
    }
    if (b.trails.length > 100) b.trails.splice(0, b.trails.length - 100);
    if (!b.route.length) {
      if (b.phase === 'investigate') {
        b.phase = 'survey';
        b.remaining = 10;
      } else if (b.phase === 'to-radio') {
        b.phase = 'radio';
        b.remaining = 5;
      } else b.phase = b.calls ? 'retired' : 'idle';
    }
  } else if (b.phase === 'survey') {
    b.remaining -= dt;
    if (!b.route.length) {
      const angle = (Math.floor((10 - b.remaining) / 2) * Math.PI) / 2;
      const point = reachable(s, {
        x: b.target.x + Math.cos(angle) * 2,
        y: b.target.y + Math.sin(angle) * 2,
      });
      if (Math.hypot(point.x - b.target.x, point.y - b.target.y) <= 15)
        b.route = path(s, b, point, 'north');
    }
    const next = b.route[0];
    if (next) {
      const dx = next.x - b.x,
        dy = next.y - b.y,
        len = Math.hypot(dx, dy),
        d = Math.min(len, dt * 2.2);
      b.heading = Math.atan2(dy, dx);
      if (len > 1e-6) move(s, b, (dx / len) * d, (dy / len) * d);
      if (len <= d + 1e-6) b.route.shift();
    }
    if (b.moving && s.time - b.lastTrail >= 0.35) {
      b.lastTrail = s.time;
      b.trails.push({ x: b.x, y: b.y, expires: s.time + 30, id: ++b.trailId });
    }
    if (b.remaining <= 0) routeTo(s, b.cantina, 'return');
  } else if (b.phase === 'radio' || b.phase === 'phone') {
    b.remaining = Math.max(0, b.remaining - dt);
    if (b.remaining === 0) {
      if (b.phase === 'radio') {
        b.phase = 'phone';
        b.remaining = 10;
      } else if (dispatch(s)) routeTo(s, b.cantina, 'return');
      else {
        b.remaining = 1;
        s.message = 'Cantina exits blocked; reinforcements wait for four clear positions.';
      }
    }
  }
}
