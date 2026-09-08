import {
  createBarriers,
  barrierRules,
  MAP_WIDTH,
  MAP_HEIGHT,
  BORDER_Y,
  type Barrier,
  type BarrierMaterial,
} from './barriers';
export { barrierRules, MAP_WIDTH, MAP_HEIGHT, BORDER_Y } from './barriers';
import { wallEntry, VISION_HALF_ANGLE, DISTRACTION_RANGE } from './visibility';
export type Faction = 'Cartel' | 'Paramilitary' | 'Border Patrol' | 'ICE';
export type Phase = 'title' | 'running' | 'paused' | 'checkpoint' | 'district' | 'won';
export interface Actor {
  x: number;
  y: number;
  id: number;
  faction: Faction;
  group?: string;
  navigation?: { target: string; wallCount: number; cells: { x: number; y: number }[] };
  patrol?: {
    kind: string;
    points: { x: number; y: number }[];
    index: number;
    side: 'north' | 'south';
  };
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
export interface Tunnel {
  id: number;
  entrance: { x: number; y: number };
  exit: { x: number; y: number };
  open: boolean;
  repairProgress: number;
}
export interface State {
  tunnelPlacement: null | { entrance: null | { x: number; y: number } };
  tunnels: Tunnel[];
  tunnelTransit: null | {
    id: number;
    remaining: number;
    duration: number;
    from: { x: number; y: number };
    to: { x: number; y: number };
  };
  tunnelCooldown: number;
  tunnelArrival: null | { x: number; y: number };
  barriers: Barrier[];
  construction: null | { x: number; y: number; progress: number; tunnelId?: number };
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
    tunnelPlacement: null,
    tunnels: [],
    tunnelTransit: null,
    tunnelCooldown: 0,
    tunnelArrival: null,
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
  s.y = 44.5;
  s.office = { x: 59.5, y: 3.5 };
  s.stamina = 100;
  s.health = 100;
  s.heading = 0;
  s.sprinting = false;
  s.sprintLocked = false;
  s.walkDistance = 0;
  s.moving = false;
  s.tokens = 2;
  s.grace = 0.75;
  s.beacon = null;
  s.localSupplies = 0;
  s.construction = null;
  s.crossing = null;
  s.tunnelPlacement = null;
  s.tunnels = [];
  s.tunnelTransit = null;
  s.tunnelCooldown = 0;
  s.tunnelArrival = null;
  let rng = (s.seed + Math.imul(s.district, 7919)) >>> 0;
  const random = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  s.barriers = createBarriers(rng);
  s.walls = new Set();
  for (let x = 0; x < MAP_WIDTH; x++) {
    s.walls.add(key(x, 0));
    s.walls.add(key(x, MAP_HEIGHT - 1));
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    s.walls.add(key(0, y));
    s.walls.add(key(MAP_WIDTH - 1, y));
  }
  for (const b of s.barriers) s.walls.add(key(b.x, b.y));
  const buildings: { x: number; y: number; w: number; h: number }[] = [];
  // Disjoint rectangular buildings retain two-cell roads and clear border approaches.
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 7; col++) {
      const x = 7 + col * 8 + Math.floor(random() * 2),
        y = [5, 14, 29, 38][row] + Math.floor(random() * 2);
      const w = 2 + Math.floor(random() * 3),
        h = 2 + Math.floor(random() * 3);
      buildings.push({ x, y, w, h });
      for (let dx = 0; dx < w; dx++)
        for (let dy = 0; dy < h; dy++) s.walls.add(key(x + dx, y + dy));
    }
  s.gate = { x: 18, y: 12, phase: 'idle', remaining: 0, nextAt: s.time + 18 };
  s.companion = { x: 5.5, y: 31.5, helped: false };
  s.items = [
    { x: 5.5, y: 42.5, type: 'water', taken: false },
    { x: 12.5, y: 26.5, type: 'token', taken: false },
    { x: 20.5, y: 26.5, type: 'supply', taken: false },
    { x: 58.5, y: 3.5, type: 'supply', taken: false },
  ];
  const points = (side: 'north' | 'south') => {
    const ys = side === 'north' ? [2.5, 11.5, 21.5] : [25.5, 35.5, 45.5];
    return ys.flatMap((y, row) =>
      [3.5, 15.5, 27.5, 39.5, 51.5, 60.5]
        .map((x) => ({ x, y }))
        .filter((p) => !overlapsWall(s, p.x, p.y))
        .sort((a, b) => (row % 2 ? b.x - a.x : a.x - b.x)),
    );
  };
  const spawns: { faction: Faction; group?: string; side: 'north' | 'south'; kind: string }[] = [
    { faction: 'Cartel', group: 'Sinaloa', side: 'south', kind: 'normal' },
    { faction: 'Cartel', group: 'CJNG', side: 'south', kind: 'building' },
    { faction: 'Cartel', group: 'Gulf', side: 'south', kind: 'edge' },
    { faction: 'Paramilitary', side: 'south', kind: 'fence' },
    { faction: 'Paramilitary', side: 'south', kind: 'wander' },
    { faction: 'ICE', side: 'north', kind: 'normal' },
    { faction: 'Border Patrol', side: 'north', kind: 'building' },
    { faction: 'ICE', side: 'north', kind: 'edge' },
    { faction: 'Border Patrol', side: 'north', kind: 'fence' },
    { faction: 'ICE', side: 'north', kind: 'wander' },
  ];
  const used = new Set<string>();
  s.enemies = spawns.map((a, id) => {
    const all = points(a.side),
      shift = Math.floor(random() * all.length);
    let route =
      a.kind === 'wander'
        ? [...all.slice(shift), ...all.slice(0, shift)]
        : a.kind === 'fence'
          ? [
              { x: 2.5, y: a.side === 'north' ? 22.5 : 24.5 },
              { x: 61.5, y: a.side === 'north' ? 22.5 : 24.5 },
            ]
          : a.kind === 'edge'
            ? [
                { x: 61.5, y: a.side === 'north' ? 2.5 : 25.5 },
                { x: 61.5, y: a.side === 'north' ? 21.5 : 45.5 },
              ]
            : [all[(shift + id) % all.length], all[(shift + id + 1) % all.length]];
    if (a.kind === 'building') {
      const available = buildings.filter((b) =>
        a.side === 'north' ? b.y < BORDER_Y : b.y > BORDER_Y,
      );
      const b = available[Math.floor(random() * available.length)];
      route = [
        { x: b.x - 0.5, y: b.y - 0.5 },
        { x: b.x + b.w + 0.5, y: b.y - 0.5 },
        { x: b.x + b.w + 0.5, y: b.y + b.h + 0.5 },
        { x: b.x - 0.5, y: b.y + b.h + 0.5 },
      ];
    }
    route = route.filter((p) => !overlapsWall(s, p.x, p.y));
    for (
      let attempt = 0;
      attempt < route.length && used.has(key(route[0].x, route[0].y));
      attempt++
    )
      route.push(route.shift()!);
    if (used.has(key(route[0].x, route[0].y))) {
      const free = all.find((p) => !used.has(key(p.x, p.y)));
      if (free) route.unshift(free);
    }
    const spawn = route[0];
    used.add(key(spawn.x, spawn.y));
    return {
      id,
      ...spawn,
      faction: a.faction,
      group: a.group,
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
      patrol: { kind: a.kind, points: route, index: 1 % route.length, side: a.side },
    };
  });
  s.message = 'Find or build a crossing. The Asylum Office is north of the border.';
}
export function solid(s: State, x: number, y: number) {
  return x < 1 || y < 1 || x >= MAP_WIDTH - 1 || y >= MAP_HEIGHT - 1 || s.walls.has(key(x, y));
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
  side?: 'north' | 'south',
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
      if ((side === 'north' && y + dy >= BORDER_Y) || (side === 'south' && y + dy <= BORDER_Y))
        continue;
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
  if (x - radius < 1 || y - radius < 1 || x + radius > MAP_WIDTH - 1 || y + radius > MAP_HEIGHT - 1)
    return true;
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
/** Two equal simulation-time phases; pause therefore freezes lighting. */
export function isNight(s: Pick<State, 'time'>): boolean {
  return Math.floor(s.time / 60) % 2 === 1;
}
export function secondsToLightChange(s: Pick<State, 'time'>): number {
  return 60 - (s.time % 60);
}
export function combatHostile(s: Pick<State, 'time'>, a: Faction, b: Faction): boolean {
  return isNight(s) || hostile(a, b);
}
export function sees(s: State, e: Actor, target: { x: number; y: number }): boolean {
  if (target === s && s.tunnelTransit) return false;
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
  if (id === 'player') return s.tunnelTransit ? null : s;
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
    if (!s.tunnelTransit && s.grace <= 0) s.health = Math.max(0, s.health - amount);
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
  tunnelStep(s, dt);
  s.grace = Math.max(0, s.grace - dt);
  s.moving = false;
  const length = s.tunnelTransit ? 0 : Math.hypot(input.x, input.y);
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
    // Revalidate on every frame, particularly the first daylight frame.
    const existingRival =
      typeof e.target === 'number' ? s.enemies.find((a) => a.id === e.target) : null;
    if (existingRival && !combatHostile(s, e.faction, existingRival.faction)) clearTarget(e);
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
                other.id !== e.id &&
                other.state !== 'dead' &&
                combatHostile(s, e.faction, other.faction),
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
      destination = e.patrol
        ? e.patrol.points[e.patrol.index]
        : { x: e.originX + e.way * 2, y: e.originY };
      if (
        Math.hypot(e.x - destination.x, e.y - destination.y) < 0.3 ||
        solid(s, destination.x, destination.y)
      ) {
        if (e.patrol) {
          e.patrol.index = (e.patrol.index + 1) % e.patrol.points.length;
          destination = e.patrol.points[e.patrol.index];
        } else {
          e.way *= -1;
          destination = { x: e.originX + e.way * 2, y: e.originY };
        }
      }
    }
    if (e.meter === 0 && e.state === 'patrol') {
      const side = e.y < BORDER_Y ? 'north' : 'south';
      const open = s.barriers
        .filter((b) => b.open && Math.hypot(e.x - b.x - 0.5, e.y - b.y - 0.5) < 4)
        .sort(
          (a, b) =>
            Math.hypot(e.x - a.x - 0.5, e.y - a.y - 0.5) -
            Math.hypot(e.x - b.x - 0.5, e.y - b.y - 0.5),
        )[0];
      if (open) destination = { x: open.x + 0.5, y: BORDER_Y + (side === 'north' ? -0.5 : 1.5) };
      for (const t of s.tunnels.filter((t) => t.open)) {
        const p = side === 'north' ? t.exit : t.entrance;
        const assigned = s.enemies
          .filter(
            (a) =>
              a.state !== 'dead' &&
              (side === 'north' ? a.y < BORDER_Y : a.y > BORDER_Y + 1) &&
              Math.hypot(a.x - p.x, a.y - p.y) < 12,
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y) || a.id - b.id,
          )
          .slice(0, 2);
        const index = assigned.indexOf(e);
        if (index >= 0) destination = { x: p.x + (index === 0 ? -0.6 : 0.6), y: p.y };
      }
    }
    if (e.meter > 0 && target && Math.hypot(target.x - e.x, target.y - e.y) < 1.4) {
      e.heading = Math.atan2(target.y - e.y, target.x - e.x);
      destination = null;
    }
    if (destination) {
      const side =
        e.state === 'patrol' &&
        e.patrol &&
        (e.patrol.side === 'north' ? e.y < BORDER_Y : e.y > BORDER_Y + 1)
          ? e.patrol.side
          : undefined;
      const targetKey = `${side ?? 'free'}:${key(destination.x, destination.y)}`;
      if (
        !e.navigation ||
        e.navigation.target !== targetKey ||
        e.navigation.wallCount !== s.walls.size
      ) {
        e.navigation = {
          target: targetKey,
          wallCount: s.walls.size,
          cells: path(s, e, destination, side),
        };
      }
      while (
        e.navigation.cells.length &&
        Math.hypot(e.navigation.cells[0].x - e.x, e.navigation.cells[0].y - e.y) < 0.08
      )
        e.navigation.cells.shift();
      const next =
        e.navigation.cells[0] ??
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
      if (rival && combatHostile(s, shot.from.faction, rival.faction)) {
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
      if (combatHostile(s, a.faction, b.faction)) {
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
    !s.tunnelTransit &&
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
  s.tunnelPlacement = null;
}
export function beginBreach(s: State) {
  if (s.phase !== 'running') return false;
  if (s.construction) {
    cancelBreach(s);
    return false;
  }
  const b = nearestBarrier(s);
  if (!b) return false;
  if (b.material === 'concrete') return beginTunnelPlacement(s);
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
/** Remove an occupied ladder without embedding its users in the restored fence. */
function knockLadder(s: State, b: Barrier) {
  const actors = [s, ...s.enemies.filter((e) => e.state !== 'dead')];
  const occupants = actors.filter(
    (a) =>
      Math.hypot(
        a.x - Math.max(b.x, Math.min(a.x, b.x + 1)),
        a.y - Math.max(b.y, Math.min(a.y, b.y + 1)),
      ) < 0.22,
  );
  const placements: { actor: (typeof actors)[number]; x: number; y: number }[] = [];
  for (const actor of occupants) {
    const preferred = actor.y < b.y + 0.5 ? 'north' : 'south';
    const candidates: { x: number; y: number; side: string }[] = [];
    for (let y = Math.max(1, b.y - 3); y <= Math.min(MAP_HEIGHT - 2, b.y + 3); y++)
      for (let x = Math.max(1, b.x - 3); x <= Math.min(MAP_WIDTH - 2, b.x + 3); x++) {
        if (y === b.y) continue;
        const p = { x: x + 0.5, y: y + 0.5, side: y < b.y ? 'north' : 'south' };
        if (overlapsWall(s, p.x, p.y) || !sight(s, actor.x, actor.y, p.x, p.y)) continue;
        if (
          actors.some(
            (a) => a !== actor && !occupants.includes(a) && Math.hypot(a.x - p.x, a.y - p.y) < 0.65,
          ) ||
          placements.some((a) => Math.hypot(a.x - p.x, a.y - p.y) < 0.65)
        )
          continue;
        candidates.push(p);
      }
    candidates.sort(
      (a, c) =>
        Number(a.side !== preferred) - Number(c.side !== preferred) ||
        Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(c.x - actor.x, c.y - actor.y),
    );
    if (!candidates.length) return false;
    placements.push({ actor, ...candidates[0] });
  }
  for (const p of placements) {
    p.actor.x = p.x;
    p.actor.y = p.y;
    p.actor.moving = false;
  }
  b.open = false;
  b.progress = 0;
  b.remaining = 0;
  s.walls.add(key(b.x, b.y));
  s.message = 'A guard knocked down the ladder. Everyone on it stepped clear.';
  return true;
}
function barrierStep(s: State, dt: number) {
  for (const b of s.barriers) {
    const guards = s.enemies.filter(
      (e) => e.state !== 'dead' && Math.hypot(e.x - b.x - 0.5, e.y - b.y - 0.5) < 1.8,
    );
    if (b.open && guards.length) {
      b.repairProgress += dt;
      if (b.material === 'fence') {
        b.remaining = 0;
        knockLadder(s, b);
      }
      if (b.material === 'wire' && b.repairProgress >= 30) {
        if (
          ![s, ...s.enemies.filter((e) => e.state !== 'dead')].some(
            (a) => Math.abs(a.x - b.x - 0.5) < 0.72 && Math.abs(a.y - b.y - 0.5) < 0.72,
          )
        ) {
          b.open = false;
          b.progress = 0;
          s.walls.add(key(b.x, b.y));
        }
      }
    } else b.repairProgress = 0;
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
  if (s.construction.tunnelId !== undefined) {
    const t = s.tunnels.find((t) => t.id === s.construction!.tunnelId)!;
    if (Math.hypot(s.x - t.entrance.x, s.y - t.entrance.y) > 1.6) {
      cancelBreach(s);
      return;
    }
    s.construction.progress = Math.min(1, s.construction.progress + dt / 10);
    if (s.construction.progress >= 1 - 1e-9) {
      t.open = true;
      s.construction = null;
      s.message = 'Tunnel ready. Step onto either entrance to cross.';
    }
    return;
  }
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

export function tunnelCandidates(s: State, side: 'north' | 'south') {
  return s.barriers
    .filter((b) => b.material === 'concrete')
    .map((b) => ({ x: b.x + 0.5, y: BORDER_Y + (side === 'south' ? 1.5 : -0.5) }))
    .filter(
      (p) =>
        !overlapsWall(s, p.x, p.y) &&
        (!s.tunnelPlacement?.entrance ||
          side === 'south' ||
          Math.abs(p.x - s.tunnelPlacement.entrance.x) <= 6),
    );
}
export function validTunnelEndpoint(s: State, x: number, y: number, side: 'north' | 'south') {
  return tunnelCandidates(s, side).some((p) => Math.hypot(p.x - x, p.y - y) < 0.55);
}
export function beginTunnelPlacement(s: State) {
  if (s.phase !== 'running') return false;
  cancelBreach(s);
  s.tunnelPlacement = { entrance: null };
  s.message = 'Choose a concrete tunnel entrance on the south face, then its north exit.';
  return true;
}
export function cancelTunnelPlacement(s: State) {
  s.tunnelPlacement = null;
}
export function chooseTunnelEndpoint(s: State, x: number, y: number) {
  if (s.phase !== 'running' || !s.tunnelPlacement) return false;
  const side = s.tunnelPlacement.entrance ? 'north' : 'south';
  const p = tunnelCandidates(s, side).find((p) => Math.hypot(p.x - x, p.y - y) < 0.55);
  if (!p) return false;
  if (!s.tunnelPlacement.entrance) {
    if (Math.hypot(s.x - p.x, s.y - p.y) > 1.6) return false;
    s.tunnelPlacement.entrance = p;
    s.message = 'Choose the north exit within six tiles.';
    return true;
  }
  const entrance = s.tunnelPlacement.entrance;
  if (Math.hypot(s.x - entrance.x, s.y - entrance.y) > 1.6) return false;
  const id = s.tunnels.length;
  s.tunnels.push({ id, entrance, exit: p, open: false, repairProgress: 0 });
  s.construction = { x: Math.floor(entrance.x), y: BORDER_Y, progress: 0, tunnelId: id };
  s.tunnelPlacement = null;
  s.message = 'Digging the selected tunnel. Stay still for ten seconds.';
  return true;
}
function tunnelStep(s: State, dt: number) {
  if (s.tunnelTransit) {
    const transit = s.tunnelTransit;
    transit.remaining = Math.max(0, transit.remaining - dt);
    if (
      transit.remaining === 0 &&
      !overlapsWall(s, transit.to.x, transit.to.y) &&
      !s.enemies.some(
        (e) => e.state !== 'dead' && Math.hypot(e.x - transit.to.x, e.y - transit.to.y) < 0.5,
      )
    ) {
      s.x = transit.to.x;
      s.y = transit.to.y;
      s.tunnelArrival = { ...transit.to };
      s.tunnelCooldown = 2;
      s.tunnelTransit = null;
      s.grace = Math.max(s.grace, 0.5);
      s.message = 'Tunnel crossed. Continue toward the office.';
    }
  }
  s.tunnelCooldown = Math.max(0, s.tunnelCooldown - dt);
  if (s.tunnelArrival && Math.hypot(s.x - s.tunnelArrival.x, s.y - s.tunnelArrival.y) > 0.5)
    s.tunnelArrival = null;
  for (const t of s.tunnels) {
    if (!t.open) continue;
    const near = (p: { x: number; y: number }, side: 'north' | 'south') =>
      s.enemies.filter(
        (e) =>
          e.state !== 'dead' &&
          (side === 'north' ? e.y < BORDER_Y : e.y > BORDER_Y + 1) &&
          Math.hypot(e.x - p.x, e.y - p.y) < 2,
      ).length;
    if (s.tunnelTransit?.id === t.id) {
      t.repairProgress = 0;
      continue;
    }
    if (near(t.entrance, 'south') >= 2 && near(t.exit, 'north') >= 2) t.repairProgress += dt;
    else t.repairProgress = 0;
    if (t.repairProgress >= 90) {
      t.open = false;
      continue;
    }
    if (s.tunnelCooldown > 0 || s.tunnelArrival || s.tunnelTransit) continue;
    const destination =
      Math.hypot(s.x - t.entrance.x, s.y - t.entrance.y) < 0.3
        ? t.exit
        : Math.hypot(s.x - t.exit.x, s.y - t.exit.y) < 0.3
          ? t.entrance
          : null;
    if (
      destination &&
      !overlapsWall(s, destination.x, destination.y) &&
      !s.enemies.some(
        (e) => e.state !== 'dead' && Math.hypot(e.x - destination.x, e.y - destination.y) < 0.5,
      )
    ) {
      const duration = Math.hypot(destination.x - s.x, destination.y - s.y) / (s.config.walk * 0.4);
      s.tunnelTransit = {
        id: t.id,
        from: { x: s.x, y: s.y },
        to: { ...destination },
        duration,
        remaining: duration,
      };
      s.message = 'Moving underground. The exit will wait until clear.';
    }
  }
}
