/**
 * Types for alternate ambient music (used by soundsAmbient theme modules).
 */

export type StopFn = () => void;
export type GainNodeWithOsc = GainNode & { __osc?: OscillatorNode };

export type SoundsAmbientHelpers = {
  playTone: (
    ctx: AudioContext,
    opts: {
      freq: number;
      type?: OscillatorType;
      vol: number;
      duration: number;
      start?: number;
      freqRamp?: { to: number; at: number };
      toReverb?: boolean;
    },
  ) => void;
  playNoiseClick: (
    ctx: AudioContext,
    opts: {
      vol: number;
      duration: number;
      start?: number;
      bandpassHz?: number;
      toReverb?: boolean;
    },
  ) => void;
  createPadOsc: (
    ctx: AudioContext,
    destination: AudioNode,
    opts: {
      freq: number;
      vol: number;
      type?: OscillatorType;
      detune?: number;
      toReverb?: boolean;
    },
  ) => { stop: StopFn; gain: GainNode };
  scheduleChordFades: (
    ctx: AudioContext,
    padGains: GainNode[],
    chordSeq: number[][],
    beatSec: number,
    chordBeats: number,
    baseVol: number,
  ) => { stop: StopFn };
  createNoiseBuffer: (ctx: AudioContext, durationSec: number) => AudioBuffer;
};
