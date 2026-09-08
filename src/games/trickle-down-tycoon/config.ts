import type { TuningField, TuningValue } from '../../shared/contracts';
export interface TycoonConfig {
  speed: number;
  roundSeconds: number;
  practice: boolean;
  autoCatch: boolean;
  variant: string;
}
export const defaults: TycoonConfig = {
  speed: 1,
  roundSeconds: 35,
  practice: false,
  autoCatch: false,
  variant: 'patchwork',
};
export const tuning: TuningField[] = [
  {
    key: 'speed',
    label: 'Falling speed',
    type: 'number',
    default: 1,
    min: 0.5,
    max: 1.5,
    step: 0.1,
  },
  {
    key: 'roundSeconds',
    label: 'Round seconds',
    type: 'number',
    default: 35,
    min: 20,
    max: 60,
    step: 5,
    restart: true,
  },
  { key: 'practice', label: 'Untimed practice', type: 'boolean', default: false, restart: true },
  { key: 'autoCatch', label: 'Auto-catch while aligned', type: 'boolean', default: false },
  {
    key: 'variant',
    label: 'Safety net artwork',
    type: 'select',
    default: 'patchwork',
    options: ['patchwork', 'basket'],
  },
];
export function validateConfig(
  current: TycoonConfig,
  patch: Record<string, TuningValue>,
): TycoonConfig {
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    const field = tuning.find((item) => item.key === key);
    if (!field) throw new Error(`Unknown tuning ${key}`);
    if (
      field.type === 'number' &&
      (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < (field.min ?? 0) ||
        value > (field.max ?? Infinity))
    )
      throw new Error(`Invalid ${field.label}`);
    if (field.type === 'boolean' && typeof value !== 'boolean')
      throw new Error(`Invalid ${field.label}`);
    if (field.type === 'select' && (typeof value !== 'string' || !field.options?.includes(value)))
      throw new Error(`Invalid ${field.label}`);
    Object.assign(next, { [key]: value });
  }
  return next;
}
