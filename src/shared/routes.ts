/** Convert a browser URL into the hash-router path, including project Pages bases. */
export function appRoute(pathname: string, hash: string, base = import.meta.env.BASE_URL || '/') {
  if (hash.startsWith('#') && hash.length > 1) return hash.slice(1);
  if (base !== '/' && pathname.startsWith(base)) {
    return pathname.slice(Math.max(0, base.length - 1)) || '/';
  }
  return pathname || '/';
}
