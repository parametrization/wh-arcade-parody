import type { TuningField, TuningValue } from '../../shared/contracts';
export interface SupplyConfig {
  speed: number;
  shiftSeconds: number;
  practice: boolean;
  variant: string;
  mode: string;
}
export const defaults: SupplyConfig = {
  speed: 1,
  shiftSeconds: 45,
  practice: false,
  variant: 'cooperative',
  mode: 'campaign',
};
export const tuning: TuningField[] = [
  { key: 'speed', label: 'Belt speed', type: 'number', default: 1, min: 0.5, max: 1.5, step: 0.1 },
  {
    key: 'shiftSeconds',
    label: 'Shift length',
    type: 'number',
    default: 45,
    min: 20,
    max: 90,
    step: 5,
    restart: true,
  },
  { key: 'practice', label: 'Untimed practice', type: 'boolean', default: false, restart: true },
  {
    key: 'variant',
    label: 'Crate artwork',
    type: 'select',
    default: 'cooperative',
    options: ['cooperative', 'market'],
  },
  {
    key: 'mode',
    label: 'Mode (endless unlocks after victory)',
    type: 'select',
    default: 'campaign',
    options: ['campaign', 'endless'],
    restart: true,
  },
];
export function validateConfig(
  current: SupplyConfig,
  patch: Record<string, TuningValue>,
): SupplyConfig {
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    const field = tuning.find((item) => item.key === key);
    if (!field) throw new Error(`Unknown tuning: ${key}`);
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
