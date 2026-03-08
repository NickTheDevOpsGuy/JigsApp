/**
 * Forest ambient music for SoundEngine.
 */

import type { SoundsAmbientHelpers, StopFn } from "./soundsAmbientTypes";

export function createForestMusic(
  ctx: AudioContext,
  destination: AudioNode,
  reverb: AudioNode,
  h: SoundsAmbientHelpers,
): StopFn[] {
  const stops: StopFn[] = [];
  const texSrc = ctx.createBufferSource();
  texSrc.buffer = h.createNoiseBuffer(ctx, 3.0);
  texSrc.loop = true;
  const texFilter = ctx.createBiquadFilter();
  texFilter.type = "lowpass";
  texFilter.frequency.value = 520;
  const texGain = ctx.createGain();
  texGain.gain.value = 0.02;
  texSrc.connect(texFilter);
  texFilter.connect(texGain);
  texGain.connect(destination);
  texGain.connect(reverb);
  texSrc.start();
  stops.push(() => {
    try {
      texGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      texSrc.stop(ctx.currentTime + 0.35);
    } catch {
      /* ignore */
    }
  });

  const p1 = h.createPadOsc(ctx, destination, { freq: 65.41, vol: 0.03, type: "sine" });
  const p2 = h.createPadOsc(ctx, destination, { freq: 98.0, vol: 0.02, type: "sine" });
  const p3 = h.createPadOsc(ctx, reverb, { freq: 130.81, vol: 0.018, type: "sine" });
  stops.push(p1.stop, p2.stop, p3.stop);

  const chirp = () => {
    const t = ctx.currentTime;
    const base = 880 + Math.random() * 400;
    h.playTone(ctx, {
      freq: base,
      type: "sine",
      vol: 0.03,
      duration: 0.08,
      start: t,
      freqRamp: { to: base * 1.25, at: 0.06 },
      toReverb: true,
    });
  };
  const chirpInt = window.setInterval(() => {
    if (Math.random() < 0.35) chirp();
  }, 800);
  stops.push(() => clearInterval(chirpInt));
  return stops;
}
