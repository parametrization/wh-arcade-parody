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
      sync();
      draw();
    });
    const continueButton = button('Continue district', () => {
      nextDistrict(model);
      state = 'title';
      draw();
    });
    const retryButton = button('Retry group', () => {
      retry(model);
      state = 'title';
      draw();
    });
    const colors = ['#ffd4ae', '#ce946e', '#a36b49', '#78482f', '#edbd91'];
    function person(x: number, y: number, i: number, leader = false) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x + 7, y + 3, 10, 9);
      ctx.fillStyle = leader
        ? '#65f4ed'
        : i < 3
          ? '#d4ff76'
          : ['#ef89e8', '#ffba78', '#b9a3ff'][i % 3];
      ctx.fillRect(x + 5, y + 12, 14, 9);
      ctx.fillStyle = '#18223d';
      ctx.fillRect(x + 6, y + 21, 5, 3);
      ctx.fillRect(x + 14, y + 21, 5, 3);
      ctx.fillRect(x + 9, y + 6, 2, 2);
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
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < 24; x++) {
          ctx.fillStyle = (x + y) % 2 ? '#233d45' : '#29444a';
          ctx.fillRect(32 + x * 24, 32 + y * 24, 23, 23);
        }
      for (const c of walls(model.district)) {
        ctx.fillStyle = '#477986';
        ctx.fillRect(32 + c.x * 24, 32 + c.y * 24, 24, 24);
        ctx.fillStyle = '#74b6c4';
        ctx.fillRect(35 + c.x * 24, 39 + c.y * 24, 12, 2);
      }
      ctx.fillStyle = model.dockOpen ? '#76ffc7' : '#618b77';
      ctx.fillRect(32 + dock.x * 24, 32 + dock.y * 24, 24, 24);
      ctx.fillStyle = '#102b2b';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('⌂', 34 + dock.x * 24, 52 + dock.y * 24);
      if (model.pickup) {
        person(32 + model.pickup.x * 24, 32 + model.pickup.y * 24, model.rescued + 3);
        ctx.strokeStyle = '#d4ff76';
        ctx.strokeRect(32 + model.pickup.x * 24, 32 + model.pickup.y * 24, 23, 23);
      }
      if (model.supply) {
        ctx.fillStyle = '#ffe39b';
        ctx.fillRect(37 + model.supply.x * 24, 39 + model.supply.y * 24, 14, 14);
        ctx.fillStyle = '#365e62';
        ctx.fillRect(42 + model.supply.x * 24, 36 + model.supply.y * 24, 4, 12);
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
      model.body
        .slice()
        .reverse()
        .forEach((c, j) =>
          person(
            32 + c.x * 24,
            32 + c.y * 24,
            model.body.length - 1 - j,
            j === model.body.length - 1,
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
