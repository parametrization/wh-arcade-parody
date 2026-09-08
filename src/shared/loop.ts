export interface FrameScheduler {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}

/** A capped accumulator prevents a background tab from simulating minutes at once. */
export function createLoop(
  update: (dt: number) => void,
  render: (alpha: number) => void,
  scheduler: FrameScheduler = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  },
) {
  const step = 1 / 60;
  let running = false;
  let disposed = false;
  let frame: number | null = null;
  let previous: number | null = null;
  let accumulator = 0;
  let elapsed = 0;
  const tick = (timestamp: number) => {
    frame = null;
    if (!running || disposed) return;
    if (previous !== null) accumulator += Math.max(0, Math.min((timestamp - previous) / 1000, step * 5));
    previous = timestamp;
    while (accumulator + Number.EPSILON >= step && running && !disposed) {
      accumulator -= step;
      elapsed += step;
      update(step);
    }
    if (!running || disposed) return;
    render(Math.max(0, accumulator / step));
    if (running && !disposed && frame === null) frame = scheduler.request(tick);
  };
  const pause = () => {
    running = false;
    previous = null;
    accumulator = 0;
    if (frame !== null) scheduler.cancel(frame);
    frame = null;
  };
  const start = () => {
    if (running || disposed) return;
    running = true;
    previous = null;
    frame = scheduler.request(tick);
  };
  return {
    start,
    resume: start,
    pause,
    stop: pause,
    reset() { previous = null; accumulator = 0; elapsed = 0; },
    destroy() { pause(); disposed = true; },
    get running() { return running; },
    get time() { return elapsed; },
  };
}
