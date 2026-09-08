import type { GameInstance, GameModule, Settings, TuningValue } from '../shared/contracts';
import { createServices } from '../shared/services';
import { loadBindings } from '../shared/input';

/** Deliberately player-facing controls only; physics and rendering debug values stay in dev. */
const playerOptions = new Set([
  'practice',
  'autoCatch',
  'speed',
  'mode',
  'assist.enabled',
  'assist.speedMultiplier',
  'presentation.leftHanded',
]);

/** One module per route; the caller owns this host's disposal, including async races. */
export async function mountGame(
  main: HTMLElement,
  module: GameModule,
  settings: Settings,
  signal?: AbortSignal,
): Promise<() => void> {
  const abort = new AbortController();
  main.innerHTML = `<section class="page-section game-page"><a class="back-link" href="#/">← BACK TO THE ARCADE</a><div class="game-page-heading"><p class="eyebrow">THE PEOPLE'S HOUSE ARCADE</p><h1></h1><p class="game-description"></p></div><div class="game-toolbar" aria-label="Game controls"><button class="button-link" data-testid="game-start">START</button><button class="button-link secondary-button" data-testid="game-pause" disabled>PAUSE</button><button class="button-link secondary-button" data-testid="game-restart">RESTART</button><a class="button-link secondary-button" href="#/">EXIT</a></div><div class="game-surface" tabindex="0" data-testid="game-surface"></div><p class="game-host-status" role="status" aria-live="polite"></p><details class="game-instructions"><summary>Controls & instructions</summary><ul></ul></details><p class="satire-caption">Unofficial political satire. Cartoon encounters are fictional; appearing as a character is not a factual allegation.</p></section>`;
  main.querySelector('h1')!.textContent = module.manifest.title;
  main.querySelector('.game-description')!.textContent = module.manifest.description;
  const instructions = main.querySelector('.game-instructions ul')!;
  for (const text of module.manifest.controls) {
    const item = document.createElement('li');
    item.textContent = text;
    instructions.append(item);
  }
  const host = main.querySelector<HTMLElement>('.game-surface')!;
  host.dataset.gameId = module.manifest.id;
  host.dataset.reducedMotion = String(settings.reducedMotion);
  host.dataset.muted = String(settings.muted);
  const replayGames = new Set(['against-the-wall', 'rio-rescue', 'flappy-files']);
  const hasReplay = replayGames.has(module.manifest.id);
  const routeQuery = location.hash.includes('?') ? location.hash.split('?')[1] : location.search;
  const suppliedSeed = new URLSearchParams(routeQuery).get('seed');
  let replaySeed =
    suppliedSeed !== null && /^\d+$/.test(suppliedSeed) && Number(suppliedSeed) <= 4294967295
      ? Number(suppliedSeed)
      : 1;
  const services = createServices(host, replaySeed);
  services.audio.setMuted(settings.muted);
  services.audio.setVolume(settings.volume);
  let instance: GameInstance;
  try {
    instance = await module.create(host, services);
    if (hasReplay) instance.reset(replaySeed);
  } catch (error) {
    services.destroy();
    abort.abort();
    throw error;
  }
  if (signal?.aborted || !host.isConnected) {
    instance.destroy();
    services.destroy();
    abort.abort();
    return () => {};
  }
  let disposed = false;
  const status = main.querySelector<HTMLElement>('.game-host-status')!;
  const startButton = main.querySelector<HTMLButtonElement>('[data-testid="game-start"]')!;
  const pauseButton = main.querySelector<HTMLButtonElement>('[data-testid="game-pause"]')!;
  if (hasReplay) {
    const replay = document.createElement('form');
    replay.className = 'game-replay';
    replay.innerHTML = `<label>Map seed <input data-testid="game-seed" type="number" min="0" max="4294967295" step="1" required aria-label="Map seed"></label><button class="button-link secondary-button" type="submit" data-testid="replay-seed">REPLAY SEED</button><button class="button-link secondary-button" type="button" data-testid="new-seed">NEW SEED</button><button class="button-link secondary-button" type="button" data-testid="copy-seed">COPY REPLAY LINK</button><span data-seed-status role="status"></span><style>.game-replay{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:14px 0;font:13px system-ui}.game-replay label{display:flex;align-items:center;gap:8px}.game-replay input{width:130px;min-height:42px;background:#12243b;border:1px solid #8198ae;color:#fff;padding:8px}.game-replay [data-seed-status]{overflow-wrap:anywhere;max-width:100%}</style>`;
    const input = replay.querySelector<HTMLInputElement>('input')!;
    const message = replay.querySelector('[data-seed-status]')!;
    input.value = String(replaySeed);
    host.dataset.seed = String(replaySeed);
    const replayURL = () => {
      const url = new URL(location.href);
      if (url.hash.startsWith('#/games/'))
        url.hash = `/games/${module.manifest.id}?seed=${replaySeed}`;
      else url.searchParams.set('seed', String(replaySeed));
      return url;
    };
    const applySeed = () => {
      const value = Number(input.value);
      if (!input.value || !Number.isInteger(value) || value < 0 || value > 4294967295) return;
      replaySeed = value;
      host.dataset.seed = String(value);
      services.random.seed(value);
      instance.reset(value);
      history.replaceState(null, '', replayURL());
      refresh();
      message.textContent = `Seed ${value} ready. Press Start. Same seed and play settings reproduce the layout.`;
      startButton.focus({ preventScroll: true });
    };
    replay.addEventListener(
      'submit',
      (e) => {
        e.preventDefault();
        applySeed();
      },
      { signal: abort.signal },
    );
    replay.querySelector('[data-testid="new-seed"]')!.addEventListener(
      'click',
      () => {
        input.value = String(crypto.getRandomValues(new Uint32Array(1))[0]);
        applySeed();
      },
      { signal: abort.signal },
    );
    replay.querySelector('[data-testid="copy-seed"]')!.addEventListener(
      'click',
      async () => {
        const url = replayURL().href;
        try {
          await navigator.clipboard.writeText(url);
          message.textContent = `Replay link copied for seed ${replaySeed}.`;
        } catch {
          message.textContent = `Replay link: ${url}`;
        }
      },
      { signal: abort.signal },
    );
    main.querySelector('.game-toolbar')!.after(replay);
  }

  if (document.fullscreenEnabled && typeof host.requestFullscreen === 'function') {
    const fullscreenButton = document.createElement('button');
    fullscreenButton.type = 'button';
    fullscreenButton.className = 'button-link secondary-button';
    fullscreenButton.dataset.testid = 'game-fullscreen';
    fullscreenButton.textContent = 'FULLSCREEN';
    main.querySelector('.game-toolbar')!.append(fullscreenButton);
    // Include an exit control inside the fullscreen surface; the toolbar itself
    // is outside the fullscreen subtree and will no longer be visible.
    const exitFullscreenButton = document.createElement('button');
    exitFullscreenButton.type = 'button';
    exitFullscreenButton.className = 'button-link secondary-button';
    exitFullscreenButton.textContent = 'EXIT FULLSCREEN';
    exitFullscreenButton.dataset.testid = 'game-exit-fullscreen';
    exitFullscreenButton.hidden = true;
    exitFullscreenButton.style.display = 'none';
    host.prepend(exitFullscreenButton);
    let sizingFrame = 0;
    const sizeFullscreen = () => {
      sizingFrame = 0;
      if (disposed || document.fullscreenElement !== host) return;
      const canvas = host.querySelector('canvas');
      const gameRoot = host.querySelector<HTMLElement>(':scope > section');
      if (!canvas || !gameRoot) return;
      const hostStyle = getComputedStyle(host);
      const insetX = parseFloat(hostStyle.paddingLeft) + parseFloat(hostStyle.paddingRight) + 2;
      const insetY = parseFloat(hostStyle.paddingTop) + parseFloat(hostStyle.paddingBottom) + 2;
      // Measure actual HUD/control rows after fullscreen's compact layout. The
      // canvas stays at its logical resolution; only its CSS display size changes.
      const overhead = Math.max(
        0,
        gameRoot.getBoundingClientRect().height - canvas.getBoundingClientRect().height,
      );
      const availableWidth = Math.max(1, host.clientWidth - insetX);
      const availableHeight = Math.max(120, host.clientHeight - insetY - overhead - 2);
      const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
      const width = Math.floor(canvas.width * scale);
      const height = (width * canvas.height) / canvas.width;
      host.style.setProperty('--fullscreen-canvas-width', `${width}px`);
      host.style.setProperty('--fullscreen-canvas-height', `${height}px`);
    };
    const scheduleSize = () => {
      if (!sizingFrame && document.fullscreenElement === host)
        sizingFrame = requestAnimationFrame(sizeFullscreen);
    };
    const resizeObserver = new ResizeObserver(scheduleSize);
    resizeObserver.observe(host);
    const gameRoot = host.querySelector<HTMLElement>(':scope > section');
    if (gameRoot) resizeObserver.observe(gameRoot);
    window.addEventListener('resize', scheduleSize, { signal: abort.signal });
    abort.signal.addEventListener(
      'abort',
      () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(sizingFrame);
      },
      { once: true },
    );
    const changeFullscreen = () => {
      const active = document.fullscreenElement === host;
      fullscreenButton.textContent = active ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
      exitFullscreenButton.hidden = !active;
      exitFullscreenButton.style.display = active ? 'inline-flex' : 'none';
      if (active) {
        host.scrollTop = 0;
        scheduleSize();
      } else {
        host.style.removeProperty('--fullscreen-canvas-width');
        host.style.removeProperty('--fullscreen-canvas-height');
      }
      if (host.isConnected) host.focus({ preventScroll: true });
    };
    const toggleFullscreen = async () => {
      try {
        if (document.fullscreenElement === host) await document.exitFullscreen();
        else await host.requestFullscreen();
        if (host.isConnected) host.focus({ preventScroll: true });
      } catch {
        status.textContent =
          'Fullscreen is unavailable in this browser. You can continue playing here.';
      }
    };
    fullscreenButton.addEventListener(
      'click',
      () => {
        void toggleFullscreen();
      },
      { signal: abort.signal },
    );
    exitFullscreenButton.addEventListener(
      'click',
      () => {
        void toggleFullscreen();
      },
      { signal: abort.signal },
    );
    document.addEventListener('fullscreenchange', changeFullscreen, { signal: abort.signal });
  }
  let previousState = '';
  function refresh() {
    if (disposed) return;
    const state = instance.inspect?.().state ?? 'title';
    host.dataset.state = state;
    startButton.disabled = state !== 'title';
    pauseButton.disabled = state !== 'running' && state !== 'paused';
    pauseButton.textContent = state === 'paused' ? 'RESUME' : 'PAUSE';
    if (state !== previousState) {
      status.textContent = {
        title: 'Ready when you are.',
        running: '',
        paused: 'Paused. Resume when ready.',
        won: 'Complete! Restart to play again.',
        lost: 'Try again. Restart when ready.',
      }[state];
      previousState = state;
    }
  }
  function pause() {
    instance.pause();
    refresh();
  }
  const options = (module.tuning ?? []).filter((field) => playerOptions.has(field.key));
  if (options.length && instance.configure) {
    const details = document.createElement('details');
    details.className = 'game-play-options';
    details.dataset.testid = 'game-play-options';
    details.innerHTML =
      '<summary>Play options & assist modes</summary><p>Choose how you play. Apply restarts the current run and returns to the title screen.</p><form><div class="play-option-fields"></div><button class="button-link secondary-button" type="submit" data-testid="apply-play-options">APPLY & RESTART</button><p role="status" aria-live="polite" class="play-options-status"></p></form><style>.game-play-options{margin:22px 0;padding:16px;border:1px solid #52627a;color:#dce8ef;font-size:13px}.game-play-options summary{cursor:pointer;min-height:30px}.game-play-options p{font-size:12px;line-height:1.8}.play-option-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:16px;margin:16px 0}.play-option-fields label{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px}.play-option-fields select,.play-option-fields input[type=number]{min-height:44px;background:#12243b;border:1px solid #8198ae;color:#f0f5f7;padding:8px;max-width:145px}.play-option-fields input[type=checkbox]{width:24px;height:24px;accent-color:#65f4ed}.play-options-status{min-height:22px;margin-bottom:0}</style>';
    const fields = details.querySelector('.play-option-fields')!;
    const inputs = new Map<string, HTMLInputElement | HTMLSelectElement>();
    for (const option of options) {
      const label = document.createElement('label');
      const text = document.createElement('span');
      text.textContent = option.label;
      label.append(text);
      let input: HTMLInputElement | HTMLSelectElement;
      if (option.type === 'select') {
        input = document.createElement('select');
        for (const value of option.options ?? []) {
          const item = document.createElement('option');
          item.value = value;
          item.textContent = value;
          input.append(item);
        }
      } else {
        const field = document.createElement('input');
        field.type = option.type === 'boolean' ? 'checkbox' : 'number';
        if (option.type === 'number') {
          field.min = String(option.min ?? 0);
          field.max = String(option.max ?? 100);
          field.step = String(option.step ?? 'any');
        }
        input = field;
      }
      input.dataset.option = option.key;
      input.dataset.testid = `play-option-${option.key}`;
      inputs.set(option.key, input);
      label.append(input);
      fields.append(label);
    }
    function syncOptions() {
      const config = instance.inspect?.().config as Record<string, TuningValue> | undefined;
      for (const option of options) {
        const input = inputs.get(option.key)!;
        const value = config?.[option.key] ?? option.default;
        if (option.type === 'boolean') (input as HTMLInputElement).checked = Boolean(value);
        else input.value = String(value);
      }
    }
    syncOptions();
    details.addEventListener(
      'toggle',
      () => {
        if (details.open) syncOptions();
      },
      { signal: abort.signal },
    );
    details.querySelector('form')!.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        const message = details.querySelector('.play-options-status')!;
        const patch: Record<string, TuningValue> = {};
        for (const option of options) {
          const input = inputs.get(option.key)!;
          patch[option.key] =
            option.type === 'boolean'
              ? (input as HTMLInputElement).checked
              : option.type === 'number'
                ? Number(input.value)
                : input.value;
        }
        try {
          instance.configure?.(patch);
          instance.reset();
          refresh();
          message.textContent = 'Play options applied. Press Start when ready.';
          startButton.focus({ preventScroll: true });
        } catch (error) {
          message.textContent = `Could not apply options: ${error instanceof Error ? error.message : 'Choose valid values and try again.'}`;
        }
      },
      { signal: abort.signal },
    );
    main.querySelector('.game-instructions')!.before(details);
  }
  startButton.addEventListener(
    'click',
    () => {
      void services.audio.unlock();
      instance.start();
      host.focus({ preventScroll: true });
      refresh();
    },
    { signal: abort.signal },
  );
  pauseButton.addEventListener(
    'click',
    () => {
      if (instance.inspect?.().state === 'paused') {
        instance.resume();
        host.focus({ preventScroll: true });
      } else pause();
      refresh();
    },
    { signal: abort.signal },
  );
  main.querySelector('[data-testid="game-restart"]')!.addEventListener(
    'click',
    () => {
      instance.reset();
      refresh();
      startButton.focus();
    },
    { signal: abort.signal },
  );
  window.addEventListener('blur', pause, { signal: abort.signal });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) pause();
    },
    { signal: abort.signal },
  );
  host.addEventListener(
    'focusout',
    (event) => {
      if (
        !(event.relatedTarget instanceof Node) ||
        !main.querySelector('.game-page')?.contains(event.relatedTarget)
      )
        pause();
    },
    { signal: abort.signal },
  );
  host.addEventListener(
    'keydown',
    (event) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input,select,textarea,[contenteditable="true"]')
      )
        return;
      const keys = loadBindings().pause ?? ['Escape'];
      const matches = keys.some((key) =>
        [event.key.toLowerCase(), event.code.toLowerCase()].includes(key.toLowerCase()),
      );
      if (matches) {
        event.preventDefault();
        if (instance.inspect?.().state === 'paused') instance.resume();
        else pause();
        host.focus({ preventScroll: true });
        refresh();
      }
    },
    { signal: abort.signal },
  );
  if (import.meta.env.DEV) {
    const link = document.createElement('a');
    link.className = 'back-link';
    link.href = `#/workbench?game=${module.manifest.id}`;
    link.textContent = 'TUNE THIS GAME ↗';
    main.querySelector('.game-toolbar')!.append(link);
  }
  if (document.hidden) pause();
  const timer = window.setInterval(refresh, 100);
  refresh();
  document.title = `${module.manifest.title} · The People's House Arcade`;
  return () => {
    if (disposed) return;
    disposed = true;
    clearInterval(timer);
    abort.abort();
    instance.destroy();
    services.destroy();
  };
}
