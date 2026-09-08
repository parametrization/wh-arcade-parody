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
      const r = (dx: number, dy: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
      };
      const skin = colors[i % colors.length],
        coat = leader ? '#4fdac3' : ['#bf78a8', '#dfaa50', '#759bd0', '#a1b977'][i % 4];
      r(3, 22, 19, 2, '#253d3b');
      r(5, 21, 16, 2, '#456055');
      r(5, 11, 14, 11, '#202c39');
      r(7, 10, 10, 3, '#202c39');
      r(6, 13, 12, 7, coat);
      r(7, 13, 3, 7, leader ? '#a4ffda' : '#f1d0a0');
      r(15, 14, 3, 7, '#456573');
      r(3, 14, 3, 6, '#202c39');
      r(4, 15, 3, 4, skin);
      r(18, 14, 3, 6, '#202c39');
      r(18, 15, 2, 4, skin);
      r(7, 19, 5, 4, '#30435a');
      r(13, 19, 5, 4, '#26364c');
      r(6, 22, 6, 2, '#152639');
      r(13, 22, 6, 2, '#152639');
      r(6, 2, 12, 10, '#222432');
      r(7, 4, 10, 8, skin);
      r(8, 5, 3, 5, '#efc39c');
      r(15, 5, 2, 7, '#9e684f');
      r(7, 1, 10, 3, i % 3 === 0 ? '#473429' : i % 3 === 1 ? '#28242a' : '#795331');
      r(5, 3, 4, 3, '#302931');
      r(10, 6, 2, 2, '#202630');
      r(15, 6, 1, 2, '#202630');
      r(12, 9, 3, 1, '#774b48');
      r(8, 11, 7, 2, skin);
      if (leader) {
        r(2, 11, 5, 10, '#183e48');
        r(3, 12, 3, 7, '#d6ac5b');
        r(8, 15, 9, 2, '#d9ffc9');
        r(12, 13, 1, 7, '#164f51');
      } else if (i % 3 === 0) {
        r(10, 11, 3, 5, '#ede1b1');
        r(10, 15, 7, 2, '#9b4b61');
      }
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
          const px = 32 + x * 24,
            py = 32 + y * 24;
          ctx.fillStyle = ['#b3a477', '#ae9e73', '#b8a67a'][(x * 3 + y * 7) % 3];
          ctx.fillRect(px, py, 24, 24);
          ctx.fillStyle = '#9a916a';
          ctx.fillRect(px, py + 23, 24, 1);
          ctx.fillRect(px + 23, py, 1, 24);
          for (let k = 0; k < 4; k++) {
            ctx.fillStyle = k % 2 ? '#d0c295' : '#96875f';
            ctx.fillRect(
              px + ((x * 7 + y * 3 + k * 11) % 21) + 1,
              py + ((x * 11 + y * 5 + k * 7) % 21) + 1,
              2,
              1,
            );
          }
          if ((x + y * 3) % 23 === 0) {
            ctx.fillStyle = '#6f8454';
            ctx.fillRect(px + 16, py + 18, 2, 4);
            ctx.fillRect(px + 14, py + 20, 6, 1);
          }
        }
      for (const c of walls(model.district)) {
        const px = 32 + c.x * 24,
          py = 32 + c.y * 24;
        const edge = c.x === 0 || c.y === 0 || c.x === 23 || c.y === 17;
        if (edge) {
          ctx.fillStyle = '#254e67';
          ctx.fillRect(px, py, 24, 24);
          ctx.fillStyle = '#376f80';
          ctx.fillRect(px, py + 3, 24, 6);
          ctx.fillStyle = '#5b98a0';
          ctx.fillRect(px + (c.y % 3) * 3, py + 5, 12, 1);
          ctx.fillRect(px + 9, py + 16, 11, 1);
          ctx.fillStyle = '#93b5ad';
          ctx.fillRect(px + 4, py + 6, 5, 1);
        } else {
          ctx.fillStyle = '#29383d';
          ctx.fillRect(px, py, 24, 24);
          ctx.fillStyle = '#63716a';
          ctx.fillRect(px + 1, py + 1, 22, 19);
          ctx.fillStyle = '#92927a';
          ctx.fillRect(px + 2, py + 2, 20, 4);
          ctx.fillStyle = '#424f4d';
          ctx.fillRect(px + 1, py + 10, 22, 2);
          ctx.fillRect(px + 11, py + 2, 2, 8);
          ctx.fillRect(px + 5, py + 12, 2, 8);
        }
      }
      const dx = 32 + dock.x * 24,
        dy = 32 + dock.y * 24;
      ctx.fillStyle = '#173c38';
      ctx.fillRect(dx, dy, 24, 24);
      ctx.fillStyle = '#d7d0a0';
      ctx.fillRect(dx + 2, dy + 6, 20, 17);
      ctx.fillStyle = model.dockOpen ? '#92e5bc' : '#668e82';
      ctx.fillRect(dx, dy + 2, 24, 6);
      ctx.fillStyle = '#e5e7be';
      for (let n = 0; n < 4; n++) ctx.fillRect(dx + 2 + n * 6, dy + 2, 3, 6);
      ctx.fillStyle = model.dockOpen ? '#fff2bc' : '#284c49';
      ctx.fillRect(dx + 8, dy + 11, 9, 12);
      ctx.fillStyle = '#376258';
      ctx.fillRect(dx + 3, dy + 11, 3, 6);
      ctx.fillRect(dx + 19, dy + 11, 3, 6);
      ctx.fillStyle = '#6c7659';
      ctx.fillRect(dx + 6, dy + 22, 14, 2);
      if (model.pickup) {
        person(32 + model.pickup.x * 24, 32 + model.pickup.y * 24, model.rescued + 3);
        ctx.strokeStyle = '#d4ff76';
        ctx.strokeRect(32 + model.pickup.x * 24, 32 + model.pickup.y * 24, 23, 23);
      }
      if (model.supply) {
        const px = 32 + model.supply.x * 24,
          py = 32 + model.supply.y * 24;
        ctx.fillStyle = '#354538';
        ctx.fillRect(px + 3, py + 9, 19, 14);
        ctx.fillStyle = '#bd965b';
        ctx.fillRect(px + 4, py + 11, 17, 10);
        ctx.fillStyle = '#edc680';
        ctx.fillRect(px + 4, py + 10, 17, 3);
        ctx.fillStyle = '#795d42';
        ctx.fillRect(px + 5, py + 17, 15, 2);
        ctx.fillStyle = '#326687';
        ctx.fillRect(px + 6, py + 4, 5, 10);
        ctx.fillStyle = '#ace5dc';
        ctx.fillRect(px + 7, py + 5, 2, 7);
        ctx.fillStyle = '#ddebbd';
        ctx.fillRect(px + 7, py + 2, 3, 2);
        ctx.fillStyle = '#e49656';
        ctx.fillRect(px + 13, py + 7, 5, 8);
        ctx.fillStyle = '#75985b';
        ctx.fillRect(px + 14, py + 4, 2, 4);
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
