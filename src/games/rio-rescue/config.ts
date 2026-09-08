import type { TuningField, TuningValue } from '../../shared/contracts';
export const tuning: TuningField[] = [
  {
    key: 'tick.startMs',
    label: 'Starting tick (ms)',
    type: 'number',
    default: 240,
    min: 180,
    max: 500,
    restart: true,
  },
  {
    key: 'tick.minMs',
    label: 'Fastest tick (ms)',
    type: 'number',
    default: 140,
    min: 100,
    max: 240,
    restart: true,
  },
  {
    key: 'tick.pickupDecreaseMs',
    label: 'Acceleration per rescue',
    type: 'number',
    default: 5,
    min: 0,
    max: 10,
    restart: true,
  },
  {
    key: 'convoy.maxRescued',
    label: 'Group capacity',
    type: 'number',
    default: 6,
    min: 3,
    max: 8,
    step: 1,
    restart: true,
  },
  {
    key: 'dock.openAt',
    label: 'Open center after',
    type: 'number',
    default: 3,
    min: 1,
    max: 6,
    step: 1,
    restart: true,
  },
  {
    key: 'hazard.warningSeconds',
    label: 'Hazard warning',
    type: 'number',
    default: 2.5,
    min: 2,
    max: 5,
    restart: true,
  },
  {
    key: 'hazard.floatSeconds',
    label: 'Photo-op duration',
    type: 'number',
    default: 4,
    min: 2,
    max: 6,
    restart: true,
  },
  {
    key: 'hazard.bannerSeconds',
    label: 'Tape duration',
    type: 'number',
    default: 5,
    min: 2,
    max: 8,
    restart: true,
  },
  {
    key: 'share.capacity',
    label: 'Share capacity',
    type: 'number',
    default: 2,
    min: 1,
    max: 3,
    step: 1,
    restart: true,
  },
  {
    key: 'share.seconds',
    label: 'Share slow duration',
    type: 'number',
    default: 3,
    min: 2,
    max: 5,
    restart: true,
  },
  {
    key: 'assist.speedMultiplier',
    label: 'Movement speed',
    type: 'number',
    default: 1,
    min: 0.6,
    max: 1.5,
    restart: true,
  },
  {
    key: 'mode',
    label: 'Mode',
    type: 'select',
    default: 'standard',
    options: ['standard', 'story', 'single-step'],
    restart: true,
  },
  {
    key: 'presentation.assetVariant',
    label: 'Palette',
    type: 'select',
    default: 'A',
    options: ['A', 'B', 'C'],
  },
  {
    key: 'presentation.showReservations',
    label: 'Show hazard reservations',
    type: 'boolean',
    default: false,
  },
  {
    key: 'presentation.leftHanded',
    label: 'Left-handed touch controls',
    type: 'boolean',
    default: false,
  },
];
export type Config = Record<string, TuningValue>;
export const defaults = (): Config => Object.fromEntries(tuning.map((f) => [f.key, f.default]));
export function validateConfig(base: Config, patch: Config): Config {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const f = tuning.find((x) => x.key === key);
    if (!f) throw new Error(`Unknown Rio setting: ${key}`);
    if (
      f.type === 'number' &&
      (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < (f.min ?? -Infinity) ||
        value > (f.max ?? Infinity) ||
        (f.step === 1 && !Number.isInteger(value)))
    )
      throw new Error(`Invalid ${f.label}`);
    if (f.type === 'boolean' && typeof value !== 'boolean') throw new Error(`Invalid ${f.label}`);
    if (f.type === 'select' && (typeof value !== 'string' || !f.options?.includes(value)))
      throw new Error(`Invalid ${f.label}`);
    next[key] = value;
  }
  if (
    Number(next['tick.minMs']) > Number(next['tick.startMs']) ||
    Number(next['dock.openAt']) > Number(next['convoy.maxRescued'])
  )
    throw new Error('Minimum tick/group opening exceeds its maximum');
  return next;
}
