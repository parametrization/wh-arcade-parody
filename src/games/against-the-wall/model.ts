import { createBarriers, barrierRules, type Barrier, type BarrierMaterial } from './barriers';
export { barrierRules } from './barriers';
import { wallEntry, VISION_HALF_ANGLE, DISTRACTION_RANGE } from './visibility';
export type Faction = 'Cartel' | 'Paramilitary' | 'Border Patrol' | 'ICE';
export type Phase = 'title' | 'running' | 'paused' | 'checkpoint' | 'district' | 'won';
export interface Actor {
  x: number;
  y: number;
  id: number;
  faction: Faction;
  group?: string;
  meter: number;
  state: 'patrol' | 'alert' | 'chase' | 'investigate' | 'clash' | 'recover' | 'combat' | 'dead';
  health?: number;
  target?: 'player' | number | null;
  committed?: boolean;
  lastSeen?: { x: number; y: number };
  heading?: number;
  fireCooldown?: number;
  shot?: number;
  walkDistance?: number;
  moving?: boolean;
  timer: number;
  cooldown: number;
  originX: number;
  originY: number;
  way: number;
  arrival: number;
}
export interface Config {
  walk: number;
  run: number;
  vision: number;
  detection: number;
  clash: number;
  story: boolean;
}
export const defaults: Config = {
  walk: 2.8,
  run: 4.2,
  vision: 5,
  detection: 0.8,
  clash: 5,
  story: true,
};
export interface State {
  barriers: Barrier[];
  construction: null | { x: number; y: number; progress: number };
  crossing: null | { x: number; y: number; material: BarrierMaterial };
  phase: Phase;
  time: number;
  district: number;
  seed: number;
  x: number;
  y: number;
  stamina: number;
  heading: number;
  sprinting: boolean;
  sprintLocked: boolean;
  health: number;
  walkDistance: number;
  moving: boolean;
  tokens: number;
  grace: number;
  walls: Set<string>;
  enemies: Actor[];
  beacon: null | { x: number; y: number; time: number };
  items: { x: number; y: number; type: 'water' | 'token' | 'supply'; taken: boolean }[];
  companion: { x: number; y: number; helped: boolean };
  localSupplies: number;
  supplies: number;
  companions: number;
  score: number;
  office: { x: number; y: number };
  message: string;
  config: Config;
  checkpointTime: number;
  gate: {
    x: number;
    y: number;
    phase: 'idle' | 'warning' | 'closed';
    remaining: number;
    nextAt: number;
  };
}
export const key = (x: number, y: number) => `${Math.floor(x)},${Math.floor(y)}`;
export function create(seed = 1, config = { ...defaults }): State {
  const s: State = {
    barriers: [],
    construction: null,
    crossing: null,
    phase: 'title',
    time: 0,
    district: 1,
    seed,
    x: 3.5,
    y: 18.5,
    stamina: 100,
    heading: 0,
    sprinting: false,
    sprintLocked: false,
    health: 100,
    walkDistance: 0,
    moving: false,
    tokens: 2,
    grace: 0.75,
    walls: new Set(),
    enemies: [],
    beacon: null,
    items: [],
    companion: { x: 4.5, y: 7.5, helped: false },
    localSupplies: 0,
    supplies: 0,
    companions: 0,
    score: 0,
    office: { x: 27.5, y: 3.5 },
    message: 'Reach the Asylum Office. Every story deserves a hearing.',
    config: { ...config },
    checkpointTime: 0,
    gate: { x: 18, y: 6, phase: 'idle', remaining: 0, nextAt: 18 },
  };
  loadDistrict(s);
  return s;
}
export function loadDistrict(s: State) {
  s.x = 3.5;
  s.y = 18.5;
  s.stamina = 100;
  s.heading = 0;
  s.sprinting = false;
  s.sprintLocked = false;
  s.health = 100;
  s.walkDistance = 0;
  s.moving = false;
  s.tokens = 2;
  s.grace = 0.75;
  s.beacon = null;
  s.localSupplies = 0;
  s.walls = new Set();
  s.barriers = createBarriers();
  s.construction = null;
  s.crossing = null;
  for (const b of s.barriers) s.walls.add(key(b.x, b.y));
  for (let x = 0; x < 32; x++) {
    s.walls.add(key(x, 0));
    s.walls.add(key(x, 23));
  }
  for (let y = 0; y < 24; y++) {
    s.walls.add(key(0, y));
    s.walls.add(key(31, y));
  }
  for (const [x, y, w, h] of [
    [8, 4, 2, 5],
    [15, 14, 2, 6],
    [22, 4, 2, 4],
    [6, 14, 2, 2],
  ] as number[][])
    for (let a = x; a < x + w; a++) for (let b = y; b < y + h; b++) s.walls.add(key(a, b));
  const extra =
    s.district === 2
      ? [
          [11, 12, 2, 2],
          [25, 16, 3, 2],
        ]
      : s.district === 3
        ? [
            [4, 5, 3, 1],
            [18, 13, 2, 2],
            [26, 13, 2, 2],
          ]
        : [];
  for (const [x, y, w, h] of extra)
    for (let a = x; a < x + w; a++) for (let b = y; b < y + h; b++) s.walls.add(key(a, b));
  s.gate = {
    x: s.district === 2 ? 19 : 18,
    y: 6,
    phase: 'idle',
    remaining: 0,
    nextAt: s.time + 18,
  };
  s.companion = { x: 5.5, y: 7.5, helped: false };
  s.items = [
    { x: 5.5, y: 16.5, type: 'water', taken: false },
    { x: 12.5, y: 17.5, type: 'token', taken: false },
    { x: 19.5, y: 16.5, type: 'supply', taken: false },
    { x: 26.5, y: 8.5, type: 'supply', taken: false },
  ];
  const spawns: { faction: Faction; group?: string; x: number; y: number }[] = [
    { faction: 'Cartel', group: 'Sinaloa', x: 6.5, y: 19.5 },
    { faction: 'Cartel', group: 'CJNG', x: 12.5, y: 13.5 },
    { faction: 'Cartel', group: 'Gulf', x: 25.5, y: 18.5 },
    { faction: 'Paramilitary', x: 19.5, y: 15.5 },
    { faction: 'Border Patrol', x: 12.5, y: 5.5 },
    { faction: 'ICE', x: 26.5, y: 5.5 },
  ];
  s.enemies = spawns.map((spawn, i) => ({
    id: i,
    x: spawn.x,
    y: spawn.y,
    faction: spawn.faction,
    group: spawn.group,
    meter: 0,
    state: 'patrol',
    timer: 0,
    cooldown: 0,
    originX: spawn.x,
    originY: spawn.y,
    way: 1,
    arrival: -1,
    health: 100,
    target: null,
    committed: false,
    heading: 0,
    fireCooldown: 0,
    shot: 0,
    walkDistance: 0,
    moving: false,
  }));
  s.message = [
    '',
    'The Toll Road: use cover and carry on.',
    'The Photo Opportunity: rival pursuers can distract each other.',
    'The Moving Goalpost: the intake desk is ahead.',
  ][s.district];
}
export function solid(s: State, x: number, y: number) {
  return x < 1 || y < 1 || x >= 31 || y >= 23 || s.walls.has(key(x, y));
}
export function sight(s: State, ax: number, ay: number, bx: number, by: number) {
  if (solid(s, ax, ay) || solid(s, bx, by)) return false;
  for (let x = Math.floor(Math.min(ax, bx)); x <= Math.floor(Math.max(ax, bx)); x++)
    for (let y = Math.floor(Math.min(ay, by)); y <= Math.floor(Math.max(ay, by)); y++) {
      if (!s.walls.has(key(x, y))) continue;
      if (wallEntry(ax, ay, bx, by, x, y) <= 1) return false;
    }
  return true;
}
export function path(
  s: State,
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number }[] {
  const start = key(from.x, from.y),
    goal = key(to.x, to.y),
    queue = [start],
    prev = new Map<string, string | null>([[start, null]]);
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i];
    if (at === goal) break;
    const [x, y] = at.split(',').map(Number);
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const next = key(x + dx, y + dy);
      if (!prev.has(next) && !solid(s, x + dx, y + dy)) {
        prev.set(next, at);
        queue.push(next);
      }
    }
  }
  if (!prev.has(goal)) return [];
  const out = [];
  let at: string | null = goal;
  while (at && at !== start) {
    const [x, y] = at.split(',').map(Number);
    out.push({ x: x + 0.5, y: y + 0.5 });
    at = prev.get(at) ?? null;
  }
  return out.reverse();
}
/** True circle/AABB overlap catches adjoining tile corners, not only axis samples. */
export function overlapsWall(s: State, x: number, y: number, radius = 0.22): boolean {
  if (x - radius < 1 || y - radius < 1 || x + radius > 31 || y + radius > 23) return true;
  for (let tx = Math.floor(x - radius); tx <= Math.floor(x + radius); tx++)
    for (let ty = Math.floor(y - radius); ty <= Math.floor(y + radius); ty++) {
      if (!s.walls.has(key(tx, ty))) continue;
      const nearestX = Math.max(tx, Math.min(x, tx + 1)),
        nearestY = Math.max(ty, Math.min(y, ty + 1));
      if ((x - nearestX) ** 2 + (y - nearestY) ** 2 < radius ** 2 - 1e-10) return true;
    }
  return false;
}
export function move(
  s: State,
  who: { x: number; y: number; walkDistance?: number; moving?: boolean },
  dx: number,
  dy: number,
  r = 0.22,
) {
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.min(0.1, r / 2)));
  const startX = who.x,
    startY = who.y;
  for (let i = 0; i < count; i++) {
    if (!overlapsWall(s, who.x + dx / count, who.y, r)) who.x += dx / count;
    if (!overlapsWall(s, who.x, who.y + dy / count, r)) who.y += dy / count;
  }
  const travel = Math.hypot(who.x - startX, who.y - startY);
  who.moving = travel > 0.0001;
  who.walkDistance = (who.walkDistance ?? 0) + travel;
}
/** Fictional encounter rules: federal agencies are allied; neither fires on its own faction. */
export function hostile(a: Faction, b: Faction): boolean {
  if (a === b) return false;
  if (['ICE', 'Border Patrol'].includes(a) && ['ICE', 'Border Patrol'].includes(b)) return false;
  return true;
}
export function sees(s: State, e: Actor, target: { x: number; y: number }): boolean {
  const dx = target.x - e.x,
    dy = target.y - e.y,
    angle = Math.atan2(dy, dx),
    heading = e.heading ?? (e.way < 0 ? Math.PI : 0);
  return (
    Math.hypot(dx, dy) < s.config.vision &&
    Math.abs(Math.atan2(Math.sin(angle - heading), Math.cos(angle - heading))) <=
      VISION_HALF_ANGLE &&
    sight(s, e.x, e.y, target.x, target.y)
  );
}
function targetActor(
  s: State,
  id: 'player' | number | null | undefined,
): { x: number; y: number } | null {
  if (id === 'player') return s;
  return typeof id === 'number'
    ? (s.enemies.find((e) => e.id === id && e.state !== 'dead') ?? null)
    : null;
}
function clearTarget(e: Actor) {
  e.target = null;
  e.committed = false;
  e.lastSeen = undefined;
  e.meter = 0;
  if (e.state !== 'dead') e.state = 'patrol';
}
function damage(s: State, target: 'player' | number, amount: number) {
  if (target === 'player') {
    if (s.grace <= 0) s.health = Math.max(0, s.health - amount);
    return;
  }
  const e = s.enemies.find((e) => e.id === target);
  if (!e || e.state === 'dead') return;
  e.health = Math.max(0, (e.health ?? 100) - amount);
  if (e.health === 0) {
    e.state = 'dead';
    e.target = null;
    e.meter = 0;
    e.moving = false;
    e.shot = 0;
  }
}
export function interact(s: State) {
  if (s.phase !== 'running') return;
  if (!s.companion.helped && Math.hypot(s.x - s.companion.x, s.y - s.companion.y) < 1.6) {
    s.companion.helped = true;
    s.message = 'A neighbor reached a safe shelter.';
  }
  for (const item of s.items)
    if (item.type === 'supply' && !item.taken && Math.hypot(s.x - item.x, s.y - item.y) < 1.6) {
      item.taken = true;
      s.localSupplies++;
      s.message = 'Supplies collected for the intake desk.';
    }
}
export function canDistract(s: State, x: number, y: number) {
  return (
    s.phase === 'running' &&
    s.tokens > 0 &&
    !solid(s, x, y) &&
    Math.hypot(x - s.x, y - s.y) <= DISTRACTION_RANGE
  );
}
export function distract(s: State, x: number, y: number) {
  if (!canDistract(s, x, y)) return false;
  s.tokens--;
  s.beacon = { x, y, time: 4 };
  for (const e of s.enemies) {
    e.arrival = -1;
    if (
      e.cooldown <= 0 &&
      Math.hypot(x - e.x, y - e.y) < 8 &&
      !['clash', 'recover', 'dead'].includes(e.state)
    ) {
      e.state = 'investigate';
      e.target = null;
      e.committed = false;
      e.meter = 0;
    }
  }
  s.message = 'Noise beacon placed. Draw competing factions together.';
  return true;
}
export function step(s: State, dt: number, input = { x: 0, y: 0, sprint: false }) {
  if (s.phase === 'checkpoint') {
    s.checkpointTime -= dt;
    if (s.checkpointTime <= 0) {
      loadDistrict(s);
      s.phase = 'running';
    }
    return;
  }
  if (s.phase !== 'running') return;
  s.time += dt;
  gateStep(s, dt);
  if (Math.hypot(input.x, input.y) > 0) cancelBreach(s);
  barrierStep(s, dt);
  s.grace = Math.max(0, s.grace - dt);
  s.moving = false;
  const length = Math.hypot(input.x, input.y);
  if (!input.sprint) s.sprintLocked = false;
  const run = input.sprint && !s.sprintLocked && s.stamina > 1e-8;
  const sprintSeconds = run && length ? Math.min(dt, s.stamina / 25) : 0;
  if (length) {
    s.heading = Math.atan2(input.y, input.x);
    const crossing = s.barriers.find((b) => b.open && key(s.x, s.y) === key(b.x, b.y));
    const distance =
      (s.config.run * sprintSeconds + s.config.walk * (dt - sprintSeconds)) *
      (crossing ? barrierRules[crossing.material].speed : 1);
    move(s, s, (input.x / length) * distance, (input.y / length) * distance);
  }
  const underfoot = s.barriers.find((b) => b.open && key(s.x, s.y) === key(b.x, b.y));
  s.crossing = underfoot ? { x: underfoot.x, y: underfoot.y, material: underfoot.material } : null;
  s.sprinting = sprintSeconds > 0 && s.moving;
  if (s.sprinting) {
    s.stamina = Math.max(0, s.stamina - sprintSeconds * 25);
    if (s.stamina < 1e-8) {
      s.stamina = 0;
      s.sprintLocked = true;
    }
  } else s.stamina = Math.min(100, s.stamina + 25 * dt);
  for (const item of s.items)
    if (
      !item.taken &&
      item.type !== 'supply' &&
      !(item.type === 'water' && s.sprinting) &&
      Math.hypot(s.x - item.x, s.y - item.y) < 0.7
    ) {
      item.taken = true;
      if (item.type === 'water') s.stamina = Math.min(100, s.stamina + 30);
      else s.tokens = Math.min(2, s.tokens + 1);
    }
  if (s.beacon) {
    s.beacon.time -= dt;
    if (s.beacon.time <= 0) s.beacon = null;
  }
  const shots: { from: Actor; target: 'player' | number }[] = [];
  for (const e of s.enemies) {
    e.health ??= 100;
    e.fireCooldown = Math.max(0, (e.fireCooldown ?? 0) - dt);
    e.shot = Math.max(0, (e.shot ?? 0) - dt);
    e.moving = false;
    if (e.state === 'dead') continue;
    e.cooldown = Math.max(0, e.cooldown - dt);
    if (e.state === 'clash' || e.state === 'recover') {
      e.timer -= dt;
      if (e.timer <= 0) {
        if (e.state === 'clash') {
          e.state = 'recover';
          e.timer = 2;
        } else {
          clearTarget(e);
          e.cooldown = 10;
        }
      }
      continue;
    }
    if (e.state === 'investigate' && !s.beacon) clearTarget(e);
    let target = targetActor(s, e.target);
    if (e.target != null && !target) clearTarget(e);
    // A beacon deliberately competes with perception until investigators reach it.
    if (e.state !== 'investigate') {
      if (!target) {
        const candidates: ['player' | number, { x: number; y: number }][] = [
          ['player', s],
          ...s.enemies
            .filter(
              (other) =>
                other.id !== e.id && other.state !== 'dead' && hostile(e.faction, other.faction),
            )
            .map((other) => [other.id, other] as [number, Actor]),
        ];
        const visible = candidates
          .filter(([, a]) => sees(s, e, a))
          .sort(
            (a, b) =>
              Math.hypot(a[1].x - e.x, a[1].y - e.y) - Math.hypot(b[1].x - e.x, b[1].y - e.y) ||
              String(a[0]).localeCompare(String(b[0])),
          );
        if (visible.length) {
          e.target = visible[0][0];
          target = visible[0][1];
        }
      }
      const visible = target !== null && sees(s, e, target);
      e.meter = Math.max(
        0,
        Math.min(1, e.meter + dt * (visible ? 1 / s.config.detection : -1 / 1.2)),
      );
      if (visible && target) e.lastSeen = { x: target.x, y: target.y };
      if (e.meter >= 1 - 1e-9) e.committed = true;
      if (e.meter <= 0) {
        clearTarget(e);
        target = null;
      } else e.state = e.committed ? 'chase' : 'alert';
      if (e.committed && visible && target && Math.hypot(target.x - e.x, target.y - e.y) <= 3.6) {
        e.state = 'combat';
        e.heading = Math.atan2(target.y - e.y, target.x - e.x);
        if ((e.fireCooldown ?? 0) <= 0 && e.target != null) {
          shots.push({ from: e, target: e.target });
          e.fireCooldown = 0.8;
          e.shot = 0.12;
        }
        continue;
      }
    }
    let destination: { x: number; y: number } | null = null,
      speed = 2.2;
    if (e.state === 'investigate' && s.beacon) {
      destination = s.beacon;
      speed = 2.6;
      if (Math.hypot(e.x - destination.x, e.y - destination.y) < 0.6 && e.arrival < 0)
        e.arrival = s.time;
    } else if (e.meter > 0 && e.lastSeen) {
      destination = e.lastSeen;
      speed = e.committed ? 3.2 : 2.2;
    } else {
      destination = { x: e.originX + e.way * 2, y: e.originY };
      if (
        Math.hypot(e.x - destination.x, e.y - destination.y) < 0.3 ||
        solid(s, destination.x, destination.y)
      ) {
        e.way *= -1;
        destination = { x: e.originX + e.way * 2, y: e.originY };
      }
    }
    if (e.meter > 0 && target && Math.hypot(target.x - e.x, target.y - e.y) < 1.4) {
      e.heading = Math.atan2(target.y - e.y, target.x - e.x);
      destination = null;
    }
    if (destination) {
      const next =
        path(s, e, destination)[0] ??
        (!solid(s, destination.x, destination.y) &&
        key(e.x, e.y) === key(destination.x, destination.y)
          ? destination
          : null);
      if (next) {
        const distance = Math.hypot(next.x - e.x, next.y - e.y);
        if (distance > 0.03) {
          e.heading = Math.atan2(next.y - e.y, next.x - e.x);
          move(
            s,
            e,
            ((next.x - e.x) / distance) * Math.min(distance, speed * dt),
            ((next.y - e.y) / distance) * Math.min(distance, speed * dt),
          );
        }
      }
    }
  }
  // Resolve a simultaneous volley after acquisition so iteration order cannot prevent return fire.
  for (const shot of shots) {
    const target = targetActor(s, shot.target);
    if (!target || !sight(s, shot.from.x, shot.from.y, target.x, target.y)) continue;
    if (shot.target === 'player') damage(s, 'player', 20);
    else {
      const rival = s.enemies.find((e) => e.id === shot.target);
      if (rival && hostile(shot.from.faction, rival.faction)) {
        damage(s, rival.id, 25);
        if (rival.state !== 'dead') {
          rival.target = shot.from.id;
          rival.committed = true;
          rival.meter = 1;
          rival.lastSeen = { x: shot.from.x, y: shot.from.y };
          rival.heading = Math.atan2(shot.from.y - rival.y, shot.from.x - rival.x);
        }
      }
    }
  }
  if (s.beacon) {
    const arrived = s.enemies
      .filter(
        (e) =>
          e.state === 'investigate' && e.arrival >= 0 && s.time - e.arrival <= 2 && e.cooldown <= 0,
      )
      .sort((a, b) => a.id - b.id);
    for (let i = 0; i + 1 < arrived.length; i += 2) {
      const a = arrived[i],
        b = arrived[i + 1];
      if (hostile(a.faction, b.faction)) {
        for (const [actor, target] of [
          [a, b],
          [b, a],
        ]) {
          actor.state = 'combat';
          actor.target = target.id;
          actor.committed = true;
          actor.meter = 1;
          actor.lastSeen = { x: target.x, y: target.y };
          actor.heading = Math.atan2(target.y - actor.y, target.x - actor.x);
          actor.fireCooldown = 0.2;
        }
        s.message = 'Rival factions turn on one another. Use the opening to reach safety.';
      } else {
        a.state = b.state = 'clash';
        a.timer = b.timer = 2;
        s.message = 'Allied pursuers argue over the checkpoint; they do not shoot each other.';
      }
    }
  }
  if (
    s.grace <= 0 &&
    (s.health <= 0 ||
      s.enemies.some(
        (e) =>
          !['clash', 'recover', 'dead', 'combat'].includes(e.state) &&
          Math.hypot(e.x - s.x, e.y - s.y) < 0.55,
      ))
  ) {
    s.phase = 'checkpoint';
    s.checkpointTime = 0.5;
    s.beacon = null;
    s.message = 'Try another route. Returning to the district checkpoint.';
    return;
  }
  if (Math.hypot(s.x - s.office.x, s.y - s.office.y) < 1) {
    s.supplies += s.localSupplies;
    s.companions += s.companion.helped ? 1 : 0;
    s.score = s.supplies * 50 + s.companions * 200 + (s.district === 3 ? 1000 : 0);
    s.phase = s.district === 3 ? 'won' : 'district';
    s.message =
      s.phase === 'won'
        ? 'You reached intake. Your story deserves to be heard.'
        : 'District crossed. Your supplies and help are recorded.';
  }
}
export function next(s: State) {
  if (s.phase === 'district') {
    s.district++;
    loadDistrict(s);
    s.phase = 'running';
  }
}

export function gateStep(s: State, dt: number) {
  if (s.district < 2) return;
  const g = s.gate;
  if (g.phase === 'idle') {
    if (s.time >= g.nextAt) {
      g.phase = 'warning';
      g.remaining = 2;
      s.message = 'Moving goalpost: a gate closes in two seconds. An alternate route stays open.';
    }
    return;
  }
  g.remaining -= dt;
  if (g.remaining > 1e-9) return;
  if (g.phase === 'closed') {
    s.walls.delete(key(g.x, g.y));
    g.phase = 'idle';
    g.nextAt = s.time + 18;
    return;
  }
  const occupied = [s, ...s.enemies.filter((e) => e.state !== 'dead')].some((a) => {
    const nx = Math.max(g.x, Math.min(a.x, g.x + 1)),
      ny = Math.max(g.y, Math.min(a.y, g.y + 1));
    return Math.hypot(a.x - nx, a.y - ny) < 0.22;
  });
  if (occupied) {
    g.remaining = 0.5;
    return;
  }
  s.walls.add(key(g.x, g.y));
  if (!path(s, s, s.office).length) {
    s.walls.delete(key(g.x, g.y));
    g.phase = 'idle';
    g.nextAt = s.time + 12;
    s.message = 'The gate malfunctioned. The route remains open.';
    return;
  }
  g.phase = 'closed';
  g.remaining = 4;
  s.message = 'Gate closed briefly. Follow the open route around it.';
}

export function nearestBarrier(s: State): Barrier | null {
  return (
    s.barriers
      .filter((b) => !b.open && Math.hypot(s.x - b.x - 0.5, s.y - b.y - 0.5) <= 1.6)
      .sort(
        (a, b) =>
          Math.hypot(s.x - a.x - 0.5, s.y - a.y - 0.5) -
          Math.hypot(s.x - b.x - 0.5, s.y - b.y - 0.5),
      )[0] ?? null
  );
}
export function cancelBreach(s: State) {
  if (s.construction) {
    const b = s.barriers.find((b) => b.x === s.construction!.x && b.y === s.construction!.y);
    if (b && !b.open) b.progress = 0;
  }
  s.construction = null;
}
export function beginBreach(s: State) {
  if (s.phase !== 'running') return false;
  if (s.construction) {
    cancelBreach(s);
    return false;
  }
  const b = nearestBarrier(s);
  if (!b) return false;
  b.progress = 0;
  s.construction = { x: b.x, y: b.y, progress: 0 };
  s.message =
    b.material === 'wire'
      ? 'Cutting a gap in the wire. Stay still.'
      : b.material === 'fence'
        ? 'Building a ladder. Stay still.'
        : 'Digging a tunnel. Stay still.';
  return true;
}
function barrierStep(s: State, dt: number) {
  for (const b of s.barriers) {
    if (!b.open || barrierRules[b.material].lifetime === 0) continue;
    b.remaining = Math.max(0, b.remaining - dt);
    if (b.remaining > 0) continue;
    const occupied = [s, ...s.enemies.filter((e) => e.state !== 'dead')].some((a) => {
      const nx = Math.max(b.x, Math.min(a.x, b.x + 1)),
        ny = Math.max(b.y, Math.min(a.y, b.y + 1));
      return Math.hypot(a.x - nx, a.y - ny) < 0.22;
    });
    if (occupied) continue;
    b.open = false;
    b.progress = 0;
    s.walls.add(key(b.x, b.y));
  }
  if (!s.construction) return;
  const b = s.barriers.find((b) => b.x === s.construction!.x && b.y === s.construction!.y);
  if (!b || b.open || Math.hypot(s.x - b.x - 0.5, s.y - b.y - 0.5) > 1.6) {
    cancelBreach(s);
    return;
  }
  b.progress = Math.min(1, b.progress + dt / barrierRules[b.material].seconds);
  s.construction.progress = b.progress;
  if (b.progress >= 1 - 1e-9) {
    b.progress = 1;
    b.open = true;
    b.remaining = barrierRules[b.material].lifetime;
    s.walls.delete(key(b.x, b.y));
    s.construction = null;
    s.message =
      b.material === 'fence'
        ? 'Ladder ready for twenty seconds. Cross before it closes.'
        : 'Crossing open. Continue toward the Asylum Office.';
  }
}
