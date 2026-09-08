/** Mulberry32: repeatable game randomness; not suitable for security tokens. */
export function createRandom(seed = 1) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    float: next,
    int(min: number, max: number) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min)
        throw new RangeError('Invalid random integer bounds');
      return min + Math.floor(next() * (max - min + 1));
    },
    seed(value: number) {
      state = value >>> 0;
    },
    get state() {
      return state;
    },
    reset(value: number) {
      state = value >>> 0;
    },
    getState: () => state,
    setState(value: number) {
      state = value >>> 0;
    },
  };
}
