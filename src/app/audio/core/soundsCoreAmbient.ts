import type { Theme } from "@/audio/core/audioUtils";
import {
  startAmbientFromTheme,
  getAmbientTheme,
} from "@/audio/ambient/soundEngineAmbient";

export type { Theme };

export function runStartAmbient(
  ctx: AudioContext,
  musicVolume: number,
  reverb: ConvolverNode,
  playTone: (ctx: AudioContext, opts: object) => void,
  playNoiseClick: (ctx: AudioContext, opts: object) => void,
): { stopFns: Array<() => void>; gainNode: GainNode; theme: Theme } {
  const theme = getAmbientTheme();
  const { stopFns, gainNode } = startAmbientFromTheme(ctx, theme, musicVolume, reverb, {
    playTone,
    playNoiseClick,
  });
  return { stopFns, gainNode, theme };
}

export function clearAmbient(stops: Array<() => void>, gainNode: GainNode | null): void {
  for (const stop of stops) {
    try {
      stop();
    } catch {
      // ignore
    }
  }
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch {
      // ignore
    }
  }
}

export function updateAmbientGain(
  gainNode: GainNode,
  ctx: AudioContext,
  musicVolume: number,
): void {
  gainNode.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.08);
}
