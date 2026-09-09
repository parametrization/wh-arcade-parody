import type { AssetRecord, GameServices, Clock } from './contracts';
import { createClock } from './clock';
import { createInput } from './input';
import { createRandom } from './random';
import { createStore } from './storage';
import { createAudio } from './audio';
import { createAssets } from './assets';

export function createServices(
  host: HTMLElement,
  seed = 1,
  records: AssetRecord[] = [],
): GameServices {
  // Validate asset identities before allocating event listeners or runtime resources.
  const assets = createAssets(records);
  const baseClock = createClock();
  const input = createInput(host);
  const random = createRandom(seed);
  const storage = createStore(host.dataset.gameId ? `${host.dataset.gameId}.v1` : 'shared.v1');
  const audio = createAudio();
  audio.setScene?.(host.dataset.gameId ?? '');
  const clock: Clock = {
    start(update, render) {
      audio.setActive?.(true);
      baseClock.start(update, render);
    },
    pause() {
      audio.setActive?.(false);
      baseClock.pause();
    },
    resume() {
      audio.setActive?.(true);
      baseClock.resume();
    },
    reset() {
      audio.setActive?.(false);
      baseClock.reset();
    },
    destroy() {
      audio.setActive?.(false);
      baseClock.destroy();
    },
    get time() {
      return baseClock.time;
    },
    get fps() {
      return baseClock.fps;
    },
  };
  let disposed = false;
  const suspend = () => {
    clock.pause();
    input.clear();
  };
  const visibility = () => {
    if (document.hidden) suspend();
  };
  const unlock = () => {
    void audio.unlock();
  };
  window.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', visibility);
  host.addEventListener('pointerdown', unlock);
  host.addEventListener('keydown', unlock);
  return {
    clock,
    input,
    random,
    storage,
    audio,
    assets,
    destroy() {
      if (disposed) return;
      disposed = true;
      window.removeEventListener('blur', suspend);
      document.removeEventListener('visibilitychange', visibility);
      host.removeEventListener('pointerdown', unlock);
      host.removeEventListener('keydown', unlock);
      clock.destroy();
      input.destroy();
      audio.destroy();
      assets.destroy();
    },
  };
}
