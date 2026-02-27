/**
 * Ocean ambient music for SoundEngine.
 */

import type { GainNodeWithOsc, SoundsAmbientHelpers, StopFn } from "./soundsAmbientTypes";

export function createOceanMusic(
  ctx: AudioContext,
  destination: AudioNode,
  reverb: AudioNode,
  h: SoundsAmbientHelpers,
): StopFn[] {
  const stops: StopFn[] = [];
  const surfSrc = ctx.createBufferSource();
  surfSrc.buffer = h.createNoiseBuffer(ctx, 2.5);
  surfSrc.loop = true;
  const surfFilter = ctx.createBiquadFilter();
  surfFilter.type = "lowpass";
  surfFilter.frequency.value = 450;
  const surfGain = ctx.createGain();
  surfGain.gain.value = 0.06;
  surfSrc.connect(surfFilter);
  surfFilter.connect(surfGain);
  surfGain.connect(destination);
  surfGain.connect(reverb);
  surfSrc.start();
  stops.push(() => {
    try {
      surfGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      surfSrc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  });

  const pad1 = ctx.createOscillator();
  pad1.type = "sine";
  pad1.frequency.value = 130.81;
  const pad2 = ctx.createOscillator();
  pad2.type = "sine";
  pad2.frequency.value = 164.81;
  const pad3 = ctx.createOscillator();
  pad3.type = "sine";
  pad3.frequency.value = 196.0;
  const g1 = ctx.createGain();
  const g2 = ctx.createGain();
  const g3 = ctx.createGain();
  g1.gain.value = 0.0001;
  g2.gain.value = 0.0001;
  g3.gain.value = 0.0001;
  pad1.connect(g1);
  pad2.connect(g2);
  pad3.connect(g3);
  g1.connect(destination);
  g2.connect(destination);
  g3.connect(destination);
  g1.connect(reverb);
  g2.connect(reverb);
  g3.connect(reverb);
  (g1 as GainNodeWithOsc).__osc = pad1;
  (g2 as GainNodeWithOsc).__osc = pad2;
  (g3 as GainNodeWithOsc).__osc = pad3;
  pad1.start();
  pad2.start();
  pad3.start();
  const chords = [
    [130.81, 164.81, 196.0],
    [110.0, 130.81, 164.81],
    [87.31, 110.0, 130.81],
    [98.0, 130.81, 147.0],
  ];
  const baseVol = 0.05;
  for (const g of [g1, g2, g3]) {
    g.gain.exponentialRampToValueAtTime(baseVol, ctx.currentTime + 1.0);
  }
  const chordStop = h.scheduleChordFades(ctx, [g1, g2, g3], chords, 0.6, 8, baseVol);
  stops.push(chordStop.stop);
  stops.push(() => {
    try {
      const t = ctx.currentTime;
      for (const g of [g1, g2, g3]) g.gain.setTargetAtTime(0.0001, t, 0.12);
      pad1.stop(t + 0.35);
      pad2.stop(t + 0.35);
      pad3.stop(t + 0.35);
    } catch {
      /* ignore */
    }
  });

  const pluck = (freq: number) => {
    const t = ctx.currentTime;
    h.playTone(ctx, {
      freq,
      type: "sine",
      vol: 0.06,
      duration: 0.18,
      start: t,
      toReverb: true,
    });
    h.playNoiseClick(ctx, {
      vol: 0.015,
      duration: 0.05,
      start: t,
      bandpassHz: 900,
      toReverb: true,
    });
  };
  const pluckNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33];
  let pn = 0;
  const pluckInt = window.setInterval(() => {
    if (Math.random() < 0.25) return;
    const note = pluckNotes[pn % pluckNotes.length];
    pn += 1;
    pluck(note * (Math.random() < 0.2 ? 0.5 : 1));
  }, 900);
  stops.push(() => clearInterval(pluckInt));

  const surfLfo = window.setInterval(() => {
    const t = ctx.currentTime;
    surfFilter.frequency.setTargetAtTime(340 + Math.random() * 260, t, 0.6);
    surfGain.gain.setTargetAtTime(0.045 + Math.random() * 0.03, t, 0.6);
  }, 1200);
  stops.push(() => clearInterval(surfLfo));
  return stops;
}
