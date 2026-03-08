import { clamp01, createNoiseBuffer } from "./soundsDsp";

export function ensureReverb(
  ctx: AudioContext,
  currentReverb: ConvolverNode | null,
  createImpulse: (ctx: AudioContext) => AudioBuffer,
): ConvolverNode {
  if (currentReverb) return currentReverb;
  const conv = ctx.createConvolver();
  conv.buffer = createImpulse(ctx);
  return conv;
}

export function playTone(
  ctx: AudioContext,
  opts: {
    freq: number;
    type?: OscillatorType;
    vol: number;
    duration: number;
    start?: number;
    freqRamp?: { to: number; at: number };
    pan?: number;
    toReverb?: boolean;
  },
  getReverb: () => ConvolverNode,
) {
  const start = opts.start ?? ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.freqRamp) {
    osc.frequency.exponentialRampToValueAtTime(opts.freqRamp.to, start + opts.freqRamp.at);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.vol), start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
  panner.pan.value = clamp01((opts.pan ?? 0) + 1) * 2 - 1;

  osc.connect(gain);
  gain.connect(panner);

  if (opts.toReverb) {
    const wet = ctx.createGain();
    wet.gain.value = 0.25;
    panner.connect(getReverb());
    getReverb().connect(wet);
    wet.connect(ctx.destination);

    const dry = ctx.createGain();
    dry.gain.value = 0.85;
    panner.connect(dry);
    dry.connect(ctx.destination);
  } else {
    panner.connect(ctx.destination);
  }

  osc.start(start);
  osc.stop(start + opts.duration + 0.02);
}

export function playNoiseClick(
  ctx: AudioContext,
  opts: {
    vol: number;
    duration: number;
    start?: number;
    bandpassHz?: number;
    toReverb?: boolean;
  },
  getReverb: () => ConvolverNode,
) {
  const start = opts.start ?? ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, opts.duration);

  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.bandpassHz ?? 1400;
  filter.Q.value = 1.2;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.vol), start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);

  src.connect(filter);
  filter.connect(gain);

  if (opts.toReverb) {
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    gain.connect(getReverb());
    getReverb().connect(wet);
    wet.connect(ctx.destination);

    const dry = ctx.createGain();
    dry.gain.value = 0.9;
    gain.connect(dry);
    dry.connect(ctx.destination);
  } else {
    gain.connect(ctx.destination);
  }

  src.start(start);
  src.stop(start + opts.duration + 0.02);
}

