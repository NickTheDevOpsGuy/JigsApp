/**
 * Sunset theme: warm pad + golden-hour texture + soft dusk rumble.
 */
import { startSequencer } from "@/audio/core/audioUtils";
import type { PlayVoiceHelpers } from "./audioManagerThemesTypes";

export function createSunsetMusic(
  ctx: AudioContext,
  destination: AudioNode,
  helpers: PlayVoiceHelpers,
): { stop: () => void } {
  const { playVoice, humanize } = helpers;
  const sunsetMix = ctx.createGain();
  sunsetMix.gain.value = 1;
  sunsetMix.connect(destination);

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

  const warmSrc = ctx.createBufferSource();
  warmSrc.buffer = noise;
  warmSrc.loop = true;
  const warmF = ctx.createBiquadFilter();
  warmF.type = "bandpass";
  warmF.frequency.value = 220;
  warmF.Q.value = 0.25;
  const warmG = ctx.createGain();
  warmG.gain.value = 0.055;
  warmSrc.connect(warmF);
  warmF.connect(warmG);
  warmG.connect(sunsetMix);
  warmSrc.start(0);

  const rumbleSrc = ctx.createBufferSource();
  rumbleSrc.buffer = noise;
  rumbleSrc.loop = true;
  const rumbleF = ctx.createBiquadFilter();
  rumbleF.type = "bandpass";
  rumbleF.frequency.value = 65;
  rumbleF.Q.value = 0.2;
  const rumbleG = ctx.createGain();
  rumbleG.gain.value = 0.05;
  rumbleSrc.connect(rumbleF);
  rumbleF.connect(rumbleG);
  rumbleG.connect(sunsetMix);
  rumbleSrc.start(0);

  const bpm = 64;
  const chords: number[][] = [
    [41, 45, 48, 52],
    [48, 52, 55, 60],
    [43, 47, 50, 55],
    [45, 48, 52, 57],
  ];
  const arpPattern = [0, 2, 3, 1];
  const padGain = 0.026;
  const bassGain = 0.015;
  const arpGain = 0.011;
  const padCutoff = 3400;
  const arpCutoff = 4600;

  const stopSeq = startSequencer(ctx, bpm, (time, step) => {
    const chordIndex = Math.floor(step / 4) % chords.length;
    const chord = chords[chordIndex];

    if (step % 4 === 0) {
      for (const n of chord) {
        playVoice(ctx, sunsetMix, {
          time: humanize(time),
          midi: n + 24,
          duration: 60 / bpm,
          type: "triangle",
          gain: padGain * (0.88 + Math.random() * 0.08),
          cutoff: padCutoff,
          attack: 0.1,
          release: 0.24,
          detuneCents: (Math.random() - 0.5) * 4,
        });
      }
      playVoice(ctx, sunsetMix, {
        time: humanize(time),
        midi: chord[0] + 12,
        duration: (60 / bpm) * 0.95,
        type: "sine",
        gain: bassGain,
        cutoff: 2200,
        attack: 0.025,
        release: 0.18,
      });
    }

    const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
    playVoice(ctx, sunsetMix, {
      time: humanize(time),
      midi: arpNote,
      duration: (60 / bpm / 2) * 0.9,
      type: "sine",
      gain: arpGain * (0.9 + Math.random() * 0.15),
      cutoff: arpCutoff,
      attack: 0.012,
      release: 0.09,
    });
  });

  return {
    stop: () => {
      stopSeq();
      warmSrc.stop();
      rumbleSrc.stop();
    },
  };
}
