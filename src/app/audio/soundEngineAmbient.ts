/**
 * Ambient music startup and helpers (createPadOsc, scheduleChordFades).
 * Theme-specific loops live in soundsAmbient; this module wires them to the engine.
 */
import type { Theme } from "./audioUtils";
import { getTheme } from "./audioUtils";
import { createNoiseBuffer } from "./soundsDsp";
import {
  createOceanMusic,
  createSunsetMusic,
  createSpaceMusic,
  createForestMusic,
  createLightDarkMusic,
} from "./soundsAmbient";
import type { SoundsAmbientHelpers } from "./soundsAmbientTypes";

export type StopFn = () => void;

type GainNodeWithOsc = GainNode & { __osc?: OscillatorNode };

export function createPadOsc(
  ctx: AudioContext,
  destination: AudioNode,
  opts: {
    freq: number;
    vol: number;
    type?: OscillatorType;
    detune?: number;
    toReverb?: boolean;
  },
): { stop: StopFn; gain: GainNode } {
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.value = opts.freq;
  if (opts.detune) osc.detune.value = opts.detune;

  const g = ctx.createGain();
  g.gain.value = 0.0001;
  osc.connect(g);

  if (opts.toReverb) {
    g.connect(destination);
  } else {
    g.connect(destination);
  }

  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.vol), now + 0.8);

  osc.start();
  return {
    gain: g as GainNodeWithOsc,
    stop: () => {
      try {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0.0001, t, 0.12);
        osc.stop(t + 0.35);
      } catch {
        // ignore
      }
    },
  };
}

export function scheduleChordFades(
  ctx: AudioContext,
  padGains: GainNode[],
  chordSeq: number[][],
  beatSec: number,
  chordBeats: number,
  baseVol: number,
): { stop: StopFn } {
  let idx = 0;
  const applyChord = (chord: number[]) => {
    for (let i = 0; i < padGains.length; i += 1) {
      const g = padGains[i];
      const freq = chord[i % chord.length];
      const osc = (g as GainNodeWithOsc).__osc;
      if (osc) {
        osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.08);
      }
    }
    for (const g of padGains) {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(baseVol, t, 0.22);
    }
  };

  const interval = window.setInterval(
    () => {
      idx = (idx + 1) % chordSeq.length;
      applyChord(chordSeq[idx]);
    },
    Math.floor(beatSec * chordBeats * 1000),
  );
  applyChord(chordSeq[0]);

  return {
    stop: () => clearInterval(interval),
  };
}

export type StartAmbientResult = {
  stopFns: StopFn[];
  gainNode: GainNode;
};

export type AmbientEngineHelpers = {
  playTone: SoundsAmbientHelpers["playTone"];
  playNoiseClick: SoundsAmbientHelpers["playNoiseClick"];
};

/**
 * Start theme-based ambient music. Returns stop functions and gain node for the engine to store.
 */
export function startAmbientFromTheme(
  ctx: AudioContext,
  theme: Theme,
  volume: number,
  reverb: AudioNode,
  engineHelpers: AmbientEngineHelpers,
): StartAmbientResult {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);

  const wet = ctx.createGain();
  wet.gain.value = 0.18;
  reverb.connect(wet);
  wet.connect(gain);

  const helpers: SoundsAmbientHelpers = {
    ...engineHelpers,
    createPadOsc,
    scheduleChordFades,
    createNoiseBuffer,
  };

  let stopFns: StopFn[];
  if (theme === "ocean") {
    stopFns = createOceanMusic(ctx, gain, reverb, helpers);
  } else if (theme === "sunset") {
    stopFns = createSunsetMusic(ctx, gain, reverb, helpers);
  } else if (theme === "space") {
    stopFns = createSpaceMusic(ctx, gain, reverb, helpers);
  } else if (theme === "forest") {
    stopFns = createForestMusic(ctx, gain, reverb, helpers);
  } else {
    stopFns = createLightDarkMusic(ctx, gain, reverb, helpers);
  }

  return { stopFns, gainNode: gain };
}

/** Resolve current theme (used by engine when starting ambient). */
export function getAmbientTheme(): Theme {
  return getTheme();
}
