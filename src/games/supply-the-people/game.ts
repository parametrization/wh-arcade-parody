import type { GameInstance, GameServices, GameState, TuningValue } from '../../shared/contracts';
import { fitCanvas } from '../../shared/canvas';
import { loadBindings } from '../../shared/input';
import { defaults, validateConfig } from './config';
import {
  createModel,
  cycleGate,
  destinations,
  operatorNames,
  materialNames,
  supplierNames,
  lockGate,
  ringBell,
  startModel,
  stripCrate,
  tick,
  upgrade,
  type Destination,
} from './model';
import { render } from './render';
import { hitTarget } from './hit-test';
import { WIDTH, HEIGHT } from './layout';

export function createGame(host: HTMLElement, services: GameServices): GameInstance {
  let config = { ...defaults },
    pending = { ...defaults },
    model = createModel(),
    paused = false,
    dead = false,
    lane: Destination = 0,
    seed = 1,
    lastPhase = '',
    lastMessage = '',
    lastItems = '',
    lastControls = '',
    lastScoreText = '',
    lastAnnounced = 0,
    observedScore = 0,
    feedback = '',
    feedbackTime = 0,
    unlocked = services.storage.get('endlessUnlocked', false);
  const section = document.createElement('section');
  section.className = 'supply-game';
  section.innerHTML = `<style>.supply-game{color:#e5edf1;font:13px Arial,sans-serif}.supply-game button{min-height:44px;padding:10px 13px;border:1px solid #69918f;background:#1c3449;color:#e6ffed;cursor:pointer;font:12px monospace}.supply-game button:disabled{opacity:.45;cursor:default}.supply-game .supply-controls{display:flex;flex-wrap:wrap;gap:8px;padding:12px 0}.supply-game .supply-controls label{display:flex;align-items:center;gap:6px}.supply-game .supply-crates{display:flex;gap:7px;flex-wrap:wrap;padding-bottom:10px}.supply-game .supply-crates button{font-size:11px}.supply-game p{line-height:1.7}.supply-game .supply-message{min-height:24px;color:#c3eadb}.supply-game .supply-upgrades{padding:15px;border:1px solid #a48d65;background:#283343}.supply-game .supply-upgrades[hidden]{display:none}</style><canvas aria-label="Three fictional warehouse operators collect cargo from four trucks and load their own conveyor lanes. Use the labeled crate and gate buttons below to play." role="img"></canvas><div class="supply-controls"><button data-lane="0">Lane 1: Pharmacy △</button><button data-lane="1">Lane 2: Housing ⌂</button><button data-lane="2">Lane 3: Medical +</button><button data-bell>Dispatch bell (B)</button><button data-lock>Lock selected gate</button><button data-step hidden>Advance 1 second</button></div><div class="supply-crates" aria-label="Crates on the conveyor"></div><div class="supply-upgrades" hidden><p>Shift complete. Pick one cooperative upgrade:</p><div class="supply-controls"><button data-upgrade="handling">Longer handling window · 12 extra belt units</button><button data-upgrade="recovery">Recovery bin · saves 6 more misrouted crates</button><button data-upgrade="bell">Longer slowdown · bell lasts 2 more seconds</button></div></div><p class="supply-message" role="status" aria-live="polite"></p><p class="supply-help">Tap gold crates to remove markups; tap a lane gate to change its destination. Arrows select a lane; Space strips its leading sleeve or locks a rerouting gate. 1/2/3 cycle gates, B rings the bell. Untimed practice is available in tuning and advances only when you press its step button.</p><p style="font-size:10px;color:#a4b3c7">Fictional operators and suppliers. Gold coatings represent in-game surcharges; no real person or company is depicted.</p>`;
  const loadingInfo = document.createElement('p');
  loadingInfo.className = 'supply-loading';
  loadingInfo.setAttribute('aria-live', 'polite');
  loadingInfo.setAttribute('aria-label', 'Loading announcements');
  section.querySelector('canvas')!.after(loadingInfo);
  const scoreInfo = document.createElement('p');
  scoreInfo.className = 'supply-score';
  scoreInfo.setAttribute('aria-live', 'polite');
  section.append(scoreInfo);
  host.append(section);
  const canvas = section.querySelector('canvas')!;
  const viewport = fitCanvas(canvas, WIDTH, HEIGHT);
  const abort = new AbortController();
  const crateHost = section.querySelector<HTMLElement>('.supply-crates')!;
  const bindings = loadBindings(),
    actionKey = bindings.action?.join(' / ') ?? 'Space',
    bellKey = bindings.bell?.join(' / ') ?? 'B';
  section.querySelector('.supply-help')!.textContent =
    `Deliver at least 36 crates, including eight to each destination, across three shifts. Each operator announces a material, collects it from a supplier truck and loads their own belt. Strip costly sleeves, match gate symbols, and preserve the budget; a zero budget ends the run. Tap gold crates or their buttons; tap a lane gate to cycle it. W/S or arrows select a lane (or your saved bindings); E or ${actionKey} strips its leading gold coating or locks a rerouting gate. 1/2/3 cycle gates; Q or ${bellKey} rings the dispatch bell to slow the belts and clear processing disruptions. Untimed practice advances only when you press its step button.`;
  const endlessButton = document.createElement('button');
  endlessButton.textContent = 'Play unlocked endless mode';
  endlessButton.dataset.endless = '';
  section.querySelector('.supply-controls')!.append(endlessButton);
  const crateButtons = new Map<number, HTMLButtonElement>();
  function ui() {
    const newest = model.loadingJobs.reduce<(typeof model.loadingJobs)[number] | undefined>(
      (latest, job) => (!latest || job.id > latest.id ? job : latest),
      undefined,
    );
    if (newest && newest.id > lastAnnounced) {
      lastAnnounced = newest.id;
      loadingInfo.textContent = `${operatorNames[newest.lane]}: next, ${materialNames[newest.destination]}, from ${supplierNames[newest.truck]}${newest.sleeve ? ' — remove the gold coating before delivery.' : '.'}`;
    }
    if (model.score !== observedScore) {
      const gained = model.score - observedScore;
      if (gained > 0) {
        feedback = `+${gained} points`;
        feedbackTime = 1.8;
        services.audio.effect?.('score');
      } else {
        feedback = '';
        feedbackTime = 0;
      }
      observedScore = model.score;
    }

    const scoreText = `Score ${model.score} · Best ${services.storage.get('best.' + (config.practice ? 'practice' : config.mode), 0)} · Strip +5 · Correct delivery +10 · Balanced set +20. Gold left on costs 8 budget; misroutes cost 4 budget. Best saves when a run ends.`;
    if (scoreText !== lastScoreText) {
      scoreInfo.textContent = scoreText;
      lastScoreText = scoreText;
    }
    const controlKey = `${model.phase}|${paused}|${lane}|${model.gates.join(',')}|${model.bells}|${config.practice}|${unlocked}`;
    if (controlKey !== lastControls) {
      lastControls = controlKey;
      endlessButton.hidden =
        !unlocked || (model.phase !== 'title' && model.phase !== 'won' && model.phase !== 'lost');
      section.querySelectorAll<HTMLButtonElement>('[data-lane]').forEach((button) => {
        const row = Number(button.dataset.lane);
        button.textContent = `${row === lane ? '▸ ' : ''}Lane ${row + 1}: ${destinations[model.gates[row]]}`;
        button.disabled = model.phase !== 'shift' || paused;
      });
      const bell = section.querySelector<HTMLButtonElement>('[data-bell]')!;
      bell.textContent = `Dispatch bell (${bellKey}) · ${model.bells}`;
      bell.disabled = model.bells === 0 || model.phase !== 'shift' || paused;
      const lock = section.querySelector<HTMLButtonElement>('[data-lock]')!;
      lock.disabled = model.phase !== 'shift' || paused;
      lock.textContent = `Lock lane ${lane + 1} gate`;
      section.querySelector<HTMLButtonElement>('[data-step]')!.hidden = !config.practice;
      section.querySelector<HTMLButtonElement>('[data-step]')!.disabled =
        model.phase !== 'shift' || paused;
      (section.querySelector('.supply-upgrades') as HTMLElement).hidden = model.phase !== 'upgrade';
    }
    const items =
      `${paused}|${model.phase}|` +
      model.crates.map((item) => `${item.id}:${item.sleeve}`).join(',');
    if (items !== lastItems) {
      lastItems = items;
      const liveIds = new Set(model.crates.map((crate) => crate.id));
      for (const [id, button] of crateButtons) {
        if (!liveIds.has(id)) {
          if (document.activeElement === button) host.focus({ preventScroll: true });
          button.remove();
          crateButtons.delete(id);
        }
      }
      for (const crate of model.crates) {
        let button = crateButtons.get(crate.id);
        if (!button) {
          button = document.createElement('button');
          button.dataset.crate = String(crate.id);
          crateButtons.set(crate.id, button);
          crateHost.append(button);
        }
        const text = `Lane ${crate.lane + 1} ${destinations[crate.destination]} · ${crate.sleeve ? 'Remove gold: +5 points, avoid 8 budget charge' : 'Unwrapped ✓'}`;
        if (button.textContent !== text) button.textContent = text;
        const disabled = !crate.sleeve || paused || model.phase !== 'shift';
        if (disabled && document.activeElement === button) host.focus({ preventScroll: true });
        if (button.disabled !== disabled) button.disabled = disabled;
      }
    }
    if (model.message !== lastMessage) {
      lastMessage = model.message;
      section.querySelector('.supply-message')!.textContent = model.message;
    }
    if (model.phase !== lastPhase) {
      lastPhase = model.phase;
      if (model.phase === 'won' || model.phase === 'lost') {
        const key = `best.${config.practice ? 'practice' : config.mode}`;
        services.storage.set(key, Math.max(model.score, services.storage.get(key, 0)));
        if (model.phase === 'won') {
          services.storage.set('endlessUnlocked', true);
          unlocked = true;
          endlessButton.hidden = false;
        }
        services.clock.pause();
      }
    }
  }
  function draw() {
    if (dead) return;
    render(
      viewport.ctx,
      model,
      config,
      lane,
      host.dataset.reducedMotion === 'true',
      feedbackTime > 0 ? feedback : '',
    );
    ui();
  }
  function step(dt: number) {
    if (!paused && model.phase === 'shift') {
      feedbackTime = Math.max(0, feedbackTime - dt);
      const crateIds = new Set(model.crates.map((crate) => crate.id));
      const delivered = model.delivered.reduce((a, b) => a + b, 0),
        budget = model.budget;
      tick(model, dt, config, () => services.random.next());
      if (model.crates.some((crate) => !crateIds.has(crate.id))) services.audio.effect?.('build');
      if (model.delivered.reduce((a, b) => a + b, 0) > delivered)
        services.audio.effect?.('delivery');
      else if (model.budget < budget) services.audio.effect?.('crash');
    }
  }
  function action() {
    if (paused || model.phase !== 'shift') return;
    const crate = model.crates
      .filter((item) => item.lane === lane && item.sleeve)
      .sort((a, b) => b.x - a.x)[0];
    if (crate) {
      stripCrate(model, crate.id);
      services.audio.effect?.('pickup');
    } else lockGate(model, lane);
    draw();
  }
  services.input.bind({
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    action: ['Space', 'KeyE'],
    gate1: ['Digit1'],
    gate2: ['Digit2'],
    gate3: ['Digit3'],
    bell: ['KeyB', 'KeyQ'],
  });
  const off = [
    services.input.on('left', () => {
      lane = ((lane + 2) % 3) as Destination;
      draw();
    }),
    services.input.on('up', () => {
      lane = ((lane + 2) % 3) as Destination;
      draw();
    }),
    services.input.on('right', () => {
      lane = ((lane + 1) % 3) as Destination;
      draw();
    }),
    services.input.on('down', () => {
      lane = ((lane + 1) % 3) as Destination;
      draw();
    }),
    services.input.on('action', action),
    services.input.on('bell', () => {
      if (!paused) ringBell(model);
      draw();
    }),
  ];
  for (let i = 0; i < 3; i++)
    off.push(
      services.input.on(`gate${i + 1}`, () => {
        if (!paused) cycleGate(model, i as Destination);
        draw();
      }),
    );
  section.addEventListener(
    'click',
    (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || paused) return;
      void services.audio.unlock();
      if (button.dataset.lane !== undefined) {
        lane = Number(button.dataset.lane) as Destination;
        cycleGate(model, lane);
      }
      if (button.dataset.crate && stripCrate(model, Number(button.dataset.crate)))
        services.audio.effect?.('pickup');
      if (button.hasAttribute('data-bell')) ringBell(model);
      if (button.hasAttribute('data-lock')) lockGate(model, lane);
      if (button.hasAttribute('data-step')) step(1);
      if (button.dataset.upgrade && model.phase === 'upgrade') {
        upgrade(model, button.dataset.upgrade as 'handling' | 'recovery' | 'bell');
        services.audio.effect?.('build');
      }
      if (button.hasAttribute('data-endless') && services.storage.get('endlessUnlocked', false)) {
        services.clock.pause();
        services.clock.reset();
        services.random.seed(seed);
        pending = { ...pending, mode: 'endless' };
        config = { ...pending };
        model = createModel(config.practice, true);
        lastAnnounced = 0;
        observedScore = 0;
        feedback = '';
        feedbackTime = 0;
        loadingInfo.textContent = 'Operators announce each load before collecting it.';
        lastItems = '';
        lastPhase = '';
        startModel(model);
        services.clock.start((dt) => {
          if (!config.practice) step(dt);
        }, draw);
      }
      draw();
    },
    { signal: abort.signal },
  );
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (paused || model.phase !== 'shift') return;
      const point = viewport.toGame(event.clientX, event.clientY);
      const hit = hitTarget(model.crates, point.x, point.y);
      if (!hit) return;
      lane = hit.lane;
      if (hit.kind === 'gate') cycleGate(model, lane);
      else if (stripCrate(model, hit.id)) services.audio.effect?.('pickup');
      draw();
    },
    { signal: abort.signal },
  );
  const state = (): GameState =>
    paused
      ? 'paused'
      : model.phase === 'title'
        ? 'title'
        : model.phase === 'won'
          ? 'won'
          : model.phase === 'lost'
            ? 'lost'
            : 'running';
  draw();
  return {
    start() {
      if (dead) return;
      if (model.phase === 'title') startModel(model);
      else if (model.phase === 'won' || model.phase === 'lost') return;
      paused = false;
      void services.audio.unlock();
      services.clock.start((dt) => {
        if (!config.practice) step(dt);
      }, draw);
      draw();
    },
    pause() {
      if (state() !== 'running') return;
      paused = true;
      services.clock.pause();
      lastItems = '';
      draw();
    },
    resume() {
      if (!paused || dead) return;
      paused = false;
      services.clock.resume();
      lastItems = '';
      draw();
    },
    reset(nextSeed = seed) {
      seed = nextSeed >>> 0;
      services.clock.pause();
      services.clock.reset();
      services.random.seed(seed);
      config = { ...pending };
      model = createModel(config.practice, config.mode === 'endless');
      lastAnnounced = 0;
      loadingInfo.textContent = 'Operators announce each load before collecting it.';
      observedScore = 0;
      feedback = '';
      feedbackTime = 0;
      paused = false;
      lane = 0;
      lastItems = '';
      lastPhase = '';
      draw();
    },
    configure(patch: Record<string, TuningValue>) {
      const next = validateConfig(pending, patch);
      if (next.mode === 'endless' && !services.storage.get('endlessUnlocked', false))
        throw new Error('Complete the campaign to unlock endless mode.');
      pending = next;
      config = { ...config, speed: next.speed, variant: next.variant };
      if (model.phase === 'title') {
        config = { ...next };
        model.practice = config.practice;
        model.endless = config.mode === 'endless';
      }
      draw();
    },
    inspect: () => ({
      state: state(),
      time: model.time,
      fps: services.clock.fps,
      score: model.score,
      progress: model.delivered.reduce((a, b) => a + b, 0),
      shift: model.shift,
      budget: model.budget,
      delivered: [...model.delivered],
      phase: model.phase,
      bells: model.bells,
      crates: model.crates.map((item) => ({ ...item })),
      loadingJobs: model.loadingJobs.map((job) => ({ ...job })),
      gates: [...model.gates],
      seed,
      config: { ...config },
      pending: { ...pending },
    }),
    destroy() {
      dead = true;
      abort.abort();
      off.forEach((dispose) => dispose());
      services.clock.destroy();
      section.remove();
    },
  };
}
