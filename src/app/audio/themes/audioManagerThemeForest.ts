/**
 * Forest theme: soft pad + bird chirps + gentle breeze.
 */
import { startSequencer } from "@/audio/core/audioUtils";
import type { PlayVoiceHelpers } from "./audioManagerThemesTypes";

export function createForestMusic(
  ctx: AudioContext,
  destination: AudioNode,
  helpers: PlayVoiceHelpers,
): { stop: () => void } {
  const { playVoice, humanize } = helpers;
  const forestMix = ctx.createGain();
  forestMix.gain.value = 1;
  forestMix.connect(destination);

  const bufSize = ctx.sampleRate * 2;
  const noise = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < bufSize; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    data[i] = (b0 + b1 + b2) / 6;
  }
  const breezeSrc = ctx.createBufferSource();
  breezeSrc.buffer = noise;
  breezeSrc.loop = true;
  const breezeF = ctx.createBiquadFilter();
  breezeF.type = "bandpass";
  breezeF.frequency.value = 280;
  breezeF.Q.value = 0.2;
  const breezeG = ctx.createGain();
  breezeG.gain.value = 0.04;
  breezeSrc.connect(breezeF);
  breezeF.connect(breezeG);
  breezeG.connect(forestMix);
  breezeSrc.start(0);

  let chirpCancelled = false;
  let chirpTimer: number;
  const scheduleChirp = () => {
    if (chirpCancelled) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400 + Math.random() * 1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      2200 + Math.random() * 600,
      ctx.currentTime + 0.08,
    );
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(g);
    g.connect(forestMix);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    chirpTimer = window.setTimeout(scheduleChirp, 1800 + Math.random() * 4000);
  };
  chirpTimer = window.setTimeout(scheduleChirp, 1200 + Math.random() * 2000);

  const bpm = 68;
  const chords: number[][] = [
    [50, 53, 57],
    [45, 48, 52],
    [52, 55, 59],
    [43, 47, 50],
  ];
  const arpPattern = [0, 1, 2, 1];
  const padGain = 0.022;
  const bassGain = 0.014;
  const arpGain = 0.009;
  const cutoff = 2800;

  const stopSeq = startSequencer(ctx, bpm, (time, step) => {
    const chordIndex = Math.floor(step / 4) % chords.length;
    const chord = chords[chordIndex];
    if (step % 4 === 0) {
      for (const n of chord) {
        playVoice(ctx, forestMix, {
          time: humanize(time),
          midi: n + 24,
          duration: 60 / bpm,
          type: "triangle",
          gain: padGain * (0.9 + Math.random() * 0.1),
          cutoff,
          attack: 0.12,
          release: 0.28,
        });
      }
      playVoice(ctx, forestMix, {
        time: humanize(time),
        midi: chord[0] + 12,
        duration: (60 / bpm) * 0.95,
        type: "sine",
        gain: bassGain,
        cutoff: 2000,
        attack: 0.03,
        release: 0.2,
      });
    }
    const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
    playVoice(ctx, forestMix, {
      time: humanize(time),
      midi: arpNote,
      duration: (60 / bpm / 2) * 0.9,
      type: "sine",
      gain: arpGain * (0.9 + Math.random() * 0.15),
      cutoff: 4500,
      attack: 0.015,
      release: 0.1,
    });
  });

  return {
    stop: () => {
      stopSeq();
      chirpCancelled = true;
      if (chirpTimer != null) clearTimeout(chirpTimer);
      breezeSrc.stop();
    },
  };
}
