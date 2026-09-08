import type { AudioService } from './contracts';

export function createAudio(): AudioService {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = false;
  let volume = 0.35;
  let disposed = false;
  const voices = new Set<OscillatorNode>();
  const applyGain = () => {
    if (master && context) master.gain.setValueAtTime(muted ? 0 : volume, context.currentTime);
  };
  return {
    async unlock() {
      if (disposed) return;
      try {
        if (!context) {
          context = new AudioContext();
          master = context.createGain();
          master.connect(context.destination);
          applyGain();
        }
        if (context.state === 'suspended') await context.resume();
      } catch {
        /* Audio unavailable: game remains playable. */
      }
    },
    tone(frequency = 440, duration = 0.09) {
      if (
        disposed ||
        muted ||
        !context ||
        !master ||
        context.state !== 'running' ||
        voices.size >= 12
      )
        return;
      if (!Number.isFinite(frequency) || !Number.isFinite(duration)) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      const length = Math.max(0.015, Math.min(duration, 2));
      oscillator.type = 'sine';
      oscillator.frequency.value = Math.max(30, Math.min(frequency, 16000));
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
      oscillator.connect(gain);
      gain.connect(master);
      voices.add(oscillator);
      oscillator.onended = () => {
        voices.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(now);
      oscillator.stop(now + length + 0.01);
    },
    setMuted(value) {
      muted = value;
      applyGain();
    },
    setVolume(value) {
      if (Number.isFinite(value)) volume = Math.max(0, Math.min(value, 1));
      applyGain();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      for (const voice of voices) {
        try {
          voice.stop();
        } catch {
          /* Already stopped. */
        }
        voice.disconnect();
      }
      voices.clear();
      master?.disconnect();
      if (context) void context.close().catch(() => {});
      context = null;
      master = null;
    },
  };
}
