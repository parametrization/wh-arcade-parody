import { cameras, getTerrain, terrainBlocked, type CameraDefinition } from './terrain';
import { defaults, type Config } from './config';
export interface Cell {
  x: number;
  y: number;
}
export type Direction = 'up' | 'right' | 'down' | 'left';
export interface Hazard {
  id: number;
  kind: 'float' | 'banner';
  cells: Cell[];
  phase: 'warning' | 'active';
  remaining: number;
}
export interface Model {
  cameraAlerts: number[];
  cameraEnabled: boolean;
  waiting: boolean;
  seed: number;
  rng: number;
  district: number;
  body: Cell[];
  direction: Direction;
  queue: Direction[];
  phase: 'ready' | 'playing' | 'delivering' | 'district-complete' | 'jam' | 'won';
  aboard: number;
  banked: number;
  supplies: number;
  charges: number;
  score: number;
  rescued: number;
  pickup: Cell | null;
  supply: Cell | null;
  suppliesSpawned: number;
  dockOpen: boolean;
  time: number;
  acc: number;
  slow: number;
  delivery: number;
  safe: number;
  hazard: Hazard | null;
  nextHazard: number;
  nextFloat: number;
  nextBanner: number;
  monotonic: number;
  lastRewind: number;
  history: string[];
  checkpoint: string;
  message: string;
  config: Config;
}
export const WIDTH = 24,
  HEIGHT = 18,
  GOALS = [6, 10, 14];
export const dock: Cell = { x: 1, y: 8 };
const delta: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};
export const equal = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const key = (c: Cell) => `${c.x},${c.y}`;
export function walls(district: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) if (terrainBlocked(district, x, y)) cells.push({ x, y });
  return cells;
}
function random(m: Model) {
  m.rng = (m.rng + 0x6d2b79f5) >>> 0;
  let t = m.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function blocked(m: Model, c: Cell, reservations = true) {
  return (
    terrainBlocked(m.district, c.x, c.y) ||
    (m.hazard !== null &&
      (reservations || m.hazard.phase === 'active') &&
      m.hazard.cells.some((h) => equal(h, c)))
  );
}
export function reachable(m: Model, extra: Cell[] = []): Cell[] {
  const occupied = new Set([...m.body.slice(1, -1), ...extra].map(key));
  const seen = new Set<string>();
  const out: Cell[] = [];
  const queue = [m.body[0]];
  while (queue.length) {
    const c = queue.shift()!;
    if (seen.has(key(c)) || occupied.has(key(c)) || blocked(m, c)) continue;
    seen.add(key(c));
    out.push(c);
    for (const d of Object.values(delta)) {
      const n = { x: c.x + d.x, y: c.y + d.y };
      if (n.x >= 0 && n.y >= 0 && n.x < WIDTH && n.y < HEIGHT) queue.push(n);
    }
  }
  return out;
}
function place(m: Model): Cell | null {
  const legal = reachable(m).filter(
    (c) =>
      !m.body.some((b) => equal(b, c)) &&
      !equal(c, dock) &&
      (!m.pickup || !equal(c, m.pickup)) &&
      (!m.supply || !equal(c, m.supply)),
  );
  return legal.length ? legal[Math.floor(random(m) * legal.length)] : null;
}
export function spawn(m: Model) {
  const remaining = GOALS[m.district] - m.banked - m.aboard;
  if (!m.pickup && remaining > 0 && m.aboard < Number(m.config['convoy.maxRescued']))
    m.pickup = place(m);
  if (
    m.aboard >= Number(m.config['dock.openAt']) ||
    remaining === 0 ||
    (!m.pickup && m.aboard > 0) ||
    reachable(m).length < (WIDTH - 2) * (HEIGHT - 2) * 0.25
  )
    m.dockOpen = true;
  if (!m.supply && m.suppliesSpawned < 2 && m.rescued >= (m.suppliesSpawned === 0 ? 2 : 5)) {
    m.supply = place(m);
    if (m.supply) m.suppliesSpawned++;
  }
}
const departure = (): Cell[] => [
  { x: 4, y: 8 },
  { x: 3, y: 8 },
  { x: 2, y: 8 },
];
function snapshot(m: Model) {
  const { history: _h, checkpoint: _c, config: _config, ...data } = m;
  return JSON.stringify(data);
}
function restore(m: Model, s: string) {
  const config = m.config,
    monotonic = m.monotonic,
    lastRewind = m.lastRewind,
    checkpoint = m.checkpoint;
  Object.assign(m, JSON.parse(s), { config, monotonic, lastRewind, checkpoint, history: [] });
}
function checkpoint(m: Model) {
  m.checkpoint = snapshot(m);
}
export function createModel(seed = 1, config = defaults()): Model {
  const m: Model = {
    cameraAlerts: [0, 0, 0],
    cameraEnabled: true,
    waiting: false,
    seed: seed >>> 0,
    rng: seed >>> 0,
    district: 0,
    body: departure(),
    direction: 'right',
    queue: [],
    phase: 'ready',
    aboard: 0,
    banked: 0,
    supplies: 0,
    charges: 0,
    score: 0,
    rescued: 0,
    pickup: null,
    supply: null,
    suppliesSpawned: 0,
    dockOpen: false,
    time: 0,
    acc: 0,
    slow: 0,
    delivery: 0,
    safe: 0.6,
    hazard: null,
    nextHazard: 20,
    nextFloat: 20,
    nextBanner: 16,
    monotonic: 0,
    lastRewind: -Infinity,
    history: [],
    checkpoint: '',
    message: 'Guide the convoy. Pick up neighbors; return to the green welcome center.',
    config: { ...config },
  };
  spawn(m);
  checkpoint(m);
  return m;
}
export function queueTurn(m: Model, direction: Direction): boolean {
  const last = m.queue.at(-1) ?? m.direction;
  if (
    m.queue.length >= 2 ||
    last === direction ||
    (delta[last].x + delta[direction].x === 0 && delta[last].y + delta[direction].y === 0)
  )
    return false;
  m.queue.push(direction);
  return true;
}
export function share(m: Model): boolean {
  if (m.phase !== 'playing' || m.charges <= 0) return false;
  const previousInterval = interval(m);
  m.charges--;
  m.slow = Number(m.config['share.seconds']);
  m.acc = (m.acc / previousInterval) * interval(m);
  if (m.hazard?.kind === 'banner' && m.hazard.phase === 'active') {
    m.hazard = null;
    m.nextBanner = m.time + 16;
    m.nextHazard = Math.min(m.nextFloat, m.nextBanner);
  }
  m.message = 'Mutual aid! The group slows down; active red tape clears.';
  return true;
}
export function retry(m: Model) {
  restore(m, m.checkpoint);
  m.phase = 'ready';
  m.queue = [];
  m.acc = 0;
  m.message = 'Group checkpoint restored. Banked neighbors stay welcomed.';
}
function collide(m: Model) {
  if (m.safe > 0 && m.config.mode === 'story') {
    m.queue = [];
    m.message = 'Choose a new direction.';
    return;
  }
  if (m.config.mode === 'story' && m.monotonic - m.lastRewind >= 8) {
    const rewind = m.history.at(-5);
    if (rewind) restore(m, rewind);
    else restore(m, m.checkpoint);
    m.lastRewind = m.monotonic;
    m.safe = 1;
    m.queue = [];
    m.phase = 'ready';
    m.message = 'Rewound the route. Choose a direction and start again.';
  } else {
    m.phase = 'jam';
    m.message = 'Route jam! Retry this group; already welcomed people stay safe.';
  }
}
export function tick(m: Model) {
  if (m.phase !== 'playing') return;
  const before = snapshot(m);
  const direction = m.queue.shift() ?? m.direction;
  const d = delta[direction];
  const next = { x: m.body[0].x + d.x, y: m.body[0].y + d.y };
  const growth = !!m.pickup && equal(next, m.pickup);
  const body = growth ? m.body : m.body.slice(0, -1);
  if (blocked(m, next, false) || body.some((c) => equal(c, next))) {
    collide(m);
    return;
  }
  m.history.push(before);
  if (m.history.length > 6) m.history.shift();
  m.direction = direction;
  m.body.unshift(next);
  if (!growth) m.body.pop();
  if (growth) {
    m.pickup = null;
    m.aboard++;
    m.rescued++;
    m.message = 'A neighbor joins the convoy.';
  }
  if (m.supply && equal(next, m.supply)) {
    m.supply = null;
    m.supplies++;
    m.charges = Math.min(Number(m.config['share.capacity']), m.charges + 1);
    m.message = 'Supplies collected. Press Space to Share.';
  }
  if (m.dockOpen && equal(next, dock)) {
    m.score += m.aboard * 100 + m.supplies * 25;
    m.banked += m.aboard;
    m.aboard = 0;
    m.supplies = 0;
    m.pickup = null;
    m.supply = null;
    m.phase = 'delivering';
    m.delivery = 0.6;
    m.message = 'Welcome home! Everyone in this group is safe.';
    return;
  }
  spawn(m);
}
function hazardSafe(m: Model, cells: Cell[]): boolean {
  if (
    cells.some(
      (c) =>
        equal(c, dock) ||
        m.body.some((b) => equal(b, c)) ||
        (m.pickup && equal(c, m.pickup)) ||
        (m.supply && equal(c, m.supply)) ||
        terrainBlocked(m.district, c.x, c.y),
    )
  )
    return false;
  if (m.safe > 0 && cells.some((c) => departure().some((p) => equal(p, c)))) return false;
  return reachable(m, cells).some((c) => equal(c, dock));
}
function schedule(m: Model) {
  if (m.district === 0) return;
  const banner = m.district === 2 && m.rescued >= 2 && m.time >= m.nextBanner;
  if (!banner && m.time < m.nextFloat) return;
  const cells = banner
    ? [
        { x: 12, y: 6 },
        { x: 12, y: 7 },
        { x: 12, y: 8 },
      ]
    : Array.from({ length: 6 }, (_, i) => ({ x: 17 + (i % 3), y: 1 + Math.floor(i / 3) }));
  if (hazardSafe(m, cells))
    m.hazard = {
      id: Math.floor(m.time * 1000),
      kind: banner ? 'banner' : 'float',
      cells,
      phase: 'warning',
      remaining: Number(m.config['hazard.warningSeconds']),
    };
  else {
    if (banner) m.nextBanner = m.time + 3;
    else m.nextFloat = m.time + 3;
  }
  m.nextHazard = Math.min(
    m.nextFloat,
    m.district === 2 && m.rescued >= 2 ? m.nextBanner : Infinity,
  );
}
export function interval(m: Model) {
  return (
    (Math.max(
      Number(m.config['tick.minMs']),
      Number(m.config['tick.startMs']) - m.rescued * Number(m.config['tick.pickupDecreaseMs']),
    ) /
      1000 /
      Number(m.config['assist.speedMultiplier'])) *
    (m.slow > 0 ? 1.5 : 1) *
    (getTerrain(m.district, m.body[0].x, m.body[0].y) === 'climb' ? 1.8 : 1)
  );
}
export function advance(m: Model, dt: number, step = false) {
  if (m.phase === 'delivering') {
    m.delivery -= dt;
    if (m.delivery > 0) return;
    if (m.banked >= GOALS[m.district]) {
      m.score += 250;
      m.phase = m.district === 2 ? 'won' : 'district-complete';
      m.message =
        m.phase === 'won'
          ? 'ROOM FOR EVERYONE. Thirty neighbors welcomed.'
          : 'District complete. Continue to the next neighborhood.';
      return;
    }
    m.body = departure();
    m.direction = 'right';
    m.queue = [];
    m.acc = 0;
    m.dockOpen = false;
    m.safe = 0.6;
    m.hazard = null;
    m.nextFloat = m.time + 18 + random(m) * 6;
    m.nextBanner = m.time + 16;
    m.nextHazard = m.nextFloat;
    m.phase = 'playing';
    spawn(m);
    checkpoint(m);
    return;
  }
  if (m.phase !== 'playing' || (m.config.mode === 'single-step' && !step)) return;
  if (step) dt = interval(m);
  const previousInterval = interval(m);
  m.monotonic += dt;
  m.time += dt;
  m.safe = Math.max(0, m.safe - dt);
  m.slow = Math.max(0, m.slow - dt);
  if (previousInterval !== interval(m)) m.acc = (m.acc / previousInterval) * interval(m);
  if (m.hazard) {
    m.hazard.remaining -= dt;
    if (m.hazard.remaining <= 0) {
      const h = m.hazard;
      m.hazard = null;
      if (h.phase === 'warning' && hazardSafe(m, h.cells)) {
        h.phase = 'active';
        h.remaining = Number(
          m.config[h.kind === 'float' ? 'hazard.floatSeconds' : 'hazard.bannerSeconds'],
        );
        m.hazard = h;
      } else {
        const delay = h.phase === 'warning' ? 3 : h.kind === 'float' ? 18 + random(m) * 6 : 16;
        if (h.kind === 'float') m.nextFloat = m.time + delay;
        else m.nextBanner = m.time + delay;
        m.nextHazard = Math.min(
          m.nextFloat,
          m.district === 2 && m.rescued >= 2 ? m.nextBanner : Infinity,
        );
      }
    }
  } else schedule(m);
  updateCameras(m, dt);
  if (m.phase !== 'playing' || m.waiting) return;
  m.acc += dt;
  while (m.acc >= interval(m) && m.phase === 'playing') {
    m.acc -= interval(m);
    tick(m);
    if (step) break;
  }
}
export function nextDistrict(m: Model) {
  if (m.phase !== 'district-complete') return;
  const score = m.score,
    charges = m.charges,
    monotonic = m.monotonic,
    district = m.district + 1;
  Object.assign(m, createModel(m.seed + district, m.config), {
    district,
    score,
    charges,
    monotonic,
    pickup: null,
    supply: null,
  });
  spawn(m);
  checkpoint(m);
}

export interface CameraView extends CameraDefinition {
  district: number;
  alert: number;
}
export function getCameraViews(m: Model): CameraView[] {
  if (!m.cameraEnabled) return [];
  return cameras(m.district).map((camera) => ({
    ...camera,
    district: m.district,
    heading: camera.heading + Math.sin((m.time * Math.PI * 2) / camera.period + camera.id) * 0.9,
    alert: m.cameraAlerts[camera.id] ?? 0,
  }));
}
export function cameraSees(camera: CameraView, cell: Cell) {
  const dx = cell.x - camera.x,
    dy = cell.y - camera.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) - camera.heading;
  const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (distance > camera.range || Math.abs(wrapped) > camera.halfAngle) return false;
  // Sample at a quarter-cell spacing so narrow fence cells cannot be skipped.
  const steps = Math.ceil(distance * 4);
  for (let i = 1; i < steps; i++) {
    const x = Math.round(camera.x + (dx * i) / steps);
    const y = Math.round(camera.y + (dy * i) / steps);
    if (x === camera.x && y === camera.y) continue;
    const terrain = getTerrain(camera.district, x, y);
    if (terrain === 'wall' || terrain === 'fence') return false;
  }
  return true;
}
export function setWaiting(m: Model, waiting: boolean) {
  m.waiting = waiting;
}
function updateCameras(m: Model, dt: number) {
  for (const camera of getCameraViews(m)) {
    const visible = m.safe <= 0 && cameraSees(camera, m.body[0]);
    m.cameraAlerts[camera.id] = Math.max(0, Math.min(1, camera.alert + (visible ? dt / 1.5 : -dt)));
    if (m.cameraAlerts[camera.id] >= 1) {
      collide(m);
      m.cameraAlerts = [0, 0, 0];
      m.safe = 1;
      m.waiting = false;
      m.message =
        m.phase === 'jam'
          ? 'Camera alert! Retry the group and use a different crossing.'
          : 'Camera alert. The route rewound; wait for the scan to pass.';
      return;
    }
  }
}
