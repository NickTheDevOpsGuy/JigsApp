/**
 * Space theme: deep drone + cosmic hiss + slow chord pad.
 */
import { startSequencer } from "@/audio/core/audioUtils";
import type { PlayVoiceHelpers } from "./audioManagerThemesTypes";

export function createSpaceMusic(
  ctx: AudioContext,
  destination: AudioNode,
  helpers: PlayVoiceHelpers,
): { stop: () => void } {
  const { playVoice, humanize } = helpers;
  const spaceMix = ctx.createGain();
  spaceMix.gain.value = 1;
  spaceMix.connect(destination);

  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 36;
  const droneG = ctx.createGain();
  droneG.gain.value = 0.06;
  drone.connect(droneG);
  droneG.connect(spaceMix);
  drone.start(0);

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
  const cosmicSrc = ctx.createBufferSource();
  cosmicSrc.buffer = noise;
  cosmicSrc.loop = true;
  const cosmicF = ctx.createBiquadFilter();
  cosmicF.type = "bandpass";
  cosmicF.frequency.value = 2400;
  cosmicF.Q.value = 0.15;
  const cosmicG = ctx.createGain();
  cosmicG.gain.value = 0.03;
  cosmicSrc.connect(cosmicF);
  cosmicF.connect(cosmicG);
  cosmicG.connect(spaceMix);
  cosmicSrc.start(0);

  const bpm = 54;
  const chords: number[][] = [
    [45, 48, 52],
    [52, 55, 59],
    [47, 50, 54],
    [41, 45, 48],
  ];
  const arpPattern = [0, 2, 1, 0];
  const padGain = 0.024;
  const bassGain = 0.015;
  const arpGain = 0.008;
  const padCutoff = 2000;
  const arpCutoff = 3600;

  const stopSeq = startSequencer(ctx, bpm, (time, step) => {
    const chordIndex = Math.floor(step / 4) % chords.length;
    const chord = chords[chordIndex];
    if (step % 4 === 0) {
      for (const n of chord) {
        playVoice(ctx, spaceMix, {
          time: humanize(time),
          midi: n + 24,
          duration: (60 / bpm) * 1.1,
          type: "triangle",
          gain: padGain * (0.85 + Math.random() * 0.1),
          cutoff: padCutoff,
          attack: 0.15,
          release: 0.35,
          detuneCents: (Math.random() - 0.5) * 8,
        });
      }
      playVoice(ctx, spaceMix, {
        time: humanize(time),
        midi: chord[0] + 12,
        duration: (60 / bpm) * 1.05,
        type: "sine",
        gain: bassGain,
        cutoff: 1600,
        attack: 0.05,
        release: 0.25,
      });
    }
    const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
    playVoice(ctx, spaceMix, {
      time: humanize(time),
      midi: arpNote,
      duration: (60 / bpm / 2) * 0.95,
      type: "sine",
      gain: arpGain * (0.85 + Math.random() * 0.2),
      cutoff: arpCutoff,
      attack: 0.02,
      release: 0.12,
    });
  });

  return {
    stop: () => {
      stopSeq();
      drone.stop();
      cosmicSrc.stop();
    },
  };
}
