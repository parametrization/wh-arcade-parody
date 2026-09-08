import type { GameInstance, GameServices, GameState } from '../../shared/contracts';
import { fitCanvas } from '../../shared/canvas';
import { defaults, tuning, validate, type Config } from './config';
import * as model from './model';
import { render } from './render';
export function createGame(host: HTMLElement, s: GameServices): GameInstance {
  let config: Config = {
      ...defaults,
      'presentation.reducedMotion':
        host.dataset.reducedMotion !== undefined
          ? host.dataset.reducedMotion === 'true'
          : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    pending: Config = { ...config },
    seed = s.random.state,
    m = model.create(seed, config),
    destroyed = false,
    loop = false,
    notice = 'Deliver the Epstein Files to the American people.',
    lastStatus = '',
    saved = false;
  const root = document.createElement('section');
  root.className = 'flappy-files';
  root.innerHTML = `<style>.flappy-files{max-width:1100px;margin:auto;color:#f4eaca;font:15px system-ui}.ff-hud{display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;padding:12px;background:#132640;border:1px solid #a19268}.ff-stage{position:relative;background:#12223b;max-width:768px;margin:auto}.ff-labels{position:absolute;inset:0;overflow:hidden;pointer-events:none}.ff-plaque{position:absolute;color:#fff6d9;background:#10243e;border:2px solid #eed49b;border-radius:3px;font:800 15px/1.2 system-ui,sans-serif;letter-spacing:.15px;padding:4px 8px;text-align:center;transform:translateX(-50%);width:max-content;max-width:170px;white-space:nowrap;box-shadow:0 2px 0 #071425, inset 0 0 0 1px #4d6177}.ff-controls{display:flex;flex-wrap:wrap;gap:8px;padding:12px 0}.ff-controls button,.ff-controls select,.ff-overlay button{min-height:44px;padding:10px 14px;font:inherit;background:#203c57;color:#fff4c6;border:1px solid #d4b46b}.ff-overlay{position:absolute;inset:10% 8%;align-content:center;text-align:center;background:#10203bf2;border:2px solid #e6cc87;padding:18px}.ff-overlay h2{font:900 27px monospace;color:#f5d779}.ff-overlay p{line-height:1.5}.ff-note{font-size:13px;line-height:1.5}.ff-status{min-height:40px}.ff-controls label{align-content:center}@media(max-width:500px){.ff-plaque{font-size:11px;max-width:122px;padding:3px 5px;border-width:1px}.ff-overlay{inset:4%;padding:12px}.ff-overlay h2{font-size:21px}.ff-overlay p{font-size:13px}}</style><div class="ff-hud"><strong>FLAPPY FILES</strong><span data-score></span><span data-burgers></span></div><div class="ff-stage"><canvas aria-label="Eagle carrying files through named cartoon columns"></canvas><div class="ff-labels"></div><div class="ff-overlay"></div></div><div class="ff-controls"><button data-flap>Flap · Space</button><button data-burger>Burger · H</button><button data-pause>Pause · P</button><button data-mute>Sound off · M</button><label>Mode <select data-mode><option value="story">Story · 60 columns</option><option value="endless">Endless</option></select></label><label><input type="checkbox" data-assist> Assist</label></div><div class="ff-status" role="status" aria-live="polite"></div><p class="ff-note">Space / ↑ / W: flap · H: hamburger · P / Escape: pause · R: restart. Burgers dismiss the seven-second distraction immediately. Named characters are fictional political satire, not allegations of involvement in Epstein’s crimes.</p>`;
  host.append(root);
  const canvas = root.querySelector('canvas')!,
    ctx = fitCanvas(canvas, 512, 448).ctx;
  const overlay = root.querySelector<HTMLElement>('.ff-overlay')!,
    labels = root.querySelector<HTMLElement>('.ff-labels')!,
    status = root.querySelector<HTMLElement>('[role=status]')!;
  const abort = new AbortController();
  let portraitAtlas: HTMLImageElement | undefined;
  let background: HTMLImageElement | undefined;
  const backgroundImage = new Image();
  backgroundImage.onload = () => {
    if (!destroyed) {
      background = backgroundImage;
      draw();
    }
  };
  backgroundImage.onerror = () => {};
  backgroundImage.src = '/assets/generated/flappy-national-mall-v1.png';
  const portraitImage = new Image();
  portraitImage.onload = () => {
    if (!destroyed) {
      portraitAtlas = portraitImage;
      draw();
    }
  };
  portraitImage.onerror = () => {
    /* Individual procedural portraits remain available offline. */
  };
  portraitImage.src = '/assets/generated/flappy-portraits-v1.png';
  let muted = host.dataset.muted !== 'false',
    overlayKey = '';
  function publicState(): GameState {
    return m.phase === 'falling' ? 'running' : m.phase === 'chapter' ? 'paused' : m.phase;
  }
  function draw() {
    if (destroyed) return;
    // Reflect applied configuration; staged restart settings remain unapplied.
    root.querySelector<HTMLInputElement>('[data-assist]')!.checked = !!config['assist.enabled'];
    render(ctx, m, portraitAtlas, background);
    root.querySelector('[data-score]')!.textContent =
      `${m.deliveries} deliveries · ${m.clearances} cleared`;
    root.querySelector('[data-burgers]')!.textContent =
      `Burgers ${m.burgers} / ${config['burger.capacity']}`;
    labels.replaceChildren();
    for (const c of m.columns) {
      for (const [name, y] of [
        [c.topName, Math.max(4, c.gapY - 100)],
        [c.name, Math.min(416, c.gapY + c.gap + 60)],
      ] as [string, number][]) {
        const el = document.createElement('span');
        el.className = 'ff-plaque';
        el.textContent = name;
        el.style.left = `${((c.x + Number(config['columns.width']) / 2) / 512) * 100}%`;
        el.style.top = `${(y / 448) * 100}%`;
        if (name === c.topName && c.gapY < 100) {
          // Short upper columns cannot stack a readable label above a full face.
          // Move the plaque beside the portrait, entirely inside the upper obstacle band.
          const center = c.x + Number(config['columns.width']) / 2;
          el.style.left = `${((center - 34) / 512) * 100}%`;
          el.style.transform = 'translateX(-100%)';
          el.style.top = `${(4 / 448) * 100}%`;
        }

        labels.append(el);
      }
    }
    const key = m.phase;
    if (key !== overlayKey) {
      overlayKey = key;
      overlay.hidden = ['running', 'falling'].includes(key);
      if (!overlay.hidden) {
        const titles: Record<string, string> = {
          title: 'FLAPPY FILES',
          paused: 'DELIVERY PAUSED',
          chapter:
            ['', 'COMMITTEE LIMBO CLEARED', 'DISTRACTION DEPARTMENT CLEARED'][m.chapter] ??
            'CHAPTER COMPLETE',
          lost: 'DELIVERY DELAYED',
          won: 'THE PUBLIC HAS THE FILES',
        };
        overlay.innerHTML = `<h2>${titles[key] ?? key}</h2><p>${key === 'title' ? 'Fly the eagle. Thread the red elephant columns. Bring the records to the people. Collect burgers, then press H when Donald Trump tries to cover the screen.' : key === 'won' ? 'Six deliveries made. The records belong in public hands.' : key === 'lost' ? `${m.clearances} columns cleared · ${m.deliveries} deliveries made.` : key === 'chapter' ? 'A public reading stand has received another copy. Keep the paperwork moving.' : 'Take your time. Every game timer is frozen.'}</p><button>${key === 'title' ? 'Start delivery' : key === 'paused' ? 'Resume' : key === 'chapter' ? 'Next chapter' : 'Try again'}</button>`;
        overlay.querySelector('button')!.onclick = () => {
          host.focus({ preventScroll: true });
          if (m.phase === 'paused') resume();
          else if (m.phase === 'chapter') {
            model.nextChapter(m);
            s.clock.resume();
          } else {
            if (['lost', 'won'].includes(m.phase)) reset();
            start();
          }
          draw();
        };
      }
    }
    if (notice !== lastStatus) {
      status.textContent = notice;
      lastStatus = notice;
    }
    root.querySelector('[data-pause]')!.textContent =
      m.phase === 'paused' ? 'Resume · P' : 'Pause · P';
  }
  function process() {
    for (const effect of m.effects) {
      if (effect === 'pickup') {
        notice = `Burger collected. ${m.burgers} available.`;
        s.audio.tone(740, 0.08);
      } else if (effect === 'distraction') {
        notice = `Distraction approaching from ${m.event.side}. Press H if you have a burger.`;
        s.audio.tone(180, 0.14);
      } else if (effect === 'burger') {
        notice = 'Hamburger served. Distraction dismissed!';
        s.audio.tone(330, 0.12);
      } else if (effect === 'empty')
        notice = 'No burgers. Keep flying; the distraction lasts seven seconds.';
      else if (effect === 'save-burger') notice = 'Save your burger for the distraction.';
      else if (effect === 'delivery') {
        notice = `Files delivered to the public: ${m.deliveries}.`;
        s.audio.tone(990, 0.12);
      } else if (effect === 'crash') {
        notice = 'Delivery delayed. Try again.';
        s.audio.tone(110, 0.15);
      } else if (effect === 'flap') s.audio.tone(260, 0.025);
      else if (effect === 'start') notice = 'Keep the files flying.';
    }
    m.effects = [];
    if (['won', 'lost'].includes(m.phase) && !saved) {
      saved = true;
      const key = `best.${m.mode}.${config['assist.enabled'] ? 'assist' : 'standard'}`;
      s.storage.set(key, Math.max(s.storage.get(key, 0), m.clearances));
    }
  }
  function update(dt: number) {
    model.step(m, dt);
    process();
  }
  function start() {
    if (destroyed) return;
    if (m.phase === 'paused') {
      resume();
      return;
    }
    if (m.phase === 'chapter') {
      model.nextChapter(m);
    } else if (m.phase === 'title') model.flap(m);
    if (!loop) {
      s.clock.start(update, draw);
      loop = true;
    } else s.clock.resume();
    process();
    draw();
  }
  function pause() {
    model.pause(m);
    s.clock.pause();
    draw();
  }
  function resume() {
    model.resume(m);
    s.clock.resume();
    draw();
  }
  function reset(nextSeed = seed) {
    seed = nextSeed >>> 0;
    config = { ...pending };
    m = model.create(
      seed,
      config,
      (root.querySelector('[data-mode]') as HTMLSelectElement).value as model.Model['mode'],
    );
    s.random.seed(seed);
    s.clock.reset();
    saved = false;
    notice = 'Ready to deliver the files.';
    overlayKey = '';
    draw();
  }
  function doFlap() {
    if (m.phase === 'title') start();
    else {
      model.flap(m);
      process();
      draw();
    }
  }
  function doBurger() {
    model.burger(m);
    process();
    draw();
  }
  function requestReset() {
    if (['running', 'paused', 'falling', 'chapter'].includes(m.phase)) {
      pause();
      overlay.hidden = false;
      overlay.innerHTML =
        '<h2>Restart delivery?</h2><p>This resets the current run.</p><button data-confirm>Restart</button> <button data-cancel>Keep playing</button>';
      overlay.querySelector('[data-confirm]')!.addEventListener('click', () => {
        reset();
      });
      overlay.querySelector('[data-cancel]')!.addEventListener('click', () => {
        overlayKey = '';
        resume();
      });
    } else reset();
  }
  s.input.bind({
    flap: ['Space', 'ArrowUp', 'KeyW'],
    burger: ['KeyH'],
    pause: ['Escape', 'KeyP'],
    restart: ['KeyR'],
    mute: ['KeyM'],
  });
  const unbind = [
    s.input.on('flap', doFlap),
    s.input.on('burger', doBurger),
    s.input.on('pause', () => (m.phase === 'paused' ? resume() : pause())),
    s.input.on('restart', requestReset),
    s.input.on('mute', toggleMute),
  ];
  function toggleMute() {
    muted = !muted;
    s.audio.setMuted(muted);
    root.querySelector('[data-mute]')!.textContent = muted ? 'Sound off · M' : 'Sound on · M';
  }
  for (const [sel, fn] of [
    ['[data-flap]', doFlap],
    ['[data-burger]', doBurger],
    ['[data-pause]', () => (m.phase === 'paused' ? resume() : pause())],
    ['[data-mute]', toggleMute],
  ] as const)
    root.querySelector(sel)!.addEventListener('click', fn, { signal: abort.signal });
  canvas.addEventListener(
    'pointerdown',
    (e) => {
      e.preventDefault();
      doFlap();
    },
    { signal: abort.signal },
  );
  root.querySelector('[data-mode]')!.addEventListener(
    'change',
    () => {
      reset();
    },
    { signal: abort.signal },
  );
  root.querySelector('[data-assist]')!.addEventListener(
    'change',
    (e) => {
      pending = validate(pending, { 'assist.enabled': (e.target as HTMLInputElement).checked });
      reset();
    },
    { signal: abort.signal },
  );
  s.audio.setMuted(muted);
  root.querySelector('[data-mute]')!.textContent = muted ? 'Sound off · M' : 'Sound on · M';
  reset();
  return {
    start,
    pause,
    resume,
    reset,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      backgroundImage.onload = null;
      backgroundImage.onerror = null;
      portraitImage.onload = null;
      portraitImage.onerror = null;
      abort.abort();
      unbind.forEach((fn) => fn());
      s.clock.pause();
      root.remove();
    },
    configure(patch) {
      const next = validate(pending, patch);
      pending = next;
      for (const f of tuning)
        if (!f.restart && Object.hasOwn(patch, f.key)) {
          config[f.key] = next[f.key];
          m.config[f.key] = next[f.key];
        }
      draw();
    },
    inspect: () => ({
      state: publicState(),
      time: m.time,
      fps: s.clock.fps,
      score: m.clearances,
      player: { y: m.y, vy: m.vy },
      columns: m.columns.map((c) => ({ ...c })),
      deliveries: m.deliveries,
      burgers: m.burgers,
      chapter: m.chapter,
      mode: m.mode,
      seed,
      event: { ...m.event },
      config: { ...config },
      pendingConfig: { ...pending },
      portraitAtlasLoaded: !!portraitAtlas,
      backgroundLoaded: !!background,
    }),
  };
}
