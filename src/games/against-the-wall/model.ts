export type Faction = 'Cartel' | 'Paramilitary' | 'Border Patrol' | 'ICE';
export type Phase = 'title' | 'running' | 'paused' | 'checkpoint' | 'district' | 'won';
export interface Actor {
  x: number;
  y: number;
  id: number;
  faction: Faction;
  meter: number;
  state: 'patrol' | 'chase' | 'investigate' | 'clash' | 'recover';
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
  phase: Phase;
  time: number;
  district: number;
  seed: number;
  x: number;
  y: number;
  stamina: number;
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
    phase: 'title',
    time: 0,
    district: 1,
    seed,
    x: 3.5,
    y: 18.5,
    stamina: 100,
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
  s.tokens = 2;
  s.grace = 0.75;
  s.beacon = null;
  s.localSupplies = 0;
  s.walls = new Set();
  for (let x = 0; x < 32; x++) {
    s.walls.add(key(x, 0));
    s.walls.add(key(x, 23));
  }
  for (let y = 0; y < 24; y++) {
    s.walls.add(key(0, y));
    s.walls.add(key(31, y));
  }
  for (const [x, y, w, h] of [
    [8, 4, 2, 11],
    [15, 10, 2, 10],
    [22, 4, 2, 10],
    [3, 11, 3, 2],
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
            [26, 10, 2, 2],
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
  const factions: Faction[] =
    s.district === 1
      ? ['Cartel', 'Cartel']
      : s.district === 2
        ? ['Paramilitary', 'Border Patrol', 'Cartel']
        : ['ICE', 'Border Patrol', 'Paramilitary', 'Cartel'];
  s.enemies = factions.map((f, i) => ({
    id: i,
    x: 12.5 + i * 4,
    y: 5.5 + i * 2,
    faction: f,
    meter: 0,
    state: 'patrol',
    timer: 0,
    cooldown: 0,
    originX: 12.5 + i * 4,
    originY: 5.5 + i * 2,
    way: 1,
    arrival: -1,
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
  const d = Math.hypot(bx - ax, by - ay);
  for (let i = 1; i <= Math.ceil(d * 8); i++) {
    const t = i / Math.ceil(d * 8);
    if (solid(s, ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
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
export function move(s: State, who: { x: number; y: number }, dx: number, dy: number, r = 0.22) {
  if (!solid(s, who.x + dx + r, who.y) && !solid(s, who.x + dx - r, who.y)) who.x += dx;
  if (!solid(s, who.x, who.y + dy + r) && !solid(s, who.x, who.y + dy - r)) who.y += dy;
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
export function distract(s: State, x: number, y: number) {
  if (
    s.phase !== 'running' ||
    s.tokens <= 0 ||
    solid(s, x, y) ||
    Math.hypot(x - s.x, y - s.y) > 4.01
  )
    return false;
  s.tokens--;
  s.beacon = { x, y, time: 4 };
  for (const e of s.enemies) {
    e.arrival = -1;
    if (
      e.cooldown <= 0 &&
      Math.hypot(x - e.x, y - e.y) < 8 &&
      !['clash', 'recover'].includes(e.state)
    )
      e.state = 'investigate';
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
  s.grace = Math.max(0, s.grace - dt);
  const length = Math.hypot(input.x, input.y);
  const run = input.sprint && s.stamina > 0;
  if (length) {
    const v = (run ? s.config.run : s.config.walk) * dt;
    move(s, s, (input.x / length) * v, (input.y / length) * v);
  }
  s.stamina = Math.max(
    0,
    Math.min(100, s.stamina + (run && length && !s.config.story ? -20 : 15) * dt),
  );
  for (const item of s.items)
    if (!item.taken && item.type !== 'supply' && Math.hypot(s.x - item.x, s.y - item.y) < 0.7) {
      item.taken = true;
      if (item.type === 'water') s.stamina = Math.min(100, s.stamina + 30);
      else s.tokens = Math.min(2, s.tokens + 1);
    }
  if (s.beacon) {
    s.beacon.time -= dt;
    if (s.beacon.time <= 0) s.beacon = null;
  }
  for (const e of s.enemies) {
    e.cooldown = Math.max(0, e.cooldown - dt);
    if (e.state === 'clash' || e.state === 'recover') {
      e.timer -= dt;
      if (e.timer <= 0) {
        if (e.state === 'clash') {
          e.state = 'recover';
          e.timer = 2;
        } else {
          e.state = 'patrol';
          e.cooldown = 10;
          e.meter = 0;
        }
      }
      continue;
    }
    const dist = Math.hypot(s.x - e.x, s.y - e.y),
      dx = s.x - e.x,
      dy = s.y - e.y;
    const facing = e.way >= 0 ? 0 : Math.PI;
    const angle = Math.atan2(dy, dx);
    const cone =
      Math.abs(Math.atan2(Math.sin(angle - facing), Math.cos(angle - facing))) <=
      (35 * Math.PI) / 180;
    const visible = dist < s.config.vision && cone && sight(s, e.x, e.y, s.x, s.y);
    e.meter = Math.max(
      0,
      Math.min(1, e.meter + dt * (visible ? 1 / s.config.detection : -1 / 1.2)),
    );
    if (e.meter >= 1) e.state = 'chase';
    if (e.state === 'chase' && e.meter <= 0) e.state = 'patrol';
    let target: { x: number; y: number } | null = null,
      speed = 2.2;
    if (e.state === 'investigate' && s.beacon) {
      target = s.beacon;
      speed = 2.6;
      if (Math.hypot(e.x - target.x, e.y - target.y) < 0.6 && e.arrival < 0) e.arrival = s.time;
    } else if (e.state === 'chase') {
      target = { x: s.x, y: s.y };
      speed = 3.2;
    } else {
      if (e.state === 'investigate') e.state = 'patrol';
      target = { x: e.originX + e.way * 2, y: e.originY };
      if (Math.hypot(e.x - target.x, e.y - target.y) < 0.3) e.way *= -1;
    }
    if (target) {
      if (e.state === 'patrol' && solid(s, target.x, target.y)) {
        e.way *= -1;
        target = { x: e.originX + e.way * 2, y: e.originY };
      }
      const next =
        path(s, e, target)[0] ??
        (!solid(s, target.x, target.y) && key(e.x, e.y) === key(target.x, target.y)
          ? target
          : null);
      if (next) {
        const d = Math.hypot(next.x - e.x, next.y - e.y);
        if (d > 0.03)
          move(
            s,
            e,
            ((next.x - e.x) / d) * Math.min(d, speed * dt),
            ((next.y - e.y) / d) * Math.min(d, speed * dt),
          );
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
      a.state = b.state = 'clash';
      a.timer = b.timer = a.faction === b.faction ? 2 : s.config.story ? 8 : s.config.clash;
      s.message =
        a.faction === b.faction
          ? 'The pursuers argue over whose turn it is.'
          : 'Wrong department! Rival pursuers are occupied.';
    }
  }
  if (
    s.grace <= 0 &&
    s.enemies.some(
      (e) => !['clash', 'recover'].includes(e.state) && Math.hypot(e.x - s.x, e.y - s.y) < 0.55,
    )
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
  const occupied = [s, ...s.enemies].some((a) => key(a.x, a.y) === key(g.x, g.y));
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
