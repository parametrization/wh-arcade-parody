import type { TycoonConfig } from './config';
export type Resource = 0 | 1 | 2 | 3 | 4;
export const resourceNames = [
  'Book',
  'Care kit',
  'Home key',
  'Flexible coin',
  'Hollow promise',
] as const;
export const serviceNames = ['Education', 'Care', 'Homes'] as const;
export const laneX = [140, 320, 500];
export interface Target {
  id: number;
  type: Resource;
  lane: number;
  y: number;
  warning: number;
}
export interface TycoonModel {
  phase: 'title' | 'round' | 'invest' | 'won' | 'lost';
  round: number;
  time: number;
  elapsed: number;
  spawnIn: number;
  serial: number;
  spawned: number;
  resolved: number;
  netX: number;
  catchTime: number;
  cooldown: number;
  integrity: number;
  score: number;
  combo: number;
  audits: number;
  freeze: number;
  resources: number[];
  levels: number[];
  targets: Target[];
  bought: boolean;
  event: { person: number; time: number } | null;
  eventIn: number;
  message: string;
  practice: boolean;
}
export function createModel(practice = false): TycoonModel {
  return {
    phase: 'title',
    round: 1,
    time: 0,
    elapsed: 0,
    spawnIn: 0.5,
    serial: 0,
    spawned: 0,
    resolved: 0,
    netX: 320,
    catchTime: 0,
    cooldown: 0,
    integrity: 6,
    score: 0,
    combo: 0,
    audits: 1,
    freeze: 0,
    resources: [0, 0, 0, 0],
    levels: [0, 0, 0],
    targets: [],
    bought: false,
    event: null,
    eventIn: 9,
    message: 'Catch resources. Let hollow promises float past. Build all three services.',
    practice,
  };
}
export function startModel(m: TycoonModel) {
  if (m.phase === 'title') m.phase = 'round';
}
export function catchWidth(m: TycoonModel) {
  return 46 * (1 + 0.15 * m.levels[2]) * (m.event?.person === 2 && m.event.time >= 2 ? 0.8 : 1);
}
export function moveNet(m: TycoonModel, x: number) {
  if (m.phase === 'round') m.netX = Math.max(55, Math.min(585, x));
}
export function activateCatch(m: TycoonModel) {
  // Practice has no advancing clock: a failed attempt must be retryable after
  // the player changes lanes instead of waiting on a timer that never runs.
  if (m.phase !== 'round' || (m.cooldown > 0 && !m.practice)) return false;
  m.catchTime = 0.4 + 0.08 * m.levels[0];
  m.cooldown = m.catchTime + 0.6;
  return true;
}
export function audit(m: TycoonModel) {
  if (m.phase !== 'round' || m.audits === 0) return false;
  m.audits--;
  m.freeze = 2;
  m.event = null;
  m.eventIn = 8;
  m.message = 'Public audit: the fine print is visible. Targets paused for two seconds.';
  return true;
}
export function collect(m: TycoonModel, target: Target) {
  m.resolved++;
  if (target.type === 4) {
    m.cooldown = 0.8;
    m.catchTime = 0;
    m.message = 'An empty promise. No resources; clear the net.';
    return;
  }
  m.resources[target.type]++;
  m.score += 10;
  m.combo++;
  if (m.combo % 3 === 0) m.integrity = Math.min(6, m.integrity + 1);
  if (m.combo % 5 === 0) m.audits = Math.min(2, m.audits + 1);
  m.message = `Caught ${resourceNames[target.type]}. Public resources +1.`;
}
export function miss(m: TycoonModel, target: Target) {
  m.resolved++;
  if (target.type === 4) return;
  m.combo = 0;
  m.integrity = Math.max(m.practice ? 1 : 0, m.integrity - 1);
  m.message = 'Resource missed. Three consecutive catches repair the net.';
  if (m.integrity === 0) {
    m.phase = 'lost';
    m.message = 'The safety net needs repairs. Restart for another try.';
  }
}
export function resolveCatches(m: TycoonModel) {
  if (m.phase !== 'round' || m.catchTime <= 0) return;
  const caught = m.targets.filter(
    (target) =>
      target.warning <= 0 &&
      Math.abs(laneX[target.lane] - m.netX) <= catchWidth(m) &&
      target.y >= 278 &&
      target.y <= 325,
  );
  m.targets = m.targets.filter((target) => !caught.includes(target));
  for (const target of caught) collect(m, target);
}
export function spawn(m: TycoonModel, random: () => number, practice = false) {
  const type = (m.spawned % 5) as Resource;
  const lane = Math.floor(random() * 3);
  m.targets.push({
    id: ++m.serial,
    type,
    lane,
    y: practice ? 295 : 63,
    warning: practice ? 0 : 1.1,
  });
  m.spawned++;
}
export function practiceNext(m: TycoonModel, random: () => number) {
  if (m.phase !== 'round' || m.targets.length) return;
  m.cooldown = 0;
  m.catchTime = 0;
  if (m.spawned >= 20) {
    m.phase = 'invest';
    m.bought = false;
    m.message = 'Practice round complete. Invest or continue.';
    return;
  }
  spawn(m, random, true);
  m.message = `Next: ${resourceNames[m.targets[0].type]}, lane ${m.targets[0].lane + 1}. Select that lane and catch, or pass.`;
}
export function practicePass(m: TycoonModel) {
  if (m.phase !== 'round' || !m.practice) return;
  for (const target of m.targets) miss(m, target);
  m.targets = [];
}
export function canBuy(m: TycoonModel, track: number) {
  return (
    m.phase === 'invest' &&
    !m.bought &&
    track >= 0 &&
    track < 3 &&
    m.levels[track] < 2 &&
    m.resources[track] >= 3 &&
    m.resources[3] >= 1
  );
}
export function buy(m: TycoonModel, track: number) {
  if (!canBuy(m, track)) return false;
  m.resources[track] -= 3;
  m.resources[3]--;
  m.levels[track]++;
  m.score += 50;
  m.bought = true;
  m.message = `${serviceNames[track]} improved. One purchase per round.`;
  return true;
}
export function trade(m: TycoonModel, from: number, to: number) {
  if (
    m.phase !== 'invest' ||
    m.round !== 5 ||
    from === to ||
    from < 0 ||
    from > 3 ||
    to < 0 ||
    to > 3 ||
    m.resources[from] < 2
  )
    return false;
  m.resources[from] -= 2;
  m.resources[to]++;
  return true;
}
export function continueRound(m: TycoonModel) {
  if (m.phase !== 'invest') return;
  if (m.round === 5) {
    m.phase = m.levels.every((level) => level >= 1) ? 'won' : 'lost';
    m.message =
      m.phase === 'won'
        ? 'Public dividend! Homes, care and education for the neighborhood.'
        : 'The city still needs a level in all three services. Restart and invest across the community.';
    return;
  }
  m.round++;
  m.elapsed = 0;
  m.spawnIn = 0.5;
  m.spawned = 0;
  m.resolved = 0;
  m.targets = [];
  m.catchTime = 0;
  m.cooldown = 0;
  m.bought = false;
  m.event = null;
  m.eventIn = 9;
  m.integrity = Math.min(6, m.integrity + 2 * m.levels[1]);
  m.phase = 'round';
  m.message = `Round ${m.round}/5. Catch resources, not promises.`;
}
export function tick(m: TycoonModel, dt: number, config: TycoonConfig, random: () => number) {
  if (m.phase !== 'round' || dt <= 0 || !Number.isFinite(dt)) return;
  m.time += dt;
  m.elapsed += dt;
  m.catchTime = Math.max(0, m.catchTime - dt);
  m.cooldown = Math.max(0, m.cooldown - dt);
  m.freeze = Math.max(0, m.freeze - dt);
  if (m.event) {
    m.event.time += dt;
    if (m.event.time >= 6) {
      m.event = null;
      m.eventIn = 8;
    }
  } else if (m.round > 1) {
    m.eventIn -= dt;
    if (m.eventIn <= 0 && m.elapsed < config.roundSeconds - 8)
      m.event = { person: (m.round - 2) % 3, time: 0 };
  }
  m.spawnIn -= dt;
  if (m.spawnIn <= 0 && m.elapsed < config.roundSeconds) {
    spawn(m, random);
    m.spawnIn = 1.65;
  }
  for (const target of m.targets) {
    if (target.warning > 0) target.warning = Math.max(0, target.warning - dt);
    else if (m.freeze <= 0) target.y += dt * (62 + (m.round - 1) * 3) * config.speed;
  }
  if (
    config.autoCatch &&
    m.cooldown <= 0 &&
    m.targets.some(
      (target) =>
        target.type !== 4 &&
        target.y >= 278 &&
        target.y <= 325 &&
        Math.abs(laneX[target.lane] - m.netX) <= catchWidth(m),
    )
  )
    activateCatch(m);
  resolveCatches(m);
  const missed = m.targets.filter((target) => target.y > 334);
  m.targets = m.targets.filter((target) => target.y <= 334);
  for (const target of missed) {
    miss(m, target);
    if (m.phase !== 'round') return;
  }
  if (m.elapsed >= config.roundSeconds && m.targets.length === 0) {
    m.phase = 'invest';
    m.bought = false;
    m.message = 'Round complete. One investment makes a visible difference.';
  }
}
