/**
 * Light/Dark theme: minimal pad (Em -> C) + soft room tone.
 */
import { startSequencer } from "./audioUtils";
import type { PlayVoiceHelpers } from "./audioManagerThemesTypes";

export function createLightDarkMusic(
  ctx: AudioContext,
  destination: AudioNode,
  helpers: PlayVoiceHelpers,
): { stop: () => void } {
  const { playVoice, humanize } = helpers;
  const neutralMix = ctx.createGain();
  neutralMix.gain.value = 1;
  neutralMix.connect(destination);

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
  const roomSrc = ctx.createBufferSource();
  roomSrc.buffer = noise;
  roomSrc.loop = true;
  const roomF = ctx.createBiquadFilter();
  roomF.type = "bandpass";
  roomF.frequency.value = 180;
  roomF.Q.value = 0.15;
  const roomG = ctx.createGain();
  roomG.gain.value = 0.025;
  roomSrc.connect(roomF);
  roomF.connect(roomG);
  roomG.connect(neutralMix);
  roomSrc.start(0);

  const bpm = 48;
  const chords: number[][] = [
    [52, 55, 59],
    [48, 52, 55],
  ];
  const arpPattern = [0, 1, 2];
  const padGain = 0.022;
  const bassGain = 0.012;
  const arpGain = 0.008;
  const cutoff = 2800;

  const stopSeq = startSequencer(ctx, bpm, (time, step) => {
    const chordIndex = Math.floor(step / 8) % chords.length;
    const chord = chords[chordIndex];

    if (step % 8 === 0) {
      for (const n of chord) {
        playVoice(ctx, neutralMix, {
          time: humanize(time),
          midi: n + 24,
          duration: (60 / bpm) * 2,
          type: "triangle",
          gain: padGain * (0.9 + Math.random() * 0.1),
          cutoff,
          attack: 0.2,
          release: 0.4,
        });
      }
      playVoice(ctx, neutralMix, {
        time: humanize(time),
        midi: chord[0] + 12,
        duration: (60 / bpm) * 1.95,
        type: "sine",
        gain: bassGain,
        cutoff: 2000,
        attack: 0.06,
        release: 0.3,
      });
    }

    const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
    playVoice(ctx, neutralMix, {
      time: humanize(time),
      midi: arpNote,
      duration: (60 / bpm / 2) * 0.92,
      type: "sine",
      gain: arpGain * (0.85 + Math.random() * 0.2),
      cutoff: 4200,
      attack: 0.02,
      release: 0.15,
    });
  });

  return {
    stop: () => {
      stopSeq();
      roomSrc.stop();
    },
  };
}
