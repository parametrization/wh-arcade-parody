export type GameState = 'title' | 'running' | 'paused' | 'won' | 'lost';
export type TuningValue = number | string | boolean;
export interface TuningField {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  default: TuningValue;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  restart?: boolean;
}
export interface GameManifest {
  id: string;
  title: string;
  description: string;
  controls: string[];
  assetIds: string[];
}
export interface GameInspection {
  state: GameState;
  time: number;
  fps: number;
  [key: string]: unknown;
}
export interface GameInstance {
  start(): void;
  pause(): void;
  resume(): void;
  reset(seed?: number): void;
  destroy(): void;
  inspect?(): GameInspection;
  configure?(patch: Record<string, TuningValue>): void;
}
export interface GameModule {
  manifest: GameManifest;
  tuning?: TuningField[];
  create(host: HTMLElement, services: GameServices): GameInstance | Promise<GameInstance>;
}
export interface Clock {
  start(update: (dt: number) => void, render: (alpha: number) => void): void;
  pause(): void;
  resume(): void;
  reset(): void;
  destroy(): void;
  readonly time: number;
  readonly fps: number;
}
export interface Input {
  bind(actions: Record<string, string[]>): void;
  on(action: string, handler: () => void): () => void;
  pressed(action: string): boolean;
  clear(): void;
  destroy(): void;
}
export interface Random {
  next(): number;
  int(min: number, max: number): number;
  seed(value: number): void;
  readonly state: number;
}
export interface Store {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
export interface AudioService {
  unlock(): Promise<void>;
  tone(frequency?: number, duration?: number): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  destroy(): void;
}
export interface AssetRecord {
  id: string;
  path: string;
  author: string;
  rights: string;
  source?: string;
  modified?: string;
}
export interface AssetService {
  records: AssetRecord[];
  url(id: string): string;
  image(id: string): Promise<HTMLImageElement>;
}
export interface GameServices {
  clock: Clock;
  input: Input;
  random: Random;
  storage: Store;
  audio: AudioService;
  assets: AssetService;
  destroy(): void;
}
export interface Settings {
  muted: boolean;
  volume: number;
  reducedMotion: boolean;
  highContrast: boolean;
  scanlines: number;
}
