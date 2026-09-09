import { games, isPlayable, loadGame } from '../games/registry';
import type {
  GameInstance,
  GameModule,
  GameServices,
  Settings,
  TuningValue,
} from '../shared/contracts';
import { createServices } from '../shared/services';
import { createStorage } from '../shared/storage';
import { loadBindings } from '../shared/input';
import { diagnostic } from './diagnostic';
import './workbench.css';

const store = createStorage('workbench');
let reloadActive: ((module: GameModule) => void) | undefined;
if (import.meta.hot)
  import.meta.hot.accept('./diagnostic', (module) => {
    if (module) reloadActive?.(module.diagnostic);
  });

export async function mountWorkbench(
  main: HTMLElement,
  settings: Settings,
  initialId = 'diagnostic',
  signal?: AbortSignal,
): Promise<() => void> {
  const defaults = (module: GameModule) =>
    Object.fromEntries(
      (module.tuning ?? []).map((field) => [
        field.key,
        field.key.endsWith('reducedMotion') ? settings.reducedMotion : field.default,
      ]),
    );
  let currentModule =
    initialId !== 'diagnostic' && isPlayable(initialId) ? await loadGame(initialId) : diagnostic;
  if (signal?.aborted) return () => {};
  let instance: GameInstance | undefined;
  let services: GameServices | undefined;
  let disposed = false;
  let generation = 0;
  let config: Record<string, TuningValue> = {};
  const abort = new AbortController();
  main.innerHTML = `<section class="page-section workbench-page"><a href="#/" class="back-link">← BACK TO THE ARCADE</a><div class="workbench-header"><div><p class="eyebrow">THE DEVELOPER WORKBENCH</p><h1>Turn a dial. See it change.</h1><p>Shared runtime testing with live tuning, repeatable seeds and clean hot reload.</p></div><span class="workbench-label">DEVELOPMENT ONLY</span></div><div class="workbench-layout"><div><div class="diagnostic-host" data-game-id="diagnostic" tabindex="0"></div><p class="diagnostic-caption">A moving shape, not a game prototype. Focus the canvas and press Space to pause. Switching tabs pauses the runtime; resume when ready.</p><section class="diagnostic-inspection" aria-label="Runtime inspection"><h2>LIVE INSPECTION</h2><dl><div><dt>STATE</dt><dd data-testid="diagnostic-state">loading</dd></div><div><dt>SIMULATION</dt><dd data-testid="diagnostic-time">0.00 s</dd></div><div><dt>FRAME RATE</dt><dd data-testid="diagnostic-fps">0 fps</dd></div><div><dt>POSITION</dt><dd data-testid="diagnostic-position">—</dd></div></dl></section><p class="workbench-notice" role="status" aria-live="polite">Loading the shared runtime…</p><pre class="workbench-json" aria-label="Exported tuning JSON"></pre></div><aside class="tuning-panel" data-testid="tuning-panel" aria-label="Developer tuning panel"><h2>CONTROL ROOM</h2><label for="module-selector">Module / game</label><select id="module-selector"><option value="diagnostic">Runtime diagnostic</option>${games.map((game) => `<option value="${game.id}" ${isPlayable(game.id) ? '' : 'disabled'}>${game.title}${isPlayable(game.id) ? '' : ' — in development'}</option>`).join('')}</select><p class="workbench-select-note">Game controls join this panel when their modules are implemented.</p><label for="seed-input">Deterministic seed</label><input id="seed-input" data-testid="seed-input" type="number" min="0" max="4294967295" step="1" value="1"><div class="workbench-buttons"><button data-testid="pause-button" type="button">PAUSE</button><button data-testid="reset-button" type="button">RESTART</button></div><div class="tuning-fields"></div><button type="button" class="workbench-defaults">Reset tuning defaults</button><div class="workbench-panel-footer"><button type="button" class="workbench-export" data-testid="export-button">EXPORT TUNING JSON ↓</button><p class="workbench-log">Values apply immediately. Restart uses the seed above. Export saves a local JSON file.</p></div></aside></div></section>`;
  const host = main.querySelector<HTMLElement>('.diagnostic-host')!;
  const notice = main.querySelector<HTMLElement>('.workbench-notice')!;
  const seedInput = main.querySelector<HTMLInputElement>('#seed-input')!;
  const seed = () => Math.max(0, Math.min(4294967295, Math.floor(Number(seedInput.value) || 0)));
  const pauseButton = main.querySelector<HTMLButtonElement>('[data-testid="pause-button"]')!;
  const fieldHost = main.querySelector<HTMLElement>('.tuning-fields')!;
  const pauseKey = loadBindings().pause?.[0] ?? 'Space';
  main.querySelector('.diagnostic-caption')!.textContent =
    currentModule.manifest.id === 'diagnostic'
      ? `A moving shape, not a game prototype. Focus the canvas and press ${pauseKey} to pause. Switching tabs pauses the runtime; resume when ready.`
      : `${currentModule.manifest.title}: ${currentModule.manifest.controls.join(' · ')}`;
  function updateInspection() {
    if (!instance?.inspect || disposed) return;
    const data = instance.inspect();
    services?.audio.setActive?.(data.state === 'running');
    main.querySelector('[data-testid="diagnostic-state"]')!.textContent = data.state;
    main.querySelector('[data-testid="diagnostic-time"]')!.textContent =
      `${data.time.toFixed(2)} s`;
    main.querySelector('[data-testid="diagnostic-fps"]')!.textContent =
      `${Math.round(data.fps)} fps`;
    main.querySelector('[data-testid="diagnostic-position"]')!.textContent =
      currentModule.manifest.id === 'diagnostic'
        ? `${Number(data.x ?? 0).toFixed(1)}, ${Number(data.y ?? 0).toFixed(1)}`
        : `Score ${data.score ?? '—'} · ${data.phase ?? data.progress ?? data.state}`;
    pauseButton.textContent = data.state === 'paused' ? 'RESUME' : 'PAUSE';
  }
  function renderFields() {
    fieldHost.innerHTML = (currentModule.tuning ?? [])
      .map((field) => {
        const value = config[field.key] ?? field.default;
        if (field.type === 'boolean')
          return `<label class="tuning-boolean" for="tuning-${field.key}">${field.label}<input type="checkbox" id="tuning-${field.key}" data-testid="tuning-${field.key}" data-key="${field.key}" ${value ? 'checked' : ''}></label>`;
        if (field.type === 'select')
          return `<label for="tuning-${field.key}">${field.label}</label><select id="tuning-${field.key}" data-testid="tuning-${field.key}" data-key="${field.key}">${(field.options ?? []).map((option) => `<option ${value === option ? 'selected' : ''}>${option}</option>`).join('')}</select>`;
        return `<div class="tuning-field-heading"><label for="tuning-${field.key}">${field.label}</label><output for="tuning-${field.key}" data-output="${field.key}">${value}</output></div><input type="range" id="tuning-${field.key}" data-testid="tuning-${field.key}" data-key="${field.key}" min="${field.min}" max="${field.max}" step="${field.step ?? 1}" value="${value}">`;
      })
      .join('');
  }
  async function mount(module: GameModule, message: string) {
    const ticket = ++generation;
    instance?.destroy();
    services?.destroy();
    instance = undefined;
    services = undefined;
    host.replaceChildren();
    currentModule = module;
    host.dataset.gameId = module.manifest.id;
    host.dataset.reducedMotion = String(settings.reducedMotion);
    host.dataset.muted = String(settings.muted);
    main.querySelector<HTMLSelectElement>('#module-selector')!.value = module.manifest.id;
    const saved = store.get<Record<string, TuningValue> | null>(
      module.manifest.id + '.config',
      null,
    );
    config = defaults(module);
    if (saved && typeof saved === 'object')
      for (const field of module.tuning ?? []) {
        const value = saved[field.key];
        if (field.type === 'number' && typeof value === 'number' && Number.isFinite(value))
          config[field.key] = Math.max(
            field.min ?? -Infinity,
            Math.min(field.max ?? Infinity, value),
          );
        if (field.type === 'boolean' && typeof value === 'boolean') config[field.key] = value;
        if (field.type === 'select' && typeof value === 'string' && field.options?.includes(value))
          config[field.key] = value;
      }
    renderFields();
    let nextServices: GameServices | undefined;
    try {
      host.dataset.gameId = module.manifest.id;
      nextServices = createServices(host, seed());
      services = nextServices;
      nextServices.audio.setMuted(settings.muted);
      nextServices.audio.setVolume(settings.volume);
      const nextInstance = await module.create(host, nextServices);
      if (disposed || signal?.aborted || ticket !== generation) {
        nextInstance.destroy();
        nextServices.destroy();
        return;
      }
      instance = nextInstance;
      try {
        instance.configure?.(config);
      } catch {
        config = defaults(module);
        instance.configure?.(config);
        store.remove(module.manifest.id + '.config');
        renderFields();
        message = 'Saved tuning was incompatible; restored defaults.';
      }
      instance.reset(seed());
      instance.start();
      if (document.hidden) instance.pause();
      notice.textContent = message;
      updateInspection();
    } catch (error) {
      nextServices?.destroy();
      if (disposed || signal?.aborted || ticket !== generation) return;
      instance?.destroy();
      instance = undefined;
      services = undefined;
      host.innerHTML =
        '<div class="workbench-error"><p>Could not start this module.</p><button type="button">Retry</button></div>';
      host.querySelector('button')!.addEventListener(
        'click',
        () => {
          void mount(currentModule, 'Runtime recovered.');
        },
        { once: true },
      );
      notice.textContent =
        error instanceof Error ? error.message : 'An unexpected runtime error occurred.';
    }
  }
  fieldHost.addEventListener(
    'input',
    (event) => {
      const input = event.target as HTMLInputElement | HTMLSelectElement;
      const key = input.dataset.key;
      if (!key) return;
      const field = currentModule.tuning?.find((item) => item.key === key);
      if (!field) return;
      const value =
        field.type === 'number'
          ? Number(input.value)
          : field.type === 'boolean'
            ? (input as HTMLInputElement).checked
            : input.value;
      if (
        field.type === 'number' &&
        (typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < (field.min ?? -Infinity) ||
          value > (field.max ?? Infinity))
      ) {
        notice.textContent = `Invalid ${field.label.toLowerCase()} value.`;
        renderFields();
        return;
      }
      try {
        instance?.configure?.({ [key]: value });
      } catch (error) {
        notice.textContent = `Tuning rejected: ${error instanceof Error ? error.message : 'Unexpected configuration error.'}`;
        renderFields();
        return;
      }
      config[key] = value;
      store.set(currentModule.manifest.id + '.config', config);
      const output = fieldHost.querySelector(`[data-output="${key}"]`);
      if (output) output.textContent = String(config[key]);
      notice.textContent = `${field.label} updated. ${field.restart ? 'Restart to apply this value.' : 'Applied to the live module.'}`;
    },
    { signal: abort.signal },
  );
  pauseButton.addEventListener(
    'click',
    () => {
      if (instance?.inspect?.().state === 'paused') instance.resume();
      else instance?.pause();
      updateInspection();
    },
    { signal: abort.signal },
  );
  main.querySelector('[data-testid="reset-button"]')!.addEventListener(
    'click',
    () => {
      seedInput.value = String(seed());
      instance?.reset(seed());
      if (instance?.inspect?.().state === 'paused') instance.resume();
      else if (instance?.inspect?.().state === 'title') instance.start();
      notice.textContent = `Restarted with seed ${seed()}.`;
      updateInspection();
    },
    { signal: abort.signal },
  );
  main.querySelector('.workbench-defaults')!.addEventListener(
    'click',
    () => {
      const next = defaults(currentModule);
      try {
        instance?.configure?.(next);
      } catch (error) {
        notice.textContent = `Could not restore defaults: ${error instanceof Error ? error.message : 'Unexpected configuration error.'}`;
        return;
      }
      config = next;
      store.remove(currentModule.manifest.id + '.config');
      renderFields();
      notice.textContent = 'Default tuning restored.';
    },
    { signal: abort.signal },
  );
  main.querySelector('[data-testid="export-button"]')!.addEventListener(
    'click',
    () => {
      const json = JSON.stringify(
        { schemaVersion: 1, module: currentModule.manifest.id, seed: seed(), tuning: config },
        null,
        2,
      );
      main.querySelector('.workbench-json')!.textContent = json;
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentModule.manifest.id}-tuning.json`;
      link.click();
      URL.revokeObjectURL(url);
      notice.textContent = 'Tuning JSON exported. A copy is displayed below the inspection panel.';
    },
    { signal: abort.signal },
  );
  const autoPause = () => {
    instance?.pause();
    updateInspection();
  };
  window.addEventListener('blur', autoPause, { signal: abort.signal });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) autoPause();
    },
    { signal: abort.signal },
  );
  const updateTimer = window.setInterval(updateInspection, 150);
  main.querySelector('#module-selector')!.addEventListener(
    'change',
    async (event) => {
      const id = (event.target as HTMLSelectElement).value;
      // Route navigation gives each asynchronous factory an isolated lifetime.
      location.hash = `#/workbench?game=${id}`;
    },
    { signal: abort.signal },
  );
  await mount(currentModule, 'Runtime ready. Tune a value or restart with a different seed.');
  const reload = (module: GameModule) => {
    if (!disposed && currentModule.manifest.id === 'diagnostic')
      void mount(
        module,
        'Hot reload: diagnostic remounted. The previous run was disposed; tuning retained.',
      );
  };
  reloadActive = reload;
  return () => {
    disposed = true;
    generation++;
    if (reloadActive === reload) reloadActive = undefined;
    abort.abort();
    clearInterval(updateTimer);
    instance?.destroy();
    services?.destroy();
  };
}
