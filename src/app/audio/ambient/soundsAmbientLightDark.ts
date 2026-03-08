/**
 * Light/Dark ambient music for SoundEngine.
 */

import type { SoundsAmbientHelpers, StopFn } from "./soundsAmbientTypes";

export function createLightDarkMusic(
  ctx: AudioContext,
  destination: AudioNode,
  reverb: AudioNode,
  h: SoundsAmbientHelpers,
): StopFn[] {
  const stops: StopFn[] = [];
  const p1 = h.createPadOsc(ctx, destination, { freq: 55, vol: 0.03, type: "sine" });
  const p2 = h.createPadOsc(ctx, destination, { freq: 82.41, vol: 0.02, type: "sine" });
  const p3 = h.createPadOsc(ctx, reverb, { freq: 110, vol: 0.015, type: "sine" });
  stops.push(p1.stop, p2.stop, p3.stop);
  const drift = window.setInterval(() => {
    const osc = (p2.gain as unknown as { __osc?: OscillatorNode }).__osc;
    if (!osc) return;
    osc.frequency.setTargetAtTime(77 + Math.random() * 12, ctx.currentTime, 0.6);
  }, 1400);
  stops.push(() => clearInterval(drift));
  return stops;
}
