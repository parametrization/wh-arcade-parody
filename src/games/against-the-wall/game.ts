import type { GameModule, GameInstance, GameState } from '../../shared/contracts';
import { fitCanvas } from '../../shared/canvas';
import * as M from './model';
import { drawScene as draw, unprojectScene as unproject } from './scene';
import { tuning } from './config';
export const createGame: GameModule['create'] = (host, services): GameInstance => {
  let config = Object.fromEntries(tuning.map((f) => [f.key, f.default])),
    pending = { ...config },
    seed = services.random.state,
    s = M.create(seed),
    loop = false,
    dead = false,
    aim: null | { x: number; y: number } = null,
    previous: M.Phase = 'running',
    overlayKey = '',
    muted = host.dataset.muted !== 'false',
    tunnelIndex = 0;
  const root = document.createElement('section');
  root.innerHTML = `<style>.aw{font:14px system-ui;color:#f7e7bd;max-width:1440px;margin:auto}.aw-head{display:flex;flex-wrap:wrap;gap:16px;padding:14px;background:#24273e}.aw-stamina{display:flex;align-items:center;gap:8px}.aw-stamina progress{width:120px;accent-color:#8cf1d2}.aw-stage{position:relative}.aw-overlay{position:absolute;inset:15% 10%;background:#18213bf5;border:2px solid #8cf1d2;padding:20px;text-align:center;align-content:center}.aw-controls{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.aw button{min-width:48px;min-height:46px;padding:10px;background:#263951;color:#f6ecc7;border:1px solid #82bba9;font:inherit;touch-action:none}.aw-note{line-height:1.6}.aw-status{min-height:40px}</style><div class="aw-head"><strong>AGAINST THE WALL</strong><span data-hud></span><label class="aw-stamina">Health <progress data-health max="100" value="100" aria-label="Health remaining"></progress></label><span data-daylight></span><label class="aw-stamina">Sprint <progress data-stamina max="4" value="4" aria-label="Sprint time remaining"></progress> <span data-stamina-label>4.0s / 4s</span></label></div><div class="aw-stage"><canvas aria-label="Perspective border districts with constructed crossings, pursuers and an Asylum Office"></canvas><div class="aw-overlay"></div></div><div class="aw-controls"><button data-dir="up" aria-label="Move up">↑</button><button data-dir="left" aria-label="Move left">←</button><button data-dir="down" aria-label="Move down">↓</button><button data-dir="right" aria-label="Move right">→</button><button data-sprint>Sprint: off</button><button data-breach>Build crossing · B</button><button data-help>Help / Collect · E</button><button data-aim>Distraction · Space</button><button data-confirm>Confirm · Enter</button><button data-step>Step time</button><button data-sound>Sound · M</button></div><div class="aw-construction"><label>Crossing construction <progress data-construction max="1" value="0" aria-label="Crossing construction progress"></progress></label><span data-crossing-info>Approach the barrier and press B.</span></div><div data-tunnel-controls hidden><strong data-tunnel-step></strong> <button data-tunnel-prev>← Previous</button> <button data-tunnel-next>Next →</button> <button data-tunnel-choose>Select · Enter</button> <button data-tunnel-cancel>Cancel tunnel</button></div><p class="aw-status" role="status" aria-live="polite"></p><p class="aw-note">WASD / arrows move on screen · B builds/cancels a crossing; concrete asks for a wall-side entry (arrows cycle, Enter starts digging). The hidden exit is random, up to 10 tiles beyond the wall. Emerging beneath a raised structure causes a fatal collapse; emerging in water causes drowning. Moving cancels construction. Fence patrols knock ladders down, mend wire in 30s, and need two guards on each side for 90s to seal tunnels · Shift runs for up to 4 seconds; release to recharge · E helps nearby adults and collects supplies · Space aims a noise beacon, click a location within four tiles, Enter confirms. Draw hostile factions together: they can exchange fire while you escape. Day and night alternate every 60 seconds of play. By day ICE and Border Patrol are allied and factions protect their own. At night every pursuer uses a flashlight and may shoot anyone they detect, including allies. Green bars show health; amber bars show attention. Losing health returns Alex safely to the district checkpoint. Mint office marker is your destination. Fictional geography and political cartoon dialogue; reaching intake does not mean asylum approval.</p>`;
  root.className = 'aw';
  host.append(root);
  const canvas = root.querySelector('canvas')!,
    view = fitCanvas(canvas, 960, 640),
    overlay = root.querySelector<HTMLElement>('.aw-overlay')!,
    status = root.querySelector<HTMLElement>('[role=status]')!;
  canvas.style.maxWidth = 'min(100%, 1440px, calc((100dvh - 200px) * 1.5))';
  const abort = new AbortController(),
    held = new Set<string>();
  let sprint = false,
    lastMessage = '';
  const settings = (): M.Config => ({
    walk: Number(config['player.walkSpeed']),
    run: Number(config['player.runSpeed']),
    vision: Number(config['vision.range']),
    detection: Number(config['vision.detectSeconds']),
    clash: Number(config['encounter.clashSeconds']),
    story: config.mode !== 'standard',
  });
  function state(): GameState {
    return s.phase === 'district' || s.phase === 'paused'
      ? 'paused'
      : s.phase === 'checkpoint'
        ? 'running'
        : s.phase;
  }
  function tunnelOptions() {
    return s.tunnelPlacement
      ? M.tunnelCandidates(s, 'south')
          .filter((p) => Math.hypot(p.x - s.x, p.y - s.y) <= 1.6)
          .sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))
      : [];
  }
  function tunnelCursor() {
    const options = tunnelOptions();
    return options.length
      ? options[((tunnelIndex % options.length) + options.length) % options.length]
      : null;
  }
  function cycleTunnel(delta: number) {
    if (!s.tunnelPlacement || s.phase !== 'running') return;
    tunnelIndex += delta;
    paint();
  }
  function breach() {
    if (!aim && s.phase === 'running') {
      if (s.tunnelPlacement) M.cancelTunnelPlacement(s);
      else {
        tunnelIndex = 0;
        M.beginBreach(s);
      }
    }
    paint();
  }
  function paint() {
    if (dead) return;
    draw(
      view.ctx,
      s,
      aim,
      String(config['presentation.assetVariant']),
      host.dataset.reducedMotion === 'true',
      tunnelCursor(),
    );
    root.querySelector('[data-hud]')!.textContent =
      `District ${s.district}/3 · Health ${s.health} · Tokens ${s.tokens} · Score ${s.score} · Follow mint office marker`;
    root.querySelector<HTMLProgressElement>('[data-health]')!.value = s.health;
    root.querySelector('[data-daylight]')!.textContent =
      `${M.isNight(s) ? 'Night · flashlights · friendly fire' : 'Day'} · ${Math.ceil(M.secondsToLightChange(s))}s until ${M.isNight(s) ? 'day' : 'night'}`;
    const meter = root.querySelector<HTMLProgressElement>('[data-stamina]')!;
    meter.value = s.stamina / 25;
    meter.setAttribute('aria-valuetext', `${(s.stamina / 25).toFixed(1)} seconds remaining`);
    root.querySelector('[data-stamina-label]')!.textContent =
      `${(s.stamina / 25).toFixed(1)}s / 4s${s.sprintLocked ? ' · release sprint' : ''}`;
    const panel = root.querySelector<HTMLElement>('[data-tunnel-controls]')!;
    panel.hidden = !s.tunnelPlacement;
    const cursor = tunnelCursor();
    root.querySelector('[data-tunnel-step]')!.textContent = s.tunnelPlacement
      ? `Choose ENTRY · against the wall${cursor ? ` (${cursor.x.toFixed(1)}, ${cursor.y.toFixed(1)})` : ' · no valid locations nearby'}. Arrows cycle; Enter starts digging. Exit is unknown, up to 10 tiles beyond the wall.`
      : '';
    const barrier = M.nearestBarrier(s);
    const work = s.construction;
    root.querySelector<HTMLProgressElement>('[data-construction]')!.value = work?.progress ?? 0;
    const method = barrier
      ? ({ wire: 'Cut wire', fence: 'Build ladder', concrete: 'Dig tunnel' } as const)[
          barrier.material
        ]
      : '';
    root.querySelector('[data-crossing-info]')!.textContent = s.tunnelTransit
      ? `Underground · ${Math.ceil(s.tunnelTransit.remaining)}s · waiting for a clear exit if occupied`
      : work
        ? `${method} · ${Math.round(work.progress * 100)}% · stay still`
        : barrier
          ? `${method}: ${M.barrierRules[barrier.material].seconds}s · ${barrier.material === 'fence' ? '20s ladder, slower crossing' : 'stays open until guards repair it'}`
          : 'Approach the barrier and press B. Asylum Office is beyond it.';
    root.querySelector('[data-breach]')!.textContent = s.tunnelPlacement
      ? 'Cancel tunnel · B'
      : work
        ? 'Cancel construction · B'
        : 'Build crossing · B';
    if (s.message !== lastMessage) {
      lastMessage = s.message;
      status.textContent = s.message;
    }
    const k = aim ? 'aim' : s.phase;
    if (k !== overlayKey) {
      overlayKey = k;
      overlay.hidden = ['running', 'checkpoint', 'aim'].includes(k);
      if (!overlay.hidden) {
        overlay.innerHTML = `<h2>${s.phase === 'title' ? 'AGAINST THE WALL' : s.phase === 'won' ? 'YOU REACHED INTAKE' : s.phase === 'district' ? 'DISTRICT CROSSED' : 'PAUSED'}</h2><p>${s.phase === 'title' ? 'Help Alex reach a welcoming intake desk. Use cover, rescue an optional neighbor, and let competing pursuers distract each other.' : s.message}</p><button>${s.phase === 'title' ? 'Start journey' : s.phase === 'district' ? 'Next district' : s.phase === 'won' ? 'New journey' : 'Resume'}</button>`;
        overlay.querySelector('button')!.onclick = () => {
          host.focus({ preventScroll: true });
          if (s.phase === 'won') reset();
          start();
        };
      }
    }
  }
  function input() {
    const active = (a: string) => held.has(a) || services.input.pressed(a);
    return {
      x: Number(active('right')) - Number(active('left')),
      y: Number(active('down')) - Number(active('up')),
      sprint: sprint || active('sprint'),
    };
  }
  function tick(dt: number) {
    const i = input();
    if (aim) {
      aim.x = Math.max(1, Math.min(M.MAP_WIDTH - 2, aim.x + i.x * dt * 2));
      aim.y = Math.max(1, Math.min(M.MAP_HEIGHT - 2, aim.y + i.y * dt * 2));
      return;
    }
    if (s.tunnelPlacement) {
      M.step(s, dt);
      return;
    }
    if (config.mode === 'turn-assisted' && !i.x && !i.y && !s.construction) return;
    M.step(s, dt, { x: i.x, y: i.y, sprint: i.sprint });
    if (s.phase === 'won')
      services.storage.set('best', Math.max(services.storage.get('best', 0), s.score));
  }
  function start() {
    if (dead) return;
    if (s.phase === 'district') M.next(s);
    else if (s.phase === 'paused') {
      resume();
      return;
    } else if (s.phase === 'title') s.phase = 'running';
    if (!loop) {
      services.clock.start(tick, paint);
      loop = true;
    } else services.clock.resume();
    paint();
  }
  function pause() {
    held.clear();
    sprint = false;
    root.querySelector('[data-sprint]')!.textContent = 'Sprint: off';
    services.input.clear();
    if (s.phase === 'running' || s.phase === 'checkpoint') {
      previous = s.phase;
      s.phase = 'paused';
    }
    services.clock.pause();
    paint();
  }
  function resume() {
    if (s.phase === 'paused') s.phase = previous;
    services.clock.resume();
    paint();
  }
  function reset(nextSeed = seed) {
    seed = nextSeed >>> 0;
    config = { ...pending };
    s = M.create(seed, settings());
    sprint = false;
    root.querySelector('[data-sprint]')!.textContent = 'Sprint: off';
    services.random.seed(seed);
    services.clock.reset();
    aim = null;
    held.clear();
    overlayKey = '';
    paint();
  }
  function aimAction() {
    if (s.tunnelPlacement) return;
    if (aim) {
      aim = null;
      s.message = 'Distraction cancelled.';
      paint();
      return;
    }
    if (s.phase !== 'running' || !s.tokens) return;
    aim = { x: s.x + 1, y: s.y };
    s.message = 'Choose a walkable spot within four tiles. Enter confirms; Escape cancels.';
    paint();
  }
  function confirm() {
    if (s.tunnelPlacement && s.phase === 'running') {
      const cursor = tunnelCursor();
      if (cursor) M.chooseTunnelEndpoint(s, cursor.x, cursor.y);
      tunnelIndex = 0;
      paint();
      return;
    }
    if (!aim) return;
    if (M.distract(s, aim.x, aim.y)) {
      aim = null;
      services.audio.tone(500, 0.12);
    } else s.message = 'Choose a walkable spot within four tiles.';
    paint();
  }
  function mute() {
    muted = !muted;
    services.audio.setMuted(muted);
    root.querySelector('[data-sound]')!.textContent = muted ? 'Sound off · M' : 'Sound on · M';
  }
  function restart() {
    if (s.phase === 'title' || s.phase === 'won') {
      reset();
      return;
    }
    pause();
    overlay.hidden = false;
    overlay.innerHTML =
      '<h2>Restart the journey?</h2><p>This clears all district progress.</p><button data-yes>Restart</button> <button data-no>Keep going</button>';
    overlay.querySelector('[data-yes]')!.addEventListener('click', () => reset());
    overlay.querySelector('[data-no]')!.addEventListener('click', () => {
      overlayKey = '';
      resume();
    });
  }
  services.input.bind({
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    sprint: ['ShiftLeft', 'ShiftRight'],
    help: ['KeyE'],
    aim: ['Space'],
    breach: ['KeyB'],
    confirm: ['Enter'],
    pause: ['Escape', 'KeyP'],
    restart: ['KeyR'],
    mute: ['KeyM'],
  });
  const off = [
    services.input.on('help', () => {
      M.interact(s);
      paint();
    }),
    services.input.on('aim', aimAction),
    services.input.on('breach', breach),
    ...(['left', 'up', 'right', 'down'] as const).map((direction) =>
      services.input.on(direction, () =>
        cycleTunnel(direction === 'left' || direction === 'up' ? -1 : 1),
      ),
    ),
    services.input.on('confirm', confirm),
    services.input.on('pause', () => {
      if (s.tunnelPlacement) {
        M.cancelTunnelPlacement(s);
        paint();
      } else if (aim) {
        aim = null;
        paint();
      } else if (s.phase === 'paused') resume();
      else pause();
    }),
    services.input.on('restart', restart),
    services.input.on('mute', mute),
  ];
  for (const b of root.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
    b.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault();
        held.add(b.dataset.dir!);
        b.setPointerCapture(e.pointerId);
      },
      { signal: abort.signal },
    );
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      b.addEventListener(event, () => held.delete(b.dataset.dir!), { signal: abort.signal });
  }
  root.querySelector('[data-sprint]')!.addEventListener(
    'click',
    () => {
      sprint = !sprint;
      root.querySelector('[data-sprint]')!.textContent = `Sprint: ${sprint ? 'on' : 'off'}`;
    },
    { signal: abort.signal },
  );
  for (const [sel, fn] of [
    [
      '[data-help]',
      () => {
        M.interact(s);
        paint();
      },
    ],
    ['[data-aim]', aimAction],
    ['[data-breach]', breach],
    ['[data-tunnel-prev]', () => cycleTunnel(-1)],
    ['[data-tunnel-next]', () => cycleTunnel(1)],
    ['[data-tunnel-choose]', confirm],
    [
      '[data-tunnel-cancel]',
      () => {
        M.cancelTunnelPlacement(s);
        paint();
      },
    ],
    ['[data-confirm]', confirm],
    ['[data-sound]', mute],
    [
      '[data-step]',
      () => {
        if (config.mode === 'turn-assisted' && !aim) {
          M.step(s, 1 / 60);
          paint();
        }
      },
    ],
  ] as const)
    root.querySelector(sel)!.addEventListener('click', fn, { signal: abort.signal });
  canvas.addEventListener(
    'pointerdown',
    (e) => {
      if (s.tunnelPlacement && s.phase === 'running') {
        const pixel = view.toGame(e.clientX, e.clientY);
        const point = unproject(s, pixel.x, pixel.y);
        const option = tunnelOptions().find(
          (at) => Math.hypot(at.x - point.x, at.y - point.y) < 0.7,
        );
        if (option) {
          M.chooseTunnelEndpoint(s, option.x, option.y);
          tunnelIndex = 0;
          paint();
        }
      } else if (aim) {
        const a = view.toGame(e.clientX, e.clientY);
        aim = unproject(s, a.x, a.y);
        paint();
      }
    },
    { signal: abort.signal },
  );
  services.audio.setMuted(muted);
  root.querySelector('[data-sound]')!.textContent = muted ? 'Sound off · M' : 'Sound on · M';
  reset();
  return {
    start,
    pause,
    resume,
    reset,
    configure(patch) {
      const next = { ...pending, ...patch };
      for (const [k, v] of Object.entries(patch)) {
        const f = tuning.find((f) => f.key === k);
        if (!f) throw Error(`Unknown Wall setting ${k}`);
        if (
          f.type === 'number' &&
          (typeof v !== 'number' || !Number.isFinite(v) || v < (f.min ?? 0) || v > (f.max ?? 100))
        )
          throw Error(`Invalid ${f.label}`);
        if (f.type === 'select' && !f.options?.includes(String(v)))
          throw Error(`Invalid ${f.label}`);
      }
      if (Number(next['player.runSpeed']) < Number(next['player.walkSpeed']))
        throw Error('Running speed must be at least walking speed');
      pending = next;
      for (const f of tuning)
        if (!f.restart && Object.hasOwn(patch, f.key)) config[f.key] = next[f.key];
      paint();
    },
    inspect: () => ({
      state: state(),
      time: s.time,
      fps: services.clock.fps,
      score: s.score,
      district: s.district,
      player: { x: s.x, y: s.y },
      office: s.office,
      tokens: s.tokens,
      stamina: s.stamina,
      health: s.health,
      night: M.isNight(s),
      lightChangeIn: M.secondsToLightChange(s),
      enemies: s.enemies.map((e) => ({ ...e })),
      gate: { ...s.gate },
      aim,
      construction: s.construction,
      barriers: s.barriers.map((barrier) => ({ ...barrier })),
      crossing: s.crossing,
      tunnelPlacement: s.tunnelPlacement,
      tunnelTransit: s.tunnelTransit
        ? { remaining: s.tunnelTransit.remaining, duration: s.tunnelTransit.duration }
        : null,
      tunnels: s.tunnels.map((t) => ({ ...t, exit: t.discovered ? t.exit : null })),
      seed,
      config: { ...config },
      pendingConfig: { ...pending },
    }),
    destroy() {
      if (dead) return;
      dead = true;
      abort.abort();
      off.forEach((f) => f());
      held.clear();
      services.clock.pause();
      root.remove();
    },
  };
};
