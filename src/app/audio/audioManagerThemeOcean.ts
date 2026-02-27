/**
 * Ocean theme: waves (filtered noise) + chord pad.
 */
import { startSequencer } from "./audioUtils";
import type { PlayVoiceHelpers } from "./audioManagerThemesTypes";

export function createOceanMusic(
  ctx: AudioContext,
  destination: AudioNode,
  helpers: PlayVoiceHelpers,
): { stop: () => void } {
  const { playVoice, humanize } = helpers;
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

  const waveMix = ctx.createGain();
  waveMix.gain.value = 0.12;
  waveMix.connect(destination);

  const rumble = ctx.createBufferSource();
  rumble.buffer = noise;
  rumble.loop = true;
  const rumbleF = ctx.createBiquadFilter();
  rumbleF.type = "bandpass";
  rumbleF.frequency.value = 55;
  rumbleF.Q.value = 0.25;
  const rumbleG = ctx.createGain();
  rumbleG.gain.value = 0.22;
  rumble.connect(rumbleF);
  rumbleF.connect(rumbleG);
  rumbleG.connect(waveMix);

  const waves = ctx.createBufferSource();
  waves.buffer = noise;
  waves.loop = true;
  const waveF = ctx.createBiquadFilter();
  waveF.type = "bandpass";
  waveF.frequency.value = 140;
  waveF.Q.value = 0.35;
  const waveG = ctx.createGain();
  waveG.gain.value = 0.18;
  waves.connect(waveF);
  waveF.connect(waveG);
  waveG.connect(waveMix);

  const foam = ctx.createBufferSource();
  foam.buffer = noise;
  foam.loop = true;
  const foamF = ctx.createBiquadFilter();
  foamF.type = "bandpass";
  foamF.frequency.value = 380;
  foamF.Q.value = 0.4;
  const foamG = ctx.createGain();
  foamG.gain.value = 0.06;
  foam.connect(foamF);
  foamF.connect(foamG);
  foamG.connect(waveMix);

  rumble.start(0);
  waves.start(0);
  foam.start(0);

  const bpm = 72;
  const chords: number[][] = [
    [48, 52, 55, 59],
    [45, 48, 52, 55],
    [41, 45, 48, 52],
    [43, 47, 50, 53],
  ];
  const arpPattern = [0, 2, 1, 2];
  const padGain = 0.024;
  const bassGain = 0.014;
  const arpGain = 0.011;
  const padCutoff = 2200;
  const bassCutoff = 1500;
  const arpCutoff = 4200;

  const stopSeq = startSequencer(ctx, bpm, (time, step) => {
    const chordIndex = Math.floor(step / 4) % chords.length;
    const chord = chords[chordIndex];

    if (step % 4 === 0) {
      for (const n of chord) {
        playVoice(ctx, destination, {
          time: humanize(time),
          midi: n + 24,
          duration: 60 / bpm,
          type: "triangle",
          gain: padGain * (0.85 + Math.random() * 0.1),
          cutoff: padCutoff,
          attack: 0.09,
          release: 0.22,
          detuneCents: -6,
        });
        playVoice(ctx, destination, {
          time: humanize(time),
          midi: n + 24,
          duration: 60 / bpm,
          type: "triangle",
          gain: padGain * (0.75 + Math.random() * 0.1),
          cutoff: padCutoff,
          attack: 0.09,
          release: 0.22,
          detuneCents: 6,
        });
      }
      playVoice(ctx, destination, {
        time: humanize(time),
        midi: chord[0] + 12,
        duration: (60 / bpm) * 0.95,
        type: "sine",
        gain: bassGain,
        cutoff: bassCutoff,
        attack: 0.02,
        release: 0.16,
      });
    }

    const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
    playVoice(ctx, destination, {
      time: humanize(time),
      midi: arpNote,
      duration: (60 / bpm / 2) * 0.92,
      type: "sine",
      gain: arpGain * (0.9 + Math.random() * 0.15),
      cutoff: arpCutoff,
      attack: 0.01,
      release: 0.08,
    });
  });

  return {
    stop: () => {
      stopSeq();
      rumble.stop();
      waves.stop();
      foam.stop();
    },
  };
}
