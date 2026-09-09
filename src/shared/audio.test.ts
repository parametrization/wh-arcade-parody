import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudio } from './audio';

class Param {
  value = 0;
  setTargetAtTime = vi.fn();
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}
class Node {
  gain = new Param();
  frequency = new Param();
  buffer: unknown;
  loop = false;
  type = '';
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}
let context: Context;
class Context {
  state = 'suspended';
  currentTime = 0;
  sampleRate = 8000;
  destination = {};
  nodes: Node[] = [];
  constructor() {
    context = this;
  }
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  createGain = () => new Node();
  createBufferSource = () => {
    const n = new Node();
    this.nodes.push(n);
    return n;
  };
  createOscillator = () => {
    const n = new Node();
    this.nodes.push(n);
    return n;
  };
  createBuffer = (_channels: number, length: number) => ({
    duration: length / this.sampleRate,
    getChannelData: () => new Float32Array(length),
  });
  decodeAudioData = vi.fn(async (_buffer: ArrayBuffer) => ({ duration: 12 }));
}
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
beforeEach(() => {
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('shared audio lifecycle', () => {
  it('does not allocate before unlock and blocks effect and legacy tones while inactive or muted', async () => {
    const audio = createAudio();
    audio.effect!('flap');
    audio.tone();
    expect(audio.inspect!().context).toBe('locked');
    await audio.unlock();
    audio.effect!('flap');
    audio.tone();
    expect(context.nodes).toHaveLength(0);
    audio.setActive!(true);
    audio.setMuted(true);
    audio.effect!('burger');
    audio.tone();
    expect(context.nodes).toHaveLength(0);
    audio.setMuted(false);
    audio.effect!('flap');
    audio.tone();
    expect(audio.inspect!().voices).toBe(2);
    audio.setActive!(false);
    expect(audio.inspect!().voices).toBe(0);
    expect(context.nodes.every((n) => n.stop.mock.calls.length >= 1)).toBe(true);
    for (const node of context.nodes) expect(node.stop.mock.calls.at(-1)).toEqual([]);
    audio.destroy();
  });
  it('pauses and mutes music and resumes at its accumulated playback offset without duplicate loops', async () => {
    const audio = createAudio();
    audio.setScene!('flappy-files');
    audio.setActive!(true);
    await audio.unlock();
    await flush();
    expect(audio.inspect!().musicPlaying).toBe(true);
    const first = context.nodes[0];
    expect(first.start).toHaveBeenCalledWith(0, 0);
    context.currentTime = 3;
    audio.setActive!(false);
    expect(first.stop).toHaveBeenCalledOnce();
    expect(audio.inspect!().musicPlaying).toBe(false);
    context.currentTime = 8;
    audio.setActive!(true);
    expect(context.nodes[1].start).toHaveBeenCalledWith(0, 3);
    audio.setActive!(true);
    expect(context.nodes).toHaveLength(2);
    context.currentTime = 10;
    audio.setMuted(true);
    expect(audio.inspect!().musicPlaying).toBe(false);
    audio.setMuted(false);
    expect(context.nodes[2].start).toHaveBeenCalledWith(0, 5);
    audio.destroy();
    expect(audio.inspect!().musicPlaying).toBe(false);
    expect(context.close).toHaveBeenCalledOnce();
    audio.destroy();
    expect(context.close).toHaveBeenCalledOnce();
  });
  it('discards decode completion after destruction and aborts outstanding network work', async () => {
    const audio = createAudio();
    audio.setScene!('rio-rescue');
    audio.setActive!(true);
    await audio.unlock();
    const decode = deferred<{ duration: number }>();
    context.decodeAudioData.mockImplementation(() => decode.promise);
    await flush();
    const signal = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).signal!;
    audio.destroy();
    expect(signal.aborted).toBe(true);
    decode.resolve({ duration: 12 });
    await flush();
    expect(audio.inspect!()).toMatchObject({
      trackReady: false,
      musicPlaying: false,
      voices: 0,
      context: 'locked',
    });
    expect(context.nodes).toHaveLength(0);
  });
  it('retries the new scene after an older in-flight decode completes without playing the stale track', async () => {
    const audio = createAudio();
    audio.setScene!('flappy-files');
    audio.setActive!(true);
    await audio.unlock();
    const decode = deferred<{ duration: number }>();
    context.decodeAudioData.mockImplementationOnce(() => decode.promise);
    await flush();
    audio.setScene!('rio-rescue');
    expect(fetch).toHaveBeenCalledTimes(1);
    decode.resolve({ duration: 99 });
    await flush();
    expect(vi.mocked(fetch).mock.calls.map((call) => call[0])).toEqual([
      '/assets/audio/flappy-files.ogg',
      '/assets/audio/rio-rescue.ogg',
    ]);
    expect(context.nodes).toHaveLength(1);
    expect(context.nodes[0].buffer).toEqual({ duration: 12 });
    expect(audio.inspect!().scene).toBe('rio-rescue');
    audio.destroy();
  });
  it('stops the old music when switching scenes and starts the new track from zero', async () => {
    const audio = createAudio();
    audio.setScene!('flappy-files');
    audio.setActive!(true);
    await audio.unlock();
    await flush();
    const first = context.nodes[0];
    context.currentTime = 4;
    audio.setScene!('against-the-wall');
    expect(first.stop).toHaveBeenCalledOnce();
    await flush();
    expect(context.nodes[1].start).toHaveBeenCalledWith(0, 0);
    expect(audio.inspect!().musicPlaying).toBe(true);
    audio.destroy();
  });
});
it('drops old scene effects when switching scenes', async () => {
  const audio = createAudio();
  audio.setScene!('flappy-files');
  audio.setActive!(true);
  await audio.unlock();
  await flush();
  audio.effect!('burger');
  expect(audio.inspect!().voices).toBe(1);
  audio.setScene!('rio-rescue');
  expect(audio.inspect!().voices).toBe(0);
  audio.destroy();
});
it.each(['pause', 'mute'] as const)(
  'keeps a late-decoded track silent during %s until explicitly resumed',
  async (mode) => {
    const audio = createAudio();
    audio.setScene!('flappy-files');
    audio.setActive!(true);
    await audio.unlock();
    const decode = deferred<{ duration: number }>();
    context.decodeAudioData.mockImplementationOnce(() => decode.promise);
    await flush();
    if (mode === 'pause') audio.setActive!(false);
    else audio.setMuted(true);
    decode.resolve({ duration: 12 });
    await flush();
    expect(audio.inspect!().trackReady).toBe(true);
    expect(audio.inspect!().musicPlaying).toBe(false);
    expect(context.nodes).toHaveLength(0);
    if (mode === 'pause') audio.setActive!(true);
    else audio.setMuted(false);
    expect(audio.inspect!().musicPlaying).toBe(true);
    expect(context.nodes).toHaveLength(1);
    audio.destroy();
  },
);
