import type { SupplyConfig } from './config';
export type Destination = 0 | 1 | 2;
export const materialNames = ['Pharmacy', 'Housing', 'Medical supplies'] as const;
export const destinations = ['Pharmacy △', 'Housing ⌂', 'Medical +'] as const;
export const supplierNames = [
  'Pill & Parcel',
  'Roof & Beam',
  'Care Package Medical',
  'Financial Misappropriations',
] as const;
export const operatorNames = ['Mara', 'Ellis', 'Rowan'] as const;
export type Material = Destination;
export type TruckId = Destination | 3;
export const loadingStages = [
  { phase: 'announce', duration: 0.5 },
  { phase: 'walk-to-truck', duration: 0.65 },
  { phase: 'retrieve', duration: 0.45 },
  { phase: 'walk-to-belt', duration: 0.65 },
  { phase: 'place', duration: 0.25 },
] as const;
export interface LoadingJob {
  id: number;
  lane: Destination;
  destination: Material;
  truck: TruckId;
  sleeve: boolean;
  phase: (typeof loadingStages)[number]['phase'];
  elapsed: number;
  duration: number;
}

export interface Crate {
  id: number;
  lane: Destination;
  destination: Destination;
  x: number;
  sleeve: boolean;
}
export interface SupplyModel {
  phase: 'title' | 'shift' | 'upgrade' | 'won' | 'lost';
  shift: number;
  time: number;
  elapsed: number;
  nextSpawn: number;
  serial: number;
  budget: number;
  score: number;
  delivered: number[];
  combo: number;
  bells: number;
  bellTime: number;
  crates: Crate[];
  loadingJobs: LoadingJob[];
  gates: Destination[];
  recovery: Destination[];
  event: {
    person: 0 | 1 | 2;
    lane: Destination;
    time: number;
    activated: boolean;
    blocked: boolean;
  } | null;
  nextEvent: number;
  branding: number;
  handling: number;
  capacity: number;
  bellBonus: number;
  message: string;
  balanced: number;
  practice: boolean;
  endless: boolean;
}
export function createModel(practice = false, endless = false): SupplyModel {
  return {
    phase: 'title',
    shift: 1,
    time: 0,
    elapsed: 0,
    nextSpawn: 0.7,
    serial: 0,
    budget: 100,
    score: 0,
    delivered: [0, 0, 0],
    combo: 0,
    bells: 1,
    bellTime: 0,
    crates: [],
    loadingJobs: [],
    gates: [0, 1, 2],
    recovery: [],
    event: null,
    nextEvent: 10,
    branding: 0,
    handling: 0,
    capacity: 6,
    bellBonus: 0,
    message: 'Strip gold sleeves. Match the destination. Keep all three destinations stocked.',
    balanced: 0,
    practice,
    endless,
  };
}
export function startModel(m: SupplyModel) {
  if (m.phase === 'title') m.phase = 'shift';
}
export function stripCrate(m: SupplyModel, id: number): boolean {
  if (m.phase !== 'shift') return false;
  const crate = m.crates.find((item) => item.id === id);
  if (!crate?.sleeve) return false;
  crate.sleeve = false;
  m.score += 5;
  m.message = 'Gold sleeve removed. Materials stay on the belt.';
  return true;
}
export function cycleGate(m: SupplyModel, lane: Destination) {
  if (m.phase !== 'shift') return;
  m.gates[lane] = ((m.gates[lane] + 1) % 3) as Destination;
  m.message = `Lane ${lane + 1} → ${destinations[m.gates[lane]]}`;
}
export function lockGate(m: SupplyModel, lane: Destination) {
  if (m.event?.person === 1 && m.event.lane === lane) {
    m.event.blocked = true;
    m.message = 'Supplier routing change blocked. Gate remains locked.';
  }
}
export function ringBell(m: SupplyModel) {
  if (m.phase !== 'shift' || m.bells < 1) return false;
  m.bells--;
  m.bellTime = 4 + m.bellBonus;
  m.event = null;
  m.branding = 0;
  m.message = 'Loading bell: belts slowed and supplier processing events cancelled.';
  return true;
}
export function dispatch(m: SupplyModel, crate: Crate) {
  if (crate.sleeve) {
    m.budget -= 8;
    m.combo = 0;
    m.message = 'Gold packaging cost 8 budget.';
  }
  if (m.gates[crate.lane] !== crate.destination) {
    m.budget -= 4;
    m.combo = 0;
    if (m.recovery.length < m.capacity) m.recovery.push(crate.destination);
    m.message = 'Misroute: materials saved in recovery bin when space permits.';
  } else {
    m.score += 10;
    m.delivered[crate.destination]++;
    m.combo++;
    const total = m.delivered.reduce((a, b) => a + b, 0);
    if (total % 12 === 0) m.bells = Math.min(2, m.bells + 1);
    const balanced = Math.min(...m.delivered);
    if (balanced > m.balanced) {
      m.score += 20 * (balanced - m.balanced);
      m.budget = Math.min(100, m.budget + 5 * (balanced - m.balanced));
      m.balanced = balanced;
    }
    if (!crate.sleeve) m.message = `Delivered to ${destinations[crate.destination]}.`;
  }
  m.budget = Math.max(m.practice ? 1 : 0, m.budget);
  if (m.budget === 0) {
    m.phase = 'lost';
    m.message = 'Budget swallowed by packaging. Restart and try a new route.';
  }
}
export function upgrade(m: SupplyModel, choice: 'handling' | 'recovery' | 'bell') {
  if (m.phase !== 'upgrade') return;
  if (choice === 'handling') m.handling += 12;
  if (choice === 'recovery') m.capacity += 6;
  if (choice === 'bell') m.bellBonus += 2;
  m.shift++;
  m.elapsed = 0;
  m.nextSpawn = 0.5;
  m.nextEvent = 9;
  m.phase = 'shift';
  m.event = null;
  m.message = 'Next shift. Recovery crates return first.';
}
export function tick(m: SupplyModel, dt: number, config: SupplyConfig, random: () => number) {
  if (m.phase !== 'shift' || dt <= 0 || !Number.isFinite(dt)) return;
  m.time += dt;
  m.elapsed += dt;
  m.bellTime = Math.max(0, m.bellTime - dt);
  m.nextSpawn -= dt;
  m.nextEvent -= dt;
  if (m.event) {
    const e = m.event;
    e.time += dt;
    const warning = e.person === 0 ? 1.5 : 2;
    if (e.time >= warning && !e.activated) {
      e.activated = true;
      if (e.person === 0) m.branding = 3;
      if (e.person === 1 && !e.blocked)
        m.gates[e.lane] = ((m.gates[e.lane] + 1) % 3) as Destination;
    }
    if (e.time > warning + 3) {
      m.event = null;
      m.nextEvent = 8 + random() * 4;
    }
  } else if (m.nextEvent <= 0 && m.elapsed < config.shiftSeconds - 8) {
    const person = ((m.shift - 1 + Math.floor(m.time / 13)) % 3) as 0 | 1 | 2;
    m.event = {
      person,
      lane: Math.floor(random() * 3) as Destination,
      time: 0,
      activated: false,
      blocked: false,
    };
    m.message = [
      'Packaging update incoming. Watch for gold sleeves.',
      'Supplier routing update incoming. Lock the gate or ring the bell.',
      'Supplier processing delay incoming. Other lanes stay open.',
    ][person];
  }
  advanceLoading(m, dt);
  if (m.nextSpawn <= 0 && m.elapsed < config.shiftSeconds) {
    m.nextSpawn = 1.45;
    const lane = (m.serial % 3) as Destination;
    if (
      !m.loadingJobs.some((job) => job.lane === lane) &&
      !(m.event?.person === 2 && m.event.activated && m.event.lane === lane)
    ) {
      const destination =
        m.recovery.shift() ?? ((m.shift === 1 ? lane : Math.floor(random() * 3)) as Destination);
      const sleeve = m.branding > 0 || random() < 0.35;
      if (m.branding > 0) m.branding--;
      m.loadingJobs.push({
        id: ++m.serial,
        lane,
        destination,
        truck: sleeve ? 3 : destination,
        sleeve,
        phase: 'announce',
        elapsed: 0,
        duration: loadingStages[0].duration,
      });
      m.message = `${operatorNames[lane]}: next ${materialNames[destination]} from ${supplierNames[sleeve ? 3 : destination]}.`;
    } else m.serial++;
  }
  const velocity = (35 + Math.min(8, m.shift - 1) * 7) * config.speed * (m.bellTime > 0 ? 0.45 : 1);
  for (const crate of m.crates) crate.x += dt * velocity;
  const ready = m.crates.filter((crate) => crate.x >= 480 + m.handling);
  m.crates = m.crates.filter((crate) => crate.x < 480 + m.handling);
  for (const crate of ready) {
    dispatch(m, crate);
    if (m.phase !== 'shift') return;
  }
  if (m.elapsed >= config.shiftSeconds && m.crates.length === 0 && m.loadingJobs.length === 0) {
    if (m.shift < 3 || m.endless) {
      m.phase = 'upgrade';
      m.message = 'Shift complete. Choose one cooperative upgrade.';
    } else {
      const total = m.delivered.reduce((a, b) => a + b, 0);
      m.phase = total >= 36 && Math.min(...m.delivered) >= 8 ? 'won' : 'lost';
      m.message =
        m.phase === 'won'
          ? 'Delivery complete! All three destinations are stocked.'
          : 'The neighborhood needs 36 deliveries and 8 per destination. Try again.';
    }
  }
}

/** Advance existing worker jobs; every handoff creates exactly one crate on its own belt. */
export function advanceLoading(m: SupplyModel, dt: number) {
  if (m.phase !== 'shift' || !Number.isFinite(dt) || dt <= 0) return;
  const completed = new Set<number>();
  for (const job of m.loadingJobs) {
    let remaining = dt;
    while (remaining > 0) {
      const step = Math.min(remaining, job.duration - job.elapsed);
      job.elapsed += step;
      remaining -= step;
      if (job.elapsed + 1e-9 < job.duration) break;
      const stage = loadingStages.findIndex((item) => item.phase === job.phase) + 1;
      if (stage === loadingStages.length) {
        m.crates.push({
          id: job.id,
          lane: job.lane,
          destination: job.destination,
          sleeve: job.sleeve,
          x: 24,
        });
        completed.add(job.id);
        break;
      }
      job.phase = loadingStages[stage].phase;
      job.duration = loadingStages[stage].duration;
      job.elapsed = 0;
    }
  }
  m.loadingJobs = m.loadingJobs.filter((job) => !completed.has(job.id));
}
