import type { TuningField, TuningValue } from '../../shared/contracts';
const n = (
  key: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step = 1,
  restart = true,
): TuningField => ({ key, label, type: 'number', default: value, min, max, step, restart });
export const tuning: TuningField[] = [
  n('physics.gravity', 'Gravity', 1280, 600, 1800),
  n('physics.flapVelocity', 'Flap impulse', -392, -600, -200),
  n('physics.terminalVelocity', 'Terminal speed', 536, 300, 800),
  n('columns.width', 'Column width', 48, 32, 64),
  n('columns.spacing', 'Column spacing', 240, 200, 320),
  n('columns.gapStart', 'Starting gap', 164, 128, 224),
  n('columns.gapMin', 'Minimum gap', 144, 128, 224),
  n('columns.maxCenterDelta', 'Gap movement', 64, 0, 96),
  n('scroll.start', 'Starting speed', 110, 70, 220),
  n('scroll.max', 'Maximum speed', 160, 70, 220),
  n('difficulty.capClearances', 'Difficulty cap', 40, 1, 100),
  n('burger.capacity', 'Burger capacity', 3, 1, 5),
  n('burger.firstPair', 'First burger pair', 3, 1, 4),
  n('burger.intervalMin', 'Burger interval minimum', 4, 2, 10),
  n('burger.intervalMax', 'Burger interval maximum', 6, 2, 10),
  n('distraction.firstClearance', 'First distraction', 8, 5, 20),
  n('distraction.cooldownMin', 'Distraction cooldown minimum', 18, 10, 40),
  n('distraction.cooldownMax', 'Distraction cooldown maximum', 26, 10, 40),
  n('presentation.coverage', 'Hands coverage', 0.4, 0.2, 0.7, 0.05, false),
  {
    key: 'presentation.assetVariant',
    label: 'Sprite palette',
    type: 'select',
    default: 'A',
    options: ['A', 'B', 'C'],
    restart: false,
  },
  {
    key: 'presentation.showColliders',
    label: 'Show collision boxes',
    type: 'boolean',
    default: false,
    restart: false,
  },
  {
    key: 'assist.enabled',
    label: 'Assist: wider gaps and slower flight',
    type: 'boolean',
    default: false,
    restart: true,
  },
  {
    key: 'presentation.reducedMotion',
    label: 'Reduced motion',
    type: 'boolean',
    default: false,
    restart: false,
  },
];
export type Config = Record<string, TuningValue>;
export const defaults: Config = Object.fromEntries(tuning.map((f) => [f.key, f.default]));
export const value = (c: Config, key: string) => Number(c[key]);
export function validate(base: Config, patch: Config): Config {
  const next = { ...base };
  for (const [key, v] of Object.entries(patch)) {
    const f = tuning.find((f) => f.key === key);
    if (!f) throw Error(`Unknown Flappy setting: ${key}`);
    if (
      f.type === 'number' &&
      (typeof v !== 'number' ||
        !Number.isFinite(v) ||
        v < (f.min ?? -Infinity) ||
        v > (f.max ?? Infinity))
    )
      throw Error(`${f.label} is outside its allowed range`);
    if (f.type === 'boolean' && typeof v !== 'boolean') throw Error(`${f.label} must be boolean`);
    if (f.type === 'select' && !f.options?.includes(String(v)))
      throw Error(`${f.label} is not an available option`);
    next[key] = v;
  }
  for (const [a, b] of [
    ['columns.gapMin', 'columns.gapStart'],
    ['scroll.start', 'scroll.max'],
    ['burger.intervalMin', 'burger.intervalMax'],
    ['distraction.cooldownMin', 'distraction.cooldownMax'],
  ])
    if (value(next, a) > value(next, b)) throw Error(`${a} must not exceed ${b}`);
  return next;
}
