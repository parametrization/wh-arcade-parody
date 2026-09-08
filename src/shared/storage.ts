export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length?: number;
  key?(index: number): string | null;
}

const sharedMemory = new Map<string, Map<string, string | null>>();
const resetPrefixes = new Set<string>();
const prefix = 'wh-arcade-parody.';

/** Memory remains authoritative when browser storage is blocked or full. */
export function createStorage(namespace: string, backend?: StorageLike | null) {
  const usesDefaultBackend = backend === undefined;
  const memory = usesDefaultBackend
    ? (sharedMemory.get(namespace) ?? new Map<string, string | null>())
    : new Map<string, string | null>();
  if (usesDefaultBackend) sharedMemory.set(namespace, memory);
  let persistent = backend;
  if (persistent === undefined) {
    try {
      persistent = globalThis.localStorage;
    } catch {
      persistent = null;
    }
  }
  const keyFor = (key: string) => `wh-arcade-parody.${namespace}.${key}`;
  return {
    get<T>(key: string, fallback: T, version = 1): T {
      const fullKey = keyFor(key);
      let raw = memory.get(fullKey);
      if (
        !memory.has(fullKey) &&
        !(
          usesDefaultBackend &&
          [...resetPrefixes].some(
            (prefix) => fullKey.startsWith(prefix) && /^\d+\./.test(fullKey.slice(prefix.length)),
          )
        )
      ) {
        try {
          raw = persistent?.getItem(fullKey);
        } catch {
          raw = null;
        }
      }
      if (!raw) return fallback;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('version' in parsed) ||
          !('value' in parsed) ||
          parsed.version !== version
        )
          return fallback;
        return parsed.value as T;
      } catch {
        return fallback;
      }
    },
    set<T>(key: string, value: T, version = 1): void {
      const fullKey = keyFor(key);
      try {
        const raw = JSON.stringify({ version, value });
        memory.set(fullKey, raw);
        try {
          persistent?.setItem(fullKey, raw);
        } catch {
          /* Memory fallback. */
        }
      } catch {
        /* Unserializable values never interrupt gameplay. */
      }
    },
    remove(key: string): void {
      const fullKey = keyFor(key);
      memory.set(fullKey, null);
      try {
        persistent?.removeItem(fullKey);
      } catch {
        /* Memory tombstone wins. */
      }
    },
  };
}

/** Namespace callers with a schema version, e.g. "flappy-files.v1". */
export const createStore = createStorage;

/** Reset versioned data belonging only to explicitly supplied game IDs. */
export function clearGameScores(gameIds: string[], backend?: StorageLike | null): void {
  const prefixes = gameIds
    .filter(
      (id) =>
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && !['settings', 'controls', 'shared'].includes(id),
    )
    .map((id) => `${prefix}${id}.v`);
  const matches = (key: string) =>
    prefixes.some((value) => key.startsWith(value) && /^\d+\./.test(key.slice(value.length)));
  if (backend === undefined) {
    for (const value of prefixes) resetPrefixes.add(value);
    for (const memory of sharedMemory.values())
      for (const key of memory.keys()) if (matches(key)) memory.set(key, null);
    try {
      backend = globalThis.localStorage;
    } catch {
      backend = null;
    }
  }
  try {
    const keys: string[] = [];
    for (let index = 0; index < (backend?.length ?? 0); index++) {
      const key = backend?.key?.(index);
      if (key && matches(key)) keys.push(key);
    }
    for (const key of keys) {
      try {
        backend?.removeItem(key);
      } catch {
        /* Blocked storage is nonfatal. */
      }
    }
  } catch {
    /* Enumeration can itself be blocked. */
  }
}
