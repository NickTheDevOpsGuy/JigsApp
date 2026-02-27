/**
 * Types and helpers for theme-aware SFX (used by soundsSfx*.ts).
 */

export type SnapSoundPref = "default" | "classic" | "soft" | "punchy" | "muted";
export type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";

export type SoundsSfxPlayTone = (
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
) => void;

export type SoundsSfxPlayNoiseClick = (
  ctx: AudioContext,
  opts: {
    vol: number;
    duration: number;
    start?: number;
    bandpassHz?: number;
    toReverb?: boolean;
  },
) => void;

export interface SoundsSfxHelpers {
  volume: number;
  snapSoundPref: SnapSoundPref;
  playTone: SoundsSfxPlayTone;
  playNoiseClick: SoundsSfxPlayNoiseClick;
}

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export type Note = {
  f: number;
  dt: number;
  dur: number;
  type?: OscillatorType;
  rev?: boolean;
};
