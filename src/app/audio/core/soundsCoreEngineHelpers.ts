import { createTinyImpulse } from "./soundsDsp";
import {
  ensureReverb as ensureReverbNode,
  playTone as playToneCore,
  playNoiseClick as playNoiseClickCore,
} from "./soundsCorePlayback";

export type EnginePlaybackState = {
  getContext(): AudioContext | null;
  getMasterReverb(): ConvolverNode | null;
  setMasterReverb(r: ConvolverNode): void;
  getSfxMasterGain(): GainNode | null;
  setSfxMasterGain(g: GainNode): void;
  getMasterVolume(): number;
  getAudioContext(): AudioContext | null;
};

export function ensureReverbForEngine(
  state: EnginePlaybackState,
  ctx: AudioContext,
): ConvolverNode {
  const reverb = ensureReverbNode(ctx, state.getMasterReverb(), createTinyImpulse);
  state.setMasterReverb(reverb);
  return reverb;
}

export function ensureSfxOutputForEngine(
  state: EnginePlaybackState,
  ctx: AudioContext,
): GainNode {
  const existing = state.getSfxMasterGain();
  if (existing) return existing;
  const gain = ctx.createGain();
  gain.gain.value = Math.max(0.0001, state.getMasterVolume());
  gain.connect(ctx.destination);
  state.setSfxMasterGain(gain);
  return gain;
}

export function updateSfxOutputGainForEngine(state: EnginePlaybackState): void {
  const ctx = state.getAudioContext();
  const gain = state.getSfxMasterGain();
  if (!ctx || !gain) return;
  gain.gain.setTargetAtTime(
    Math.max(0.0001, state.getMasterVolume()),
    ctx.currentTime,
    0.08,
  );
}

export function playToneForEngine(
  state: EnginePlaybackState,
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
): void {
  playToneCore(
    ctx,
    opts,
    () => ensureReverbForEngine(state, ctx),
    () => ensureSfxOutputForEngine(state, ctx),
  );
}

export function playNoiseClickForEngine(
  state: EnginePlaybackState,
  ctx: AudioContext,
  opts: {
    vol: number;
    duration: number;
    start?: number;
    bandpassHz?: number;
    toReverb?: boolean;
  },
): void {
  playNoiseClickCore(
    ctx,
    opts,
    () => ensureReverbForEngine(state, ctx),
    () => ensureSfxOutputForEngine(state, ctx),
  );
}
