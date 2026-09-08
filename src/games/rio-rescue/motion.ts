import { interval, type Cell, type Model } from './model';

/** Render one confirmed grid step behind; never predict through a wall or cut a corner. */
export function createMotion(model: Model) {
  let from: Cell[] = [],
    to: Cell[] = [],
    steps = 0;
  function reset(m: Model) {
    from = m.body.map((c) => ({ ...c }));
    to = m.body.map((c) => ({ ...c }));
    steps = 0;
  }
  reset(model);
  return {
    reset,
    update(m: Model) {
      if (m.phase !== 'playing' || m.config.mode === 'single-step') {
        reset(m);
        return;
      }
      if (m.body.length === to.length && m.body.every((c, i) => c.x === to[i].x && c.y === to[i].y))
        return;
      const old = to;
      if (
        m.body.length < old.length ||
        m.body.length > old.length + 1 ||
        m.body.some((c, i) => {
          const p = old[i] ?? old.at(-1)!;
          return Math.abs(c.x - p.x) + Math.abs(c.y - p.y) > 1;
        })
      ) {
        reset(m);
        return;
      }
      from = m.body.map((_, i) => ({ ...(old[i] ?? old.at(-1)!) }));
      to = m.body.map((c) => ({ ...c }));
      steps++;
    },
    sample(m: Model, reducedMotion = false) {
      const alpha =
        reducedMotion || m.config.mode === 'single-step'
          ? 1
          : Math.max(0, Math.min(1, m.acc / interval(m)));
      return to.map((c, i) => {
        const p = from[i];
        const moving = c.x !== p.x || c.y !== p.y;
        return {
          x: p.x + (c.x - p.x) * alpha,
          y: p.y + (c.y - p.y) * alpha,
          stride:
            moving && !reducedMotion
              ? Math.sin((steps - 1 + alpha) * Math.PI * 2 + i * 0.7) * 1.4
              : 0,
        };
      });
    },
  };
}
