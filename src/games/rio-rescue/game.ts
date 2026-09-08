import { createMotion } from './motion';
import { drawPerson, drawGround, drawObstacle, drawDock, drawSupply } from './render';
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
  walls,
  type Direction,
} from './model';
export const game: GameModule = {
  manifest: {
    id: 'rio-rescue',
    title: 'Rio Rescue: No One Left Behind',
    description:
      'Lead a growing convoy to the welcome center. Share supplies and outmaneuver political photo ops.',
    controls: [
      'Arrows/WASD: steer',
      'Space: share',
      'Enter: start/resume · P/Escape: pause · R: reset run · M: mute',
      'Use the welcome center at the left edge to deliver',
      'Practice: Next step',
    ],
    assetIds: [],
  },
  tuning,
  create(host, services) {
    const root = document.createElement('section');
    root.innerHTML =
      '<p data-hud role="status" aria-live="polite"></p><canvas></canvas><p data-message></p><p data-board></p><div data-controls style="display:flex;flex-wrap:wrap;gap:8px"></div>';
    host.append(root);
    const canvas = root.querySelector('canvas')!;
    const { ctx } = fitCanvas(canvas, 640, 520);
    canvas.style.touchAction = 'none';
    canvas.setAttribute(
      'aria-label',
      'Rio rescue grid. Use directional buttons or arrow keys to guide the convoy.',
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
    let lastHud = '';
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
      if (state === 'running' && share(model)) services.audio.tone(650);
      draw();
    });
    const next = button('Next step', () => {
      if (state === 'running') advance(model, 0, true);
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
    function person(x: number, y: number, i: number, leader = false, stride = 0) {
      drawPerson(ctx, x, y, i, leader, stride);
    }
    function draw() {
      if (destroyed) return;
      ctx.fillStyle =
        config['presentation.assetVariant'] === 'B'
          ? '#342b30'
          : config['presentation.assetVariant'] === 'C'
            ? '#172d35'
            : '#111a2e';
      ctx.fillRect(0, 0, 640, 520);
      // Raised diorama base below the unchanged gameplay grid.
      ctx.fillStyle = '#080f2080';
      ctx.fillRect(39, 42, 576, 432);
      ctx.fillStyle = '#293c4d';
      ctx.fillRect(32, 464, 576, 9);
      ctx.fillStyle = '#62827c';
      ctx.fillRect(32, 464, 576, 2);
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < 24; x++) {
          const px = 32 + x * 24,
            py = 32 + y * 24;
          drawGround(ctx, px, py, x, y);
        }
      for (const c of walls(model.district)) {
        const px = 32 + c.x * 24,
          py = 32 + c.y * 24;
        const edge = c.x === 0 || c.y === 0 || c.x === 23 || c.y === 17;
        drawObstacle(ctx, px, py, edge, c.y);
      }
      const dx = 32 + dock.x * 24,
        dy = 32 + dock.y * 24;
      drawDock(ctx, dx, dy, model.dockOpen);
      if (model.pickup) {
        person(32 + model.pickup.x * 24, 32 + model.pickup.y * 24, model.rescued + 3);
        ctx.strokeStyle = '#d4ff76';
        ctx.strokeRect(32 + model.pickup.x * 24, 32 + model.pickup.y * 24, 23, 23);
      }
      if (model.supply) {
        const px = 32 + model.supply.x * 24,
          py = 32 + model.supply.y * 24;
        drawSupply(ctx, px, py);
      }
      if (model.hazard) {
        for (const c of model.hazard.cells) {
          ctx.fillStyle = model.hazard.phase === 'warning' ? '#957541' : '#b24666';
          ctx.fillRect(32 + c.x * 24, 32 + c.y * 24, 23, 23);
          ctx.fillStyle = '#fff0bd';
          ctx.font = 'bold 18px monospace';
          ctx.fillText(model.hazard.phase === 'warning' ? '!' : '×', 38 + c.x * 24, 51 + c.y * 24);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(
          `${model.hazard.kind === 'float' ? 'DONALD TRUMP · PHOTO OP' : 'JD VANCE · RED TAPE'} ${model.hazard.remaining.toFixed(1)}s`,
          32,
          490,
        );
      }
      if (model.hazard) {
        const px = 574,
          py = 475,
          isTrump = model.hazard.kind === 'float';
        ctx.fillStyle = isTrump ? '#ea9b56' : '#e2b797';
        ctx.fillRect(px + 7, py, 18, 17);
        ctx.fillStyle = isTrump ? '#ffd454' : '#684832';
        ctx.fillRect(px + 4, py - 4, 24, 7);
        if (!isTrump) {
          ctx.fillStyle = '#684832';
          ctx.fillRect(px + 7, py + 11, 18, 7);
        }
        ctx.fillStyle = '#3466a3';
        ctx.fillRect(px + 2, py + 18, 28, 20);
        ctx.fillStyle = '#f44963';
        ctx.fillRect(px + 15, py + 18, 4, 18);
        ctx.fillStyle = '#162339';
        ctx.fillRect(px + 10, py + 7, 3, 3);
        ctx.fillRect(px + 20, py + 7, 3, 3);
      }
      motion
        .sample(model, host.dataset.reducedMotion === 'true')
        .slice()
        .reverse()
        .forEach((c, j) =>
          person(
            32 + c.x * 24,
            32 + c.y * 24,
            model.body.length - 1 - j,
            j === model.body.length - 1,
            c.stride,
          ),
        );
      ctx.fillStyle = '#d4ff76';
      ctx.font = '12px monospace';
      ctx.fillText('WELCOME CENTER ←     SPACE: SHARE     FICTIONAL SATIRE', 32, 22);
      ctx.fillStyle = '#d8e8ec';
      ctx.fillText(
        `DISTRICT ${model.district + 1} / 3 · GROUP ${model.aboard} · SHARED CHARGES ${model.charges}`,
        32,
        470,
      );
      if (state !== 'running') {
        ctx.fillStyle = '#101725dd';
        ctx.fillRect(80, 175, 480, 105);
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
          320,
          215,
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
          320,
          246,
        );
        ctx.textAlign = 'left';
      }
      const text = `District ${model.district + 1}/3 · Welcomed ${model.banked}/${GOALS[model.district]} · Aboard ${model.aboard} · Score ${model.score} · Center ${model.dockOpen ? 'OPEN' : 'opens after 3 pickups'}`;
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
      share: ['Space'],
      pause: ['KeyP', 'Escape'],
      restart: ['KeyR'],
      mute: ['KeyM'],
      start: ['Enter'],
    });
    for (const d of ['up', 'down', 'left', 'right'] as const)
      unsub.push(services.input.on(d, () => turn(d)));
    unsub.push(
      services.input.on('share', () => {
        if (state === 'running') share(model);
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
          advance(model, dt);
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
