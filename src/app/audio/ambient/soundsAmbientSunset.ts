/**
 * Sunset ambient music for SoundEngine.
 */

import type { GainNodeWithOsc, SoundsAmbientHelpers, StopFn } from "./soundsAmbientTypes";

export function createSunsetMusic(
  ctx: AudioContext,
  destination: AudioNode,
  reverb: AudioNode,
  h: SoundsAmbientHelpers,
): StopFn[] {
  const stops: StopFn[] = [];
  const bedSrc = ctx.createBufferSource();
  bedSrc.buffer = h.createNoiseBuffer(ctx, 3.0);
  bedSrc.loop = true;
  const bedFilter = ctx.createBiquadFilter();
  bedFilter.type = "lowpass";
  bedFilter.frequency.value = 700;
  const bedGain = ctx.createGain();
  bedGain.gain.value = 0.035;
  bedSrc.connect(bedFilter);
  bedFilter.connect(bedGain);
  bedGain.connect(destination);
  bedGain.connect(reverb);
  bedSrc.start();
  stops.push(() => {
    try {
      bedGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      bedSrc.stop(ctx.currentTime + 0.35);
    } catch {
      /* ignore */
    }
  });

  const padA = ctx.createOscillator();
  padA.type = "triangle";
  padA.frequency.value = 98.0;
  const padB = ctx.createOscillator();
  padB.type = "sine";
  padB.frequency.value = 123.47;
  const padC = ctx.createOscillator();
  padC.type = "sine";
  padC.frequency.value = 146.83;
  const gA = ctx.createGain();
  const gB = ctx.createGain();
  const gC = ctx.createGain();
  gA.gain.value = 0.0001;
  gB.gain.value = 0.0001;
  gC.gain.value = 0.0001;
  padA.connect(gA);
  padB.connect(gB);
  padC.connect(gC);
  gA.connect(destination);
  gB.connect(destination);
  gC.connect(destination);
  gA.connect(reverb);
  gB.connect(reverb);
  gC.connect(reverb);
  (gA as GainNodeWithOsc).__osc = padA;
  (gB as GainNodeWithOsc).__osc = padB;
  (gC as GainNodeWithOsc).__osc = padC;
  padA.start();
  padB.start();
  padC.start();
  const chords = [
    [98.0, 123.47, 146.83],
    [87.31, 110.0, 130.81],
    [73.42, 98.0, 123.47],
    [82.41, 98.0, 123.47],
  ];
  const baseVol = 0.045;
  for (const g of [gA, gB, gC]) {
    g.gain.exponentialRampToValueAtTime(baseVol, ctx.currentTime + 1.2);
  }
  const chordStop = h.scheduleChordFades(ctx, [gA, gB, gC], chords, 0.65, 10, baseVol);
  stops.push(chordStop.stop);
  stops.push(() => {
    try {
      const t = ctx.currentTime;
      for (const g of [gA, gB, gC]) g.gain.setTargetAtTime(0.0001, t, 0.12);
      padA.stop(t + 0.35);
      padB.stop(t + 0.35);
      padC.stop(t + 0.35);
    } catch {
      /* ignore */
    }
  });

  const bell = (freq: number) => {
    const t = ctx.currentTime;
    h.playTone(ctx, {
      freq,
      type: "sine",
      vol: 0.05,
      duration: 0.28,
      start: t,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: freq * 2,
      type: "sine",
      vol: 0.015,
      duration: 0.18,
      start: t + 0.01,
      toReverb: true,
    });
  };
  const motif = [587.33, 659.25, 783.99, 659.25];
  let mi = 0;
  const bellInt = window.setInterval(() => {
    if (Math.random() < 0.35) return;
    bell(motif[mi % motif.length]);
    mi += 1;
  }, 1100);
  stops.push(() => clearInterval(bellInt));
  const bedLfo = window.setInterval(() => {
    const t = ctx.currentTime;
    bedFilter.frequency.setTargetAtTime(500 + Math.random() * 600, t, 0.8);
    bedGain.gain.setTargetAtTime(0.02 + Math.random() * 0.03, t, 0.8);
  }, 1500);
  stops.push(() => clearInterval(bedLfo));
  return stops;
}
