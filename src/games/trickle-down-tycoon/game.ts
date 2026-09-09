import type { GameInstance, GameServices, GameState, TuningValue } from '../../shared/contracts';
import { fitCanvas } from '../../shared/canvas';
import { loadBindings } from '../../shared/input';
import { defaults, validateConfig } from './config';
import {
  activateCatch,
  audit,
  buy,
  canBuy,
  continueRound,
  createModel,
  laneX,
  moveNet,
  practiceNext,
  practicePass,
  resolveCatches,
  resourceNames,
  serviceNames,
  startModel,
  tick,
  trade,
  returnPromise,
  toggleUmbrella,
  tickReaction,
} from './model';
import { render } from './render';

export function createGame(host: HTMLElement, services: GameServices): GameInstance {
  let config = { ...defaults },
    pending = { ...defaults },
    model = createModel(),
    paused = false,
    destroyed = false,
    seed = 1,
    lastMessage = '',
    lastUI = '',
    dragging = false,
    netVelocity = 0,
    observedScore = 0,
    feedbackUntil = 0,
    scoreFeedback = '';
  const bests = new Map<string, number>();
  let heardReaction = '',
    heardPromises = 0,
    heardIntegrity = model.integrity;
  const section = document.createElement('section');
  section.className = 'tycoon-game';
  section.innerHTML = `<style>.tycoon-game{font:13px Arial,sans-serif;color:#e6eef1}.tycoon-game button{min-height:44px;background:#253c4b;border:1px solid #8baba6;padding:10px 14px;color:#ecf6e7;font:12px monospace;cursor:pointer}.tycoon-game button:disabled{opacity:.4;cursor:default}.tycoon-game .tycoon-controls{display:flex;gap:8px;flex-wrap:wrap;padding:12px 0}.tycoon-game .tycoon-ledger{line-height:1.9;padding:9px 12px;background:#1a2a3e}.tycoon-game .tycoon-invest{border:1px solid #9d8d63;padding:15px;margin:12px 0;background:#273243}.tycoon-game [hidden]{display:none!important}.tycoon-game p{line-height:1.8}.tycoon-game .tycoon-message{min-height:24px;color:#c8e6c4}.tycoon-game select{min-height:44px;padding:8px;color:#eef5f5;background:#1c2e42;border:1px solid #859ea4}.tycoon-game label{font-size:12px;display:flex;gap:8px;align-items:center}.tycoon-game canvas{touch-action:none}</style><canvas role="img" aria-label="Resources fall in three lanes toward your net. Use labeled lane and catch controls below."></canvas><div class="tycoon-ledger" aria-label="Resource ledger"></div><p data-score-feedback aria-live="polite"></p><div class="tycoon-controls"><button data-lane="0">Lane 1 ←</button><button data-lane="1">Lane 2 ·</button><button data-lane="2">Lane 3 →</button><button data-catch>Catch (Space)</button><button data-return>Return promise (Q)</button><button data-umbrella aria-pressed="false">Umbrella (U): closed</button><button data-audit>Public audit (F)</button><button data-next hidden>Next target</button><button data-pass hidden>Pass target</button></div><div class="tycoon-invest" hidden><h3>Make a public investment</h3><p>Choose at most one. Each costs 3 matching resources + 1 flexible coin.</p><div class="tycoon-controls"><button data-buy="0">Education: wider catch window</button><button data-buy="1">Care: repair the net</button><button data-buy="2">Homes: wider net</button></div><div class="tycoon-trade" hidden><p>Final-round exchange: trade two surplus resources for one you need.</p><div class="tycoon-controls"><label>From <select data-from>${resourceNames
    .slice(0, 4)
    .map((name, index) => `<option value="${index}">${name}</option>`)
    .join('')}</select></label><label>To <select data-to>${resourceNames
    .slice(0, 4)
    .map((name, index) => `<option value="${index}">${name}</option>`)
    .join(
      '',
    )}</select></label><button data-trade>Trade 2 → 1</button></div></div><button data-continue>Continue to next round</button></div><p class="tycoon-message" role="status" aria-live="polite"></p><p>Arrows or A/D move the net. Space opens a brief catch window; F audits a distraction; Q returns a caught promise; E or U opens the umbrella. Drag to move on touch, then press Catch. Untimed practice uses Next target, lane selection and Catch / Pass. Build one level in education, care and homes before finishing round five.</p><p style="font-size:10px;color:#a7b8c7">Public figures in fictional cartoon encounters. Resources and budgets are game rules, not financial forecasts. Original procedural artwork.</p>`;
  host.append(section);
  const canvas = section.querySelector('canvas')!;
  const viewport = fitCanvas(canvas, 640, 410);
  const abort = new AbortController();
  const bindings = loadBindings(),
    actionKey = bindings.action?.join(' / ') ?? 'Space',
    auditKey = bindings.audit?.join(' / ') ?? 'F';
  section.querySelector('[data-catch]')!.textContent = `Catch (${actionKey})`;
  const help = section.querySelector('.tycoon-message')!.nextElementSibling!;
  help.textContent = `${bindings.left?.join(' / ') ?? 'Arrows or A/D'}${bindings.right ? ' / ' + bindings.right.join(' / ') : ''} move the net. ${actionKey} opens a brief catch window; Q returns a caught promise to its issuing booth; U or E toggles your umbrella; ${auditKey} audits a distraction. Stand under an overflowing booth with your umbrella open to protect the basket. Each unprotected second makes the basket 1% faster and more slippery. Capitulations increase all positive score awards by 10 percentage points, up to +200%. Drag to move on touch, then press Catch. Untimed practice uses Next target, lane selection and Catch / Pass. Build one level in education, care and homes before finishing round five. Scoring: caught resources earn 10 base points, public investments earn 50, and fulfilled promises award 10 times your total stored resources before fulfillment (minimum 10). Each award is floor(base × (1 + bonus/100)); the bonus grows by 10 points per capitulation, capped at +200%. Personal best is saved separately for standard, assisted and practice modes.`;
  function ui() {
    const reaction = model.reaction?.kind ?? '';
    if (reaction && reaction !== heardReaction)
      services.audio.effect?.(reaction === 'flood' ? 'flood' : 'capitulation');
    if (model.storedPromises.length > heardPromises) services.audio.effect?.('promise');
    if (model.integrity < heardIntegrity) services.audio.effect?.('crash');
    heardReaction = reaction;
    heardPromises = model.storedPromises.length;
    heardIntegrity = model.integrity;
    const bestKey = `best.${config.practice ? 'practice' : config.autoCatch ? 'assisted' : 'standard'}`;
    let best = bests.get(bestKey) ?? services.storage.get(bestKey, 0);
    if (model.score > observedScore) {
      services.audio.effect?.(model.score - observedScore <= 30 ? 'pickup' : 'score');
      scoreFeedback = `+${model.score - observedScore} points · Dividend +${model.bonusPercent}%`;
      feedbackUntil = model.time + 3;
      if (model.score > best) {
        best = model.score;
        services.storage.set(bestKey, best);
      }
    }
    observedScore = model.score;
    bests.set(bestKey, best);
    section.querySelector('[data-score-feedback]')!.textContent =
      `Personal best ${best}${model.time < feedbackUntil ? ' · ' + scoreFeedback : ''}`;
    const key = JSON.stringify([
      model.phase,
      model.resources,
      model.levels,
      model.audits,
      model.bought,
      paused,
      model.round,
      config.practice,
      model.integrity,
      model.storedPromises.length,
      model.reaction?.phase,
      model.umbrella,
      model.bonusPercent,
      Math.floor(model.wetSeconds),
    ]);
    if (key !== lastUI) {
      lastUI = key;
      section.querySelector('.tycoon-ledger')!.textContent =
        `Books ${model.resources[0]} · Care kits ${model.resources[1]} · Home keys ${model.resources[2]} · Flexible coins ${model.resources[3]} | Net ${model.integrity}/6 | Round ${model.round}/5 | Promises ${model.storedPromises.length} | Bonus +${model.bonusPercent}% | Speed +${Math.floor(model.wetSeconds)}%`;
      (section.querySelector('.tycoon-invest') as HTMLElement).hidden = model.phase !== 'invest';
      (section.querySelector('.tycoon-trade') as HTMLElement).hidden = model.round !== 5;
      section.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((button) => {
        const track = Number(button.dataset.buy);
        button.disabled = paused || !canBuy(model, track);
        button.textContent = `${serviceNames[track]} ${model.levels[track]}/2 · ${['Catch +0.08s', 'Repair +2 / round', 'Net width +15%'][track]}`;
      });
      section.querySelector<HTMLButtonElement>('[data-continue]')!.textContent =
        model.round === 5 ? 'Finish campaign' : 'Continue to next round';
      section.querySelector<HTMLButtonElement>('[data-continue]')!.disabled = paused;
      section
        .querySelectorAll<HTMLButtonElement>(
          '[data-lane],[data-catch],[data-audit],[data-next],[data-pass],[data-return],[data-umbrella]',
        )
        .forEach((button) => {
          button.disabled = paused || model.phase !== 'round';
        });
      const returnButton = section.querySelector<HTMLButtonElement>('[data-return]')!;
      returnButton.textContent = `Return promise (Q) · ${model.storedPromises.length}`;
      returnButton.disabled =
        paused || model.phase !== 'round' || !!model.reaction || model.storedPromises.length === 0;
      const umbrellaButton = section.querySelector<HTMLButtonElement>('[data-umbrella]')!;
      umbrellaButton.textContent = `Umbrella (U/E): ${model.umbrella ? 'open' : 'closed'}`;
      umbrellaButton.setAttribute('aria-pressed', String(model.umbrella));
      const auditButton = section.querySelector<HTMLButtonElement>('[data-audit]')!;
      auditButton.textContent = `Public audit (${auditKey}) · ${model.audits}`;
      auditButton.disabled = paused || model.phase !== 'round' || model.audits === 0;
      section.querySelector<HTMLButtonElement>('[data-next]')!.hidden = !config.practice;
      section.querySelector<HTMLButtonElement>('[data-pass]')!.hidden = !config.practice;
      if (model.phase === 'won') {
        const scoreKey = `best.${config.practice ? 'practice' : config.autoCatch ? 'assisted' : 'standard'}`;
        services.storage.set(scoreKey, Math.max(model.score, services.storage.get(scoreKey, 0)));
      }
      if (model.phase === 'won' || model.phase === 'lost') services.clock.pause();
    }
    if (model.message !== lastMessage) {
      lastMessage = model.message;
      section.querySelector('.tycoon-message')!.textContent = model.message;
    }
  }
  function draw() {
    if (destroyed) return;
    render(viewport.ctx, model, config, host.dataset.reducedMotion === 'true');
    ui();
  }
  function catchAction() {
    if (paused) return;
    if (activateCatch(model)) {
      resolveCatches(model);
      services.audio.tone(620, 0.06);
    }
    draw();
  }
  services.input.bind({
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    action: ['Space'],
    audit: ['KeyF'],
    returnPromise: ['KeyQ'],
    umbrella: ['KeyU', 'KeyE'],
    lane1: ['Digit1'],
    lane2: ['Digit2'],
    lane3: ['Digit3'],
  });
  const off = [
    services.input.on('action', catchAction),
    services.input.on('returnPromise', () => {
      if (!paused) returnPromise(model, () => services.random.next());
      draw();
    }),
    services.input.on('umbrella', () => {
      if (!paused) toggleUmbrella(model);
      draw();
    }),
    services.input.on('audit', () => {
      if (!paused) audit(model);
      draw();
    }),
  ];
  for (let i = 0; i < 3; i++)
    off.push(
      services.input.on(`lane${i + 1}`, () => {
        if (!paused) moveNet(model, laneX[i]);
        draw();
      }),
    );
  section.addEventListener(
    'click',
    (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || paused) return;
      void services.audio.unlock();
      if (button.dataset.lane !== undefined) moveNet(model, laneX[Number(button.dataset.lane)]);
      if (button.hasAttribute('data-catch')) catchAction();
      if (button.hasAttribute('data-audit')) audit(model);
      if (button.hasAttribute('data-return')) returnPromise(model, () => services.random.next());
      if (button.hasAttribute('data-umbrella')) toggleUmbrella(model);
      if (button.hasAttribute('data-next')) practiceNext(model, () => services.random.next());
      if (button.hasAttribute('data-pass')) practicePass(model);
      if (button.dataset.buy !== undefined) buy(model, Number(button.dataset.buy));
      if (button.hasAttribute('data-continue')) continueRound(model);
      if (button.hasAttribute('data-trade')) {
        const from = Number(section.querySelector<HTMLSelectElement>('[data-from]')!.value),
          to = Number(section.querySelector<HTMLSelectElement>('[data-to]')!.value);
        model.message = trade(model, from, to)
          ? 'Exchange complete.'
          : 'Choose different resources and at least two units to exchange.';
      }
      draw();
    },
    { signal: abort.signal },
  );
  const pointMove = (event: PointerEvent) => {
    if (!paused) moveNet(model, viewport.toGame(event.clientX, event.clientY).x);
    draw();
  };
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      pointMove(event);
    },
    { signal: abort.signal },
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (dragging) pointMove(event);
    },
    { signal: abort.signal },
  );
  canvas.addEventListener(
    'pointerup',
    () => {
      dragging = false;
    },
    { signal: abort.signal },
  );
  canvas.addEventListener(
    'pointercancel',
    () => {
      dragging = false;
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
  function update(dt: number) {
    if (paused || model.phase !== 'round') return;
    const direction =
      Number(services.input.pressed('right')) - Number(services.input.pressed('left'));
    const desired = direction * 300 * model.speedMult;
    if (model.wetSeconds > 0) {
      const friction = (direction ? 16 : 12) / (1 + model.wetSeconds * 0.08);
      netVelocity += (desired - netVelocity) * (1 - Math.exp(-friction * dt));
      if (Math.abs(netVelocity) < 0.1) netVelocity = 0;
    } else netVelocity = desired;
    if (netVelocity && !dragging) moveNet(model, model.netX + netVelocity * dt);
    if (!config.practice) tick(model, dt, config, () => services.random.next());
    else tickReaction(model, dt);
  }
  draw();
  return {
    start() {
      if (destroyed) return;
      if (model.phase === 'title') startModel(model);
      else if (model.phase === 'won' || model.phase === 'lost') return;
      paused = false;
      void services.audio.unlock();
      services.clock.start(update, draw);
      draw();
    },
    pause() {
      if (state() !== 'running') return;
      paused = true;
      dragging = false;
      netVelocity = 0;
      services.input.clear();
      services.clock.pause();
      draw();
    },
    resume() {
      if (!paused || destroyed) return;
      paused = false;
      services.clock.resume();
      draw();
    },
    reset(nextSeed = seed) {
      seed = nextSeed >>> 0;
      services.clock.pause();
      services.clock.reset();
      services.random.seed(seed);
      config = { ...pending };
      model = createModel(config.practice);
      observedScore = 0;
      scoreFeedback = '';
      feedbackUntil = 0;
      heardReaction = '';
      heardPromises = 0;
      heardIntegrity = model.integrity;
      netVelocity = 0;
      dragging = false;
      paused = false;
      lastUI = '';
      lastMessage = '';
      draw();
    },
    configure(patch: Record<string, TuningValue>) {
      const next = validateConfig(pending, patch);
      pending = next;
      config = { ...config, speed: next.speed, autoCatch: next.autoCatch, variant: next.variant };
      if (model.phase === 'title') {
        config = { ...next };
        model.practice = config.practice;
      }
      draw();
    },
    inspect: () => ({
      state: state(),
      time: model.time,
      fps: services.clock.fps,
      score: model.score,
      progress: model.levels.filter((level) => level > 0).length,
      round: model.round,
      phase: model.phase,
      resources: [...model.resources],
      levels: [...model.levels],
      integrity: model.integrity,
      audits: model.audits,
      targets: model.targets.map((target) => ({ ...target })),
      netX: model.netX,
      storedPromises: model.storedPromises.map((promise) => ({ ...promise })),
      reaction: model.reaction ? { ...model.reaction } : null,
      umbrella: model.umbrella,
      wetSeconds: model.wetSeconds,
      speedMult: model.speedMult,
      bonusPercent: model.bonusPercent,
      seed,
      config: { ...config },
      pending: { ...pending },
    }),
    destroy() {
      destroyed = true;
      abort.abort();
      off.forEach((dispose) => dispose());
      services.clock.destroy();
      section.remove();
    },
  };
}
