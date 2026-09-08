import type { GameModule, GameState, TuningValue } from '../shared/contracts';

export const diagnostic: GameModule = {
  manifest: { id: 'diagnostic', title: 'Runtime diagnostic', description: 'A moving shape exercises the shared lifecycle. This is test infrastructure, not a game prototype.', controls: ['Space: pause or resume', 'Pointer: focus the canvas'], assetIds: [] },
  tuning: [
    { key: 'speed', label: 'Speed', type: 'number', default: 50, min: 0, max: 160, step: 5 },
    { key: 'size', label: 'Shape size', type: 'number', default: 18, min: 6, max: 42, step: 2 },
    { key: 'variant', label: 'Asset variant', type: 'select', default: 'square', options: ['square', 'diamond', 'circle'] },
    { key: 'trail', label: 'Show path', type: 'boolean', default: true },
  ],
  create(host, services) {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 360; canvas.dataset.testid = 'diagnostic-canvas';
    canvas.setAttribute('aria-label', 'Runtime diagnostic. A geometric shape moves along a deterministic path. Values are available in the inspection panel.');
    canvas.setAttribute('role', 'img');
    host.append(canvas);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable in this browser.');
    let state: GameState = 'title';
    let destroyed = false;
    let seed = 1;
    let x = 0;
    let y = 0;
    let direction = 1;
    const config: Record<string, TuningValue> = { speed: 50, size: 18, variant: 'square', trail: true };
    const draw = () => {
      if (destroyed) return;
      context.fillStyle = '#101b31'; context.fillRect(0, 0, 640, 360);
      context.strokeStyle = '#29354c'; context.lineWidth = 1;
      for (let col = 0; col <= 640; col += 40) { context.beginPath(); context.moveTo(col, 0); context.lineTo(col, 360); context.stroke(); }
      for (let row = 0; row <= 360; row += 40) { context.beginPath(); context.moveTo(0, row); context.lineTo(640, row); context.stroke(); }
      if (config.trail) { context.setLineDash([4, 7]); context.strokeStyle = '#738b8b'; context.beginPath(); context.moveTo(48, y); context.lineTo(592, y); context.stroke(); context.setLineDash([]); }
      context.fillStyle = '#65f4ed';
      const size = Number(config.size);
      if (config.variant === 'circle') { context.beginPath(); context.arc(x, y, size, 0, Math.PI * 2); context.fill(); }
      else if (config.variant === 'diamond') { context.beginPath(); context.moveTo(x, y - size); context.lineTo(x + size, y); context.lineTo(x, y + size); context.lineTo(x - size, y); context.closePath(); context.fill(); }
      else context.fillRect(x - size, y - size, size * 2, size * 2);
      context.fillStyle = '#c4cbde'; context.font = '12px monospace'; context.fillText('SHARED RUNTIME / DIAGNOSTIC', 20, 27);
      context.fillStyle = '#939fb8'; context.fillText(`SEED ${seed}   ·   ${state.toUpperCase()}`, 20, 339);
    };
    const reset = (nextSeed = seed) => {
      seed = nextSeed >>> 0; services.random.seed(seed); services.clock.reset();
      x = 80 + services.random.next() * 200; y = 100 + services.random.next() * 140; direction = services.random.next() > 0.5 ? 1 : -1;
      draw();
    };
    const update = (dt: number) => {
      if (state !== 'running' || destroyed) return;
      x += Number(config.speed) * direction * dt;
      if (x >= 590) { x = 590; direction = -1; }
      if (x <= 50) { x = 50; direction = 1; }
    };
    const pause = () => { if (state !== 'running') return; state = 'paused'; services.clock.pause(); draw(); };
    const resume = () => { if (destroyed || state !== 'paused') return; state = 'running'; services.clock.resume(); draw(); };
    services.input.bind({ pause: [' ', 'Space'] });
    const unbind = services.input.on('pause', () => { if (state === 'running') pause(); else resume(); });
    reset();
    return {
      start() { if (destroyed || state === 'running') return; state = 'running'; services.clock.start(update, draw); },
      pause,
      resume,
      reset,
      configure(patch) {
        for (const field of diagnostic.tuning ?? []) {
          const value = patch[field.key];
          if (field.type === 'number' && typeof value === 'number' && Number.isFinite(value)) config[field.key] = Math.max(field.min ?? -Infinity, Math.min(field.max ?? Infinity, value));
          if (field.type === 'select' && typeof value === 'string' && field.options?.includes(value)) config[field.key] = value;
          if (field.type === 'boolean' && typeof value === 'boolean') config[field.key] = value;
        }
        draw();
      },
      inspect: () => ({ state, time: services.clock.time, fps: services.clock.fps, seed, x, y, direction, config: { ...config } }),
      destroy() { destroyed = true; unbind(); services.clock.destroy(); canvas.remove(); },
    };
  },
};
