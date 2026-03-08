/**
 * Space ambient music for SoundEngine.
 */

import type { SoundsAmbientHelpers, StopFn } from "./soundsAmbientTypes";

export function createSpaceMusic(
  ctx: AudioContext,
  destination: AudioNode,
  reverb: AudioNode,
  h: SoundsAmbientHelpers,
): StopFn[] {
  const stops: StopFn[] = [];
  const airSrc = ctx.createBufferSource();
  airSrc.buffer = h.createNoiseBuffer(ctx, 3.5);
  airSrc.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = 900;
  airFilter.Q.value = 0.6;
  const airGain = ctx.createGain();
  airGain.gain.value = 0.02;
  airSrc.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(destination);
  airGain.connect(reverb);
  airSrc.start();
  stops.push(() => {
    try {
      airGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      airSrc.stop(ctx.currentTime + 0.35);
    } catch {
      /* ignore */
    }
  });

  const pad1 = h.createPadOsc(ctx, destination, {
    freq: 55,
    vol: 0.03,
    type: "sine",
    detune: -7,
  });
  const pad2 = h.createPadOsc(ctx, destination, {
    freq: 55,
    vol: 0.03,
    type: "sine",
    detune: 7,
  });
  const padR1 = h.createPadOsc(ctx, reverb, {
    freq: 110,
    vol: 0.02,
    type: "sine",
    detune: -5,
  });
  const padR2 = h.createPadOsc(ctx, reverb, {
    freq: 110,
    vol: 0.02,
    type: "sine",
    detune: 5,
  });
  stops.push(pad1.stop, pad2.stop, padR1.stop, padR2.stop);

  const pulseOsc = ctx.createOscillator();
  pulseOsc.type = "sine";
  pulseOsc.frequency.value = 0.18;
  const pulseGain = ctx.createGain();
  pulseGain.gain.value = 0.5;
  const amp = ctx.createGain();
  amp.gain.value = 0.0;
  pulseOsc.connect(pulseGain);
  pulseGain.connect(amp.gain);
  const drone = ctx.createOscillator();
  drone.type = "triangle";
  drone.frequency.value = 73.42;
  drone.connect(amp);
  amp.connect(destination);
  amp.connect(reverb);
  pulseOsc.start();
  drone.start();
  stops.push(() => {
    try {
      amp.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
      pulseOsc.stop(ctx.currentTime + 0.35);
      drone.stop(ctx.currentTime + 0.35);
    } catch {
      /* ignore */
    }
  });

  const twinkle = () => {
    const base = 523.25 * (Math.random() < 0.5 ? 1 : 1.5);
    const det = (Math.random() * 2 - 1) * 12;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = base;
    osc.detune.value = det;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(g);
    g.connect(reverb);
    g.connect(destination);
    osc.start(t);
    osc.stop(t + 0.45);
  };
  const twInt = window.setInterval(() => {
    if (Math.random() < 0.45) twinkle();
  }, 900);
  stops.push(() => clearInterval(twInt));
  const airLfo = window.setInterval(() => {
    const t = ctx.currentTime;
    airFilter.frequency.setTargetAtTime(600 + Math.random() * 1200, t, 0.8);
    airGain.gain.setTargetAtTime(0.012 + Math.random() * 0.02, t, 0.8);
  }, 1600);
  stops.push(() => clearInterval(airLfo));
  return stops;
}
