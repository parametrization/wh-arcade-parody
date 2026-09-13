/** Resolve a public asset under Vite's configured site base (including Pages). */
export function publicPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
