import type { AssetRecord, AssetService } from './contracts';

export function createAssets(records: AssetRecord[] = []): AssetService & { destroy(): void } {
  const copies = records.map(record => ({ ...record }));
  const index = new Map<string, AssetRecord>();
  for (const record of copies) {
    if (index.has(record.id)) throw new Error(`Duplicate asset ID: ${record.id}`);
    index.set(record.id, record);
  }
  const cache = new Map<string, Promise<HTMLImageElement>>();
  const pending = new Set<() => void>();
  let disposed = false;
  const url = (id: string) => {
    const record = index.get(id);
    if (!record) throw new Error(`Unknown asset: ${id}`);
    return record.path;
  };
  return {
    records: copies,
    url,
    image(id) {
      if (disposed) return Promise.reject(new Error('Asset loader is disposed'));
      const existing = cache.get(id);
      if (existing) return existing;
      let path: string;
      try { path = url(id); } catch (error) { return Promise.reject(error); }
      const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const cleanup = () => { img.onload = null; img.onerror = null; pending.delete(cancel); };
        const cancel = () => { cleanup(); img.removeAttribute('src'); reject(new Error(`Asset load cancelled: ${id}`)); };
        pending.add(cancel);
        img.onload = () => { cleanup(); resolve(img); };
        img.onerror = () => { cleanup(); cache.delete(id); reject(new Error(`Could not load asset: ${id} (${path})`)); };
        img.src = path;
      });
      cache.set(id, promise);
      return promise;
    },
    destroy() { disposed = true; for (const cancel of [...pending]) cancel(); cache.clear(); },
  };
}
