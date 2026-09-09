import { getTerrain } from './terrain';
import { createMotion } from './motion';
import { drawScene } from './scene';
import type { GameInstance, GameModule, GameState } from '../../shared/contracts';
import { fitCanvas } from '../../shared/canvas';
import { defaults, tuning, validateConfig } from './config';
import {
  advance,
  createModel,
  dock,
  GOALS,
  nextDistrict,
  queueTurn,
  retry,
  share,
  setWaiting,
  type Direction,
} from './model';
export const game: GameModule = {
  manifest: {
    id: 'rio-rescue',
    title: 'Rio Rescue: No One Left Behind',
    description:
      'Guide a convoy across canyon bridges, rivers and climbable fences while avoiding scanning cameras.',
    controls: [
      'Arrows/WASD: steer',
      'Space / Q: share · X / E: wait · F: single-step practice',
      'Enter: start/resume · P/Escape: pause · R: reset run · M: mute',
      'Use the welcome center at the left edge to deliver',
      'X: wait/resume while cameras sweep · marked fence sections climb automatically',
      'River crossings drift downstream; use bridges or aim upstream. Replay a map using its seed.',
      'Score: 100 per neighbor delivered + 25 per supply delivered + 250 per district. Personal best is saved for each mode/speed.',
    ],
    assetIds: [],
  },
  tuning,
  create(host, services) {
    const root = document.createElement('section');
    root.innerHTML =
      '<p class="rio-route-help">Swim across winding rivers: current pushes you downstream · Bridges avoid drift · Climb marked fence sections · X: wait for cameras · Space: share supplies</p><p data-hud role="status" aria-live="polite"></p><canvas></canvas><p data-message></p><p data-points aria-live="polite"></p><p>Earn 100 points per neighbor delivered, 25 per supply delivered, and 250 per completed district. Retry restores the last delivery; a route jam ends the current group. Space/Q shares supplies; X/E waits; F advances single-step practice.</p><p data-board></p><div data-controls style="display:flex;flex-wrap:wrap;gap:8px"></div>';
    host.append(root);
    const canvas = root.querySelector('canvas')!;
    const { ctx } = fitCanvas(canvas, 960, 640);
    canvas.style.maxWidth = 'min(100%, 1440px, calc((100dvh - 200px) * 1.5))';
    canvas.style.touchAction = 'none';
    canvas.setAttribute(
      'aria-label',
      'Perspective canyon rescue route with bridges, river crossings, climbable fences and scanning cameras. Arrow keys steer; X waits.',
    );
    const hud = root.querySelector<HTMLElement>('[data-hud]')!,
      message = root.querySelector<HTMLElement>('[data-message]')!,
      controls = root.querySelector<HTMLElement>('[data-controls]')!;
    let config = defaults(),
      pending = { ...config },
      seed = 1,
      model = createModel(seed, config),
      state: GameState = 'title',
      destroyed = false;
    const motion = createMotion(model);
    const abort = new AbortController();
    const unsub: (() => void)[] = [];
    let lastHud = '',
      pointFeedback = '';
    let observedScore = 0,
      feedbackUntil = 0;
    const bests = new Map<string, number>();
    function button(label: string, action: () => void) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.minHeight = '44px';
      b.style.minWidth = '44px';
      b.addEventListener('click', action, { signal: abort.signal });
      controls.append(b);
      return b;
    }
    const turn = (d: Direction) => {
      if (state === 'running') queueTurn(model, d);
    };
    for (const [label, d] of [
      ['↑', 'up'],
      ['←', 'left'],
      ['↓', 'down'],
      ['→', 'right'],
    ] as const)
      button(label, () => turn(d)).setAttribute('aria-label', `Move ${d}`);
    button('Share', () => {
      if (state === 'running' && share(model)) services.audio.effect?.('pickup');
      draw();
    });
    const waitButton = button('Wait · X', () => {
      if (state === 'running') setWaiting(model, !model.waiting);
      draw();
    });
    const next = button('Next step', () => {
      if (state === 'running') stepModel(0, true);
      motion.reset(model);
      sync();
      draw();
    });
    const continueButton = button('Continue district', () => {
      nextDistrict(model);
      motion.reset(model);
      state = 'title';
      draw();
    });
    const retryButton = button('Retry group', () => {
      retry(model);
      motion.reset(model);
      state = 'title';
      draw();
    });
    function draw() {
      if (destroyed) return;
      drawScene(
        ctx,
        model,
        motion.sample(model, host.dataset.reducedMotion === 'true'),
        host.dataset.reducedMotion === 'true',
      );
      waitButton.textContent = model.waiting ? 'Continue moving · X' : 'Wait · X';
      waitButton.setAttribute('aria-pressed', String(model.waiting));
      if (state !== 'running') {
        ctx.fillStyle = '#101725dd';
        ctx.fillRect(120, 225, 720, 160);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#65f4ed';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(
          state === 'won'
            ? 'ROOM FOR EVERYONE'
            : state === 'lost'
              ? 'ROUTE JAM'
              : state === 'paused'
                ? 'PAUSED'
                : 'RIO RESCUE',
          480,
          278,
        );
        ctx.font = '13px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(
          state === 'won'
            ? 'Thirty neighbors welcomed.'
            : state === 'lost'
              ? 'Retry this group below.'
              : model.phase === 'district-complete'
                ? 'Continue district below.'
                : 'Use the host controls to start or resume.',
          480,
          325,
        );
        ctx.textAlign = 'left';
      }
      const bestKey = `best.${config.mode}.${config['assist.speedMultiplier']}`;
      let best = bests.get(bestKey) ?? services.storage.get(bestKey, 0);
      if (model.score > observedScore) {
        pointFeedback = `+${model.score - observedScore} · ${model.phase === 'district-complete' || model.phase === 'won' ? 'District completed' : 'Group welcomed'}`;
        feedbackUntil = model.monotonic + 3;
        if (model.score > best) {
          best = model.score;
          services.storage.set(bestKey, best);
        }
      }
      observedScore = model.score;
      bests.set(bestKey, best);
      root.querySelector('[data-points]')!.textContent =
        model.monotonic < feedbackUntil ? pointFeedback : '';
      const text = `District ${model.district + 1}/3 · Welcomed ${model.banked}/${GOALS[model.district]} · Aboard ${model.aboard} · Score ${model.score} · Best ${best} · Center ${model.dockOpen ? 'OPEN' : 'opens after 3 pickups'}`;
      if (text !== lastHud) {
        hud.textContent = text;
        lastHud = text;
      }
      message.textContent = model.message;
      root.querySelector('[data-board]')!.textContent =
        `Leader: column ${model.body[0].x}, row ${model.body[0].y}. ${model.pickup ? `Next neighbor: column ${model.pickup.x}, row ${model.pickup.y}. ` : ''}Welcome center: column 1, row 8.${model.hazard ? ` ${model.hazard.kind === 'float' ? 'Photo-op float' : 'Red tape'} ${model.hazard.phase}, ${Math.ceil(model.hazard.remaining)} seconds.` : ''}`;
      next.hidden = config.mode !== 'single-step';
      continueButton.hidden = model.phase !== 'district-complete';
      retryButton.hidden = state !== 'lost';
      controls.style.flexDirection = config['presentation.leftHanded'] ? 'row-reverse' : 'row';
    }
    function stepModel(dt: number, force = false) {
      const before = {
        x: model.body[0].x,
        y: model.body[0].y,
        aboard: model.aboard,
        score: model.score,
        phase: model.phase,
      };
      advance(model, dt, force);
      if (model.phase === 'jam' && before.phase !== 'jam') services.audio.effect?.('crash');
      else if (model.score > before.score) services.audio.effect?.('delivery');
      else if (model.aboard > before.aboard) services.audio.effect?.('rescue');
      else if (before.x !== model.body[0].x || before.y !== model.body[0].y)
        services.audio.effect?.(
          getTerrain(model.district, model.body[0].x, model.body[0].y, model.seed) === 'river'
            ? 'water'
            : 'step',
        );
    }
    function sync() {
      const before = state;
      if (model.phase === 'won') {
        state = 'won';
        services.clock.pause();
        const scoreKey = `best.${config.mode}.${config['assist.speedMultiplier']}`;
        services.storage.set(scoreKey, Math.max(services.storage.get(scoreKey, 0), model.score));
      } else if (model.phase === 'jam') {
        state = 'lost';
        services.clock.pause();
      } else if (model.phase === 'district-complete') {
        state = 'paused';
        services.clock.pause();
      } else if (model.phase === 'ready' && state === 'running') {
        state = 'title';
        services.clock.pause();
      }
      if (before !== state) draw();
    }
    services.input.bind({
      up: ['ArrowUp', 'KeyW'],
      down: ['ArrowDown', 'KeyS'],
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      share: ['Space', 'KeyQ'],
      wait: ['KeyX', 'KeyE'],
      step: ['KeyF'],
      pause: ['KeyP', 'Escape'],
      restart: ['KeyR'],
      mute: ['KeyM'],
      start: ['Enter'],
    });
    for (const d of ['up', 'down', 'left', 'right'] as const)
      unsub.push(services.input.on(d, () => turn(d)));
    unsub.push(
      services.input.on('share', () => {
        if (state === 'running' && share(model)) services.audio.effect?.('pickup');
      }),
    );
    unsub.push(
      services.input.on('wait', () => {
        if (state === 'running') setWaiting(model, !model.waiting);
        draw();
      }),
    );
    unsub.push(
      services.input.on('step', () => {
        if (state === 'running' && config.mode === 'single-step') {
          stepModel(0, true);
          motion.reset(model);
          sync();
          draw();
        }
      }),
    );
    let muted = host.dataset.muted !== 'false';
    const soundButton = button(muted ? 'Sound off · M' : 'Sound on · M', toggleMute);
    function toggleMute() {
      muted = !muted;
      services.audio.setMuted(muted);
      soundButton.textContent = muted ? 'Sound off · M' : 'Sound on · M';
    }
    unsub.push(
      services.input.on('pause', () => (state === 'paused' ? instance.resume() : instance.pause())),
      services.input.on('restart', () => instance.reset()),
      services.input.on('mute', toggleMute),
      services.input.on('start', () => (state === 'paused' ? instance.resume() : instance.start())),
    );
    let touch: { x: number; y: number } | null = null;
    canvas.addEventListener(
      'pointerdown',
      (e) => {
        touch = { x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      },
      { signal: abort.signal },
    );
    canvas.addEventListener(
      'pointerup',
      (e) => {
        if (!touch) return;
        const dx = e.clientX - touch.x,
          dy = e.clientY - touch.y;
        touch = null;
        if (Math.hypot(dx, dy) > 12)
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      },
      { signal: abort.signal },
    );
    canvas.addEventListener(
      'pointercancel',
      () => {
        touch = null;
      },
      { signal: abort.signal },
    );
    draw();
    const instance: GameInstance = {
      start() {
        if (destroyed || state !== 'title') return;
        model.phase = 'playing';
        state = 'running';
        services.clock.start((dt) => {
          stepModel(dt);
          motion.update(model);
          sync();
        }, draw);
      },
      pause() {
        if (state === 'running') {
          state = 'paused';
          model.queue = [];
          touch = null;
          services.clock.pause();
          services.input.clear();
          draw();
        }
      },
      resume() {
        if (state === 'paused' && model.phase !== 'district-complete') {
          state = 'running';
          model.queue = [];
          touch = null;
          services.clock.resume();
          draw();
        }
      },
      reset(nextSeed = seed) {
        seed = nextSeed;
        config = { ...pending };
        model = createModel(seed, config);
        observedScore = 0;
        pointFeedback = '';
        feedbackUntil = 0;
        motion.reset(model);
        state = 'title';
        touch = null;
        services.clock.pause();
        services.clock.reset();
        services.input.clear();
        draw();
      },
      configure(patch) {
        const nextConfig = validateConfig(pending, patch);
        pending = nextConfig;
        for (const f of tuning)
          if (!f.restart && f.key in patch) {
            config[f.key] = nextConfig[f.key];
            model.config[f.key] = nextConfig[f.key];
          }
        draw();
      },
      inspect: () => ({
        state,
        time: services.clock.time,
        fps: services.clock.fps,
        district: model.district + 1,
        score: model.score,
        progress: model.banked,
        goal: GOALS[model.district],
        convoyLength: model.body.length,
        waiting: model.waiting,
        cameraAlerts: [...model.cameraAlerts],
        aboard: model.aboard,
        seed,
        mode: config.mode,
        tickAccumulator: model.acc,
        event: model.hazard,
        config: { ...config },
        pendingConfig: { ...pending },
      }),
      destroy() {
        if (destroyed) return;
        destroyed = true;
        abort.abort();
        unsub.forEach((fn) => fn());
        services.clock.pause();
        root.remove();
      },
    };
    return instance;
  },
};
