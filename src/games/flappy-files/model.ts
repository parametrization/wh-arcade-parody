import { defaults, value, type Config } from './config';
export type Phase = 'title' | 'running' | 'falling' | 'paused' | 'chapter' | 'lost' | 'won';
export type EventPhase = 'idle' | 'telegraph' | 'entering' | 'obscuring' | 'exiting' | 'cooldown';
export interface Column {
  id: number;
  x: number;
  gapY: number;
  gap: number;
  passed: boolean;
  burger: boolean;
  collected: boolean;
  name: string;
  topName: string;
}
export interface Model {
  phase: Phase;
  resumePhase: Phase;
  mode: 'story' | 'endless';
  seed: number;
  rng: number;
  time: number;
  phaseTime: number;
  y: number;
  vy: number;
  columns: Column[];
  clearances: number;
  deliveries: number;
  burgers: number;
  chapter: number;
  nextId: number;
  nextBurger: number;
  event: {
    phase: EventPhase;
    remaining: number;
    side: 'left' | 'right';
    nextSide: 'left' | 'right';
    cause: 'burger' | 'timeout';
    count: number;
  };
  effects: string[];
  config: Config;
}
export const CAST = [
  'Donald Trump',
  'JD Vance',
  'Mike Johnson',
  'John Thune',
  'Scott Bessent',
  'Todd Blanche',
  'Doug Burgum',
];
export function random(m: Model) {
  m.rng = (Math.imul(m.rng, 1664525) + 1013904223) >>> 0;
  return m.rng / 4294967296;
}
export function create(
  seed = 1,
  config: Config = { ...defaults },
  mode: Model['mode'] = 'story',
): Model {
  return {
    phase: 'title',
    resumePhase: 'running',
    mode,
    seed: seed >>> 0,
    rng: seed >>> 0,
    time: 0,
    phaseTime: 0,
    y: 170,
    vy: 0,
    columns: [],
    clearances: 0,
    deliveries: 0,
    burgers: 0,
    chapter: 1,
    nextId: 1,
    nextBurger: value(config, 'burger.firstPair'),
    event: {
      phase: 'idle',
      remaining: 0,
      side: 'left',
      nextSide: 'left',
      cause: 'timeout',
      count: 0,
    },
    effects: [],
    config: { ...config },
  };
}
export function flap(m: Model) {
  if (m.phase === 'title') {
    m.phase = 'running';
    m.effects.push('start');
  }
  if (m.phase === 'running') {
    m.vy = value(m.config, 'physics.flapVelocity');
    m.effects.push('flap');
  }
}
export function pause(m: Model) {
  if (['running', 'falling'].includes(m.phase)) {
    m.resumePhase = m.phase;
    m.phase = 'paused';
  }
}
export function resume(m: Model) {
  if (m.phase === 'paused') m.phase = m.resumePhase;
}
export function cooldown(m: Model) {
  m.event.phase = 'cooldown';
  m.event.remaining =
    value(m.config, 'distraction.cooldownMin') +
    random(m) *
      (value(m.config, 'distraction.cooldownMax') - value(m.config, 'distraction.cooldownMin'));
}
export function burger(m: Model) {
  if (m.phase !== 'running') return false;
  if (!['entering', 'obscuring'].includes(m.event.phase)) {
    m.effects.push('save-burger');
    return false;
  }
  if (m.burgers === 0) {
    m.effects.push('empty');
    return false;
  }
  m.burgers--;
  m.event.phase = 'exiting';
  m.event.remaining = 0.25;
  m.event.cause = 'burger';
  m.effects.push('burger');
  return true;
}
export function eventStep(m: Model, dt: number) {
  const e = m.event;
  if (e.phase === 'idle') {
    if (
      m.clearances >= value(m.config, 'distraction.firstClearance') &&
      m.nextId > value(m.config, 'burger.firstPair')
    )
      begin();
    return;
  }
  e.remaining -= dt;
  if (e.remaining > 1e-9) return;
  if (e.phase === 'telegraph') {
    e.phase = 'entering';
    e.remaining = 0.5;
  } else if (e.phase === 'entering') {
    e.phase = 'obscuring';
    e.remaining = 7;
  } else if (e.phase === 'obscuring') {
    e.phase = 'exiting';
    e.remaining = 0.25;
    e.cause = 'timeout';
  } else if (e.phase === 'exiting') cooldown(m);
  else if (e.phase === 'cooldown') begin();
  function begin() {
    e.phase = 'telegraph';
    e.remaining = 0.8;
    e.side = e.nextSide;
    e.nextSide = e.side === 'left' ? 'right' : 'left';
    e.count++;
    m.effects.push('distraction');
  }
}
export function nextChapter(m: Model) {
  if (m.phase !== 'chapter') return;
  m.chapter++;
  m.phase = 'running';
  m.y = 170;
  m.vy = 0;
  m.columns = [];
  cooldown(m);
}
export function speed(m: Model) {
  return (
    (value(m.config, 'scroll.start') +
      (value(m.config, 'scroll.max') - value(m.config, 'scroll.start')) *
        Math.min(1, m.clearances / value(m.config, 'difficulty.capClearances'))) *
    (m.config['assist.enabled'] ? 0.8 : 1)
  );
}
export function spawn(m: Model, x: number) {
  const c = m.config,
    t = Math.min(1, m.clearances / value(c, 'difficulty.capClearances'));
  const gap =
    value(c, 'columns.gapStart') +
    (value(c, 'columns.gapMin') - value(c, 'columns.gapStart')) * t +
    (c['assist.enabled'] ? 24 : 0);
  const prior = m.columns.at(-1);
  const center = prior ? prior.gapY + prior.gap / 2 : 194;
  const delta = Math.min(value(c, 'columns.maxCenterDelta'), 48);
  let next = Math.max(48 + gap / 2, Math.min(350 - gap / 2, center + (random(m) * 2 - 1) * delta));
  if (!gapReachable(center, next, gap, value(c, 'columns.spacing') / speed(m), c)) next = center;
  const id = m.nextId++;
  const hasBurger = id === m.nextBurger;
  if (hasBurger)
    m.nextBurger += Math.floor(
      value(c, 'burger.intervalMin') +
        random(m) * (value(c, 'burger.intervalMax') - value(c, 'burger.intervalMin') + 1),
    );
  m.columns.push({
    id,
    x,
    gapY: next - gap / 2,
    gap,
    passed: false,
    burger: hasBurger,
    collected: false,
    name: CAST[(id - 1) % CAST.length],
    topName: CAST[id % CAST.length],
  });
}
function crash(m: Model, ground = false) {
  m.phase = ground ? 'lost' : 'falling';
  m.phaseTime = 0;
  m.vy = -140;
  m.event.phase = 'idle';
  m.effects.push('crash');
}
export function step(m: Model, dt: number) {
  if (!['running', 'falling'].includes(m.phase)) return;
  m.time += dt;
  m.phaseTime += dt;
  const c = m.config;
  m.vy = Math.min(value(c, 'physics.terminalVelocity'), m.vy + value(c, 'physics.gravity') * dt);
  m.y += m.vy * dt;
  if (m.y < 0) {
    m.y = 0;
    m.vy = 0;
  }
  if (m.y + 36 >= 388) {
    m.y = 352;
    crash(m, true);
    return;
  }
  if (m.phase === 'falling') return;
  eventStep(m, dt);
  for (const col of m.columns) col.x -= speed(m) * dt;
  m.columns = m.columns.filter((col) => col.x + value(c, 'columns.width') > 0);
  if (!m.columns.length) spawn(m, 572);
  while (m.columns.at(-1)!.x < 512) spawn(m, m.columns.at(-1)!.x + value(c, 'columns.spacing'));
  const bird = { x: 142, y: m.y + 12, w: 24, h: 16 };
  for (const col of m.columns) {
    if (
      bird.x < col.x + value(c, 'columns.width') &&
      bird.x + bird.w > col.x &&
      (bird.y < col.gapY || bird.y + bird.h > col.gapY + col.gap)
    ) {
      crash(m);
      return;
    }
  }
  for (const col of m.columns) {
    const bx = col.x + value(c, 'columns.width') / 2,
      by = col.gapY + col.gap / 2;
    if (
      col.burger &&
      !col.collected &&
      Math.abs(bird.x + 12 - bx) < 30 &&
      Math.abs(bird.y + 8 - by) < 28
    ) {
      col.collected = true;
      m.burgers = Math.min(value(c, 'burger.capacity'), m.burgers + 1);
      m.effects.push('pickup');
    }
    if (!col.passed && col.x + value(c, 'columns.width') < 154) {
      col.passed = true;
      m.clearances++;
      m.effects.push('score');
      if (m.clearances % 10 === 0) {
        m.deliveries++;
        m.effects.push('delivery');
        if (m.mode === 'story' && m.clearances % 20 === 0) {
          m.phase = m.clearances === 60 ? 'won' : 'chapter';
          m.event.phase = 'idle';
          m.effects.push(m.phase);
          return;
        }
      }
    }
  }
}

/** Bounded trajectory search: every 0.1s choose coast or flap, retain quantized states. */
export function gapReachable(
  from: number,
  to: number,
  gap: number,
  seconds: number,
  c: Config,
): boolean {
  let states = [{ y: from - 20, vy: 0 }];
  const slices = Math.ceil(seconds / 0.1),
    dt = seconds / slices;
  for (let i = 0; i < slices; i++) {
    const out = new Map<string, { y: number; vy: number }>();
    for (const state of states)
      for (const flap of [false, true]) {
        let vy = flap ? value(c, 'physics.flapVelocity') : state.vy,
          y = state.y;
        for (let k = 0; k < 6; k++) {
          vy = Math.min(
            value(c, 'physics.terminalVelocity'),
            vy + (value(c, 'physics.gravity') * dt) / 6,
          );
          y += (vy * dt) / 6;
        }
        if (y < 0 || y > 352) continue;
        out.set(`${Math.round(y / 8)}:${Math.round(vy / 40)}`, { y, vy });
      }
    states = [...out.values()]
      .sort((a, b) => Math.abs(a.y + 20 - to) - Math.abs(b.y + 20 - to))
      .slice(0, 160);
    if (!states.length) return false;
  }
  return states.some((s) => s.y + 12 >= to - gap / 2 + 6 && s.y + 28 <= to + gap / 2 - 6);
}
