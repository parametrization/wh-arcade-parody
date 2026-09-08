import type { Clock } from './contracts';
import { createLoop, type FrameScheduler } from './loop';

export function createClock(scheduler?: FrameScheduler): Clock {
  let loop: ReturnType<typeof createLoop> | null = null;
  let disposed = false;
  let fps = 0;
  let lastFrame: number | null = null;
  return {
    start(update, render) {
      if (disposed) return;
      loop?.destroy();
      lastFrame = null;
      loop = createLoop(
        update,
        (alpha) => {
          const now = performance.now();
          if (lastFrame !== null && now > lastFrame) fps = 1000 / (now - lastFrame);
          lastFrame = now;
          render(alpha);
        },
        scheduler,
      );
      loop.start();
    },
    pause() {
      loop?.pause();
      lastFrame = null;
      fps = 0;
    },
    resume() {
      loop?.resume();
      lastFrame = null;
    },
    reset() {
      loop?.reset();
      lastFrame = null;
      fps = 0;
    },
    destroy() {
      disposed = true;
      loop?.destroy();
      loop = null;
      fps = 0;
    },
    get time() {
      return loop?.time ?? 0;
    },
    get fps() {
      return fps;
    },
  };
}
