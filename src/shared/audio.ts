import type { AudioService } from './contracts';

/** Local original scores and physically shaped foley; one mix bus per disposed game runtime. */
export function createAudio(): AudioService {
  let context: AudioContext | null = null,
    master: GainNode | null = null,
    musicGain: GainNode | null = null;
  let muted = false,
    volume = 0.35,
    disposed = false,
    active = false,
    scene = '',
    music: AudioBufferSourceNode | null = null;
  let track: AudioBuffer | null = null,
    offset = 0,
    started = 0,
    loading: Promise<void> | null = null;
  const voices = new Set<AudioScheduledSourceNode>();
  const effects = new Map<string, AudioBuffer>(),
    lastEffect = new Map<string, number>();
  const controller = new AbortController();
  const gain = () => {
    if (master && context)
      master.gain.setTargetAtTime(muted ? 0 : volume, context.currentTime, 0.025);
  };
  const stopMusic = () => {
    if (music && context) {
      offset += context.currentTime - started;
      try {
        music.stop();
      } catch {}
      music.disconnect();
      music = null;
    }
  };
  const syncMusic = () => {
    if (
      disposed ||
      !active ||
      muted ||
      !context ||
      context.state !== 'running' ||
      !track ||
      music ||
      !musicGain
    )
      return;
    music = context.createBufferSource();
    music.buffer = track;
    music.loop = true;
    music.connect(musicGain);
    started = context.currentTime;
    music.start(0, offset % track.duration);
  };
  const load = async () => {
    if (!context || !scene || track || loading || disposed || muted) return;
    const audioContext = context,
      requested = scene;
    loading = (async () => {
      try {
        const response = await fetch(`/assets/audio/${requested}.ogg`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const decoded = await audioContext.decodeAudioData(await response.arrayBuffer());
        if (!disposed && scene === requested) {
          track = decoded;
          syncMusic();
        }
      } catch {
        /* Audio failure must never block play. */
      } finally {
        loading = null;
        if (!disposed && scene !== requested) void load();
      }
    })();
    await loading;
  };
  const stopEffects = () => {
    for (const node of voices) {
      try {
        node.stop();
      } catch {}
      node.disconnect();
    }
    voices.clear();
  };
  const effect = (name: string) => {
    if (
      disposed ||
      muted ||
      !active ||
      !context ||
      !master ||
      context.state !== 'running' ||
      voices.size >= 20
    )
      return;
    const now = context.currentTime,
      gap = name === 'step' ? 0.16 : name === 'gunshot' ? 0.06 : 0.035;
    if (now - (lastEffect.get(name) ?? -100) < gap) return;
    lastEffect.set(name, now);
    let buffer = effects.get(name);
    if (!buffer) {
      const length =
        (
          {
            flap: 0.18,
            step: 0.15,
            gunshot: 0.42,
            water: 0.7,
            flood: 1.1,
            build: 0.35,
            burger: 0.45,
            crash: 0.5,
            promise: 0.22,
            capitulation: 0.9,
            delivery: 0.7,
            rescue: 0.7,
            pickup: 0.2,
            score: 0.25,
          } as Record<string, number>
        )[name] ?? 0.25;
      buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
      const data = buffer.getChannelData(0);
      let smooth = 0,
        deep = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / context.sampleRate,
          u = t / length,
          noise = Math.random() * 2 - 1;
        smooth = 0.82 * smooth + 0.18 * noise;
        deep = 0.96 * deep + 0.04 * noise;
        const attack = Math.min(1, t / 0.008),
          tail = Math.pow(1 - u, 2);
        let sample = 0;
        if (name === 'step')
          sample = (smooth * 0.55 + Math.sin(t * 430) * 0.22) * Math.exp(-t * 30);
        else if (name === 'flap') sample = smooth * Math.sin(Math.PI * u) ** 2 * 0.75;
        else if (name === 'gunshot')
          sample = noise * 0.38 * Math.exp(-t * 75) + deep * 2 * Math.exp(-t * 9);
        else if (name === 'water' || name === 'flood')
          sample =
            (smooth * 0.5 + Math.sin(t * 1500 + Math.sin(t * 83) * 7) * 0.08) *
            Math.sin(Math.PI * u) ** 0.5;
        else if (name === 'build')
          sample =
            (noise * 0.2 + Math.sin(t * 3200) * 0.08) * Math.exp(-t * 38) + deep * 0.7 * tail;
        else if (name === 'crash')
          sample = (smooth * 0.8 + Math.sin(t * 170) * 0.1) * Math.exp(-t * 11);
        else if (name === 'burger') sample = smooth * (0.2 + 0.6 * Math.sin(t * 47) ** 8) * tail;
        else {
          const base =
            name === 'promise'
              ? 175
              : name === 'capitulation'
                ? 330
                : name === 'delivery' || name === 'rescue'
                  ? 392
                  : 660;
          sample =
            (Math.sin(2 * Math.PI * base * t) * 0.22 +
              Math.sin(2 * Math.PI * base * 1.5 * t) * 0.12 +
              Math.sin(2 * Math.PI * base * 2 * t) * 0.04) *
            Math.exp(-t * 6);
        }
        data[i] = Math.max(-0.75, Math.min(0.75, sample * attack));
      }
      effects.set(name, buffer);
    }
    const source = context.createBufferSource(),
      level = context.createGain();
    source.buffer = buffer;
    level.gain.value = name === 'gunshot' ? 0.65 : 0.55;
    source.connect(level);
    level.connect(master);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      level.disconnect();
    };
    source.start();
  };
  return {
    async unlock() {
      if (disposed) return;
      try {
        if (!context) {
          context = new AudioContext();
          master = context.createGain();
          musicGain = context.createGain();
          musicGain.gain.value = 0.36;
          musicGain.connect(master);
          master.connect(context.destination);
          gain();
        }
        if (context.state === 'suspended') await context.resume();
        void load();
        syncMusic();
      } catch {}
    },
    tone(frequency = 440, duration = 0.09) {
      if (
        disposed ||
        muted ||
        !active ||
        !context ||
        !master ||
        context.state !== 'running' ||
        voices.size >= 20
      )
        return;
      if (!Number.isFinite(frequency) || !Number.isFinite(duration)) return;
      const node = context.createOscillator(),
        level = context.createGain(),
        now = context.currentTime;
      node.type = 'triangle';
      node.frequency.value = Math.max(30, Math.min(frequency, 16000));
      level.gain.setValueAtTime(0.09, now);
      level.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.015, Math.min(duration, 2)));
      node.connect(level);
      level.connect(master);
      voices.add(node);
      node.onended = () => {
        voices.delete(node);
        node.disconnect();
        level.disconnect();
      };
      node.start();
      node.stop(now + Math.max(0.015, Math.min(duration, 2)) + 0.01);
    },
    effect,
    setScene(value) {
      if (scene === value) return;
      stopMusic();
      stopEffects();
      lastEffect.clear();
      scene = value;
      track = null;
      offset = 0;
      void load();
    },
    setActive(value) {
      active = value;
      if (!value) {
        stopMusic();
        stopEffects();
      } else {
        void load();
        syncMusic();
      }
    },
    inspect() {
      return {
        active,
        muted,
        scene,
        musicPlaying: !!music,
        voices: voices.size,
        context: context?.state ?? 'locked',
        trackReady: !!track,
      };
    },
    setMuted(value) {
      muted = value;
      gain();
      if (value) {
        stopMusic();
        stopEffects();
      } else {
        void load();
        syncMusic();
      }
    },
    setVolume(value) {
      if (Number.isFinite(value)) volume = Math.max(0, Math.min(value, 1));
      gain();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      stopMusic();
      stopEffects();
      effects.clear();
      musicGain?.disconnect();
      master?.disconnect();
      if (context) void context.close().catch(() => {});
      context = null;
      master = null;
      musicGain = null;
      track = null;
    },
  };
}
