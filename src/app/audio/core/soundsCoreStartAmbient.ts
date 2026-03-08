/**
 * Ambient start logic for SoundEngine. Split out to keep soundsCore.ts under 300 lines.
 */
import { runStartAmbient } from "./soundsCoreAmbient";

export type StartAmbientParams = {
  getContext: () => AudioContext | null;
  getMusicEnabled: () => boolean;
  getPaused: () => boolean;
  getMusicVolume: () => number;
  ensureReverb: (ctx: AudioContext) => ConvolverNode;
  playTone: (ctx: AudioContext, opts: object) => void;
  playNoiseClick: (ctx: AudioContext, opts: object) => void;
  stopAmbient: () => void;
  setAmbientState: (
    gain: GainNode | null,
    stops: (() => void)[],
    theme: import("./soundsCoreAmbient").Theme | null,
  ) => void;
};

export async function runStartAmbientForEngine(
  params: StartAmbientParams,
): Promise<void> {
  params.stopAmbient();
  const ctx = params.getContext();
  if (!ctx) return;
  if (!params.getMusicEnabled() || params.getPaused()) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
    if (!params.getMusicEnabled() || params.getPaused()) return;
  }

  const reverb = params.ensureReverb(ctx);
  const { stopFns, gainNode, theme } = runStartAmbient(
    ctx,
    params.getMusicVolume(),
    reverb,
    params.playTone,
    params.playNoiseClick,
  );
  params.setAmbientState(gainNode, stopFns, theme);
}
