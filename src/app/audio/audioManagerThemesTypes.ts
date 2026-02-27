/**
 * Shared type for theme music creators (used by audioManager and theme modules).
 */
export type PlayVoiceHelpers = {
  playVoice: (
    ctx: AudioContext,
    destination: AudioNode,
    opts: {
      time: number;
      midi: number;
      duration: number;
      type: OscillatorType;
      gain: number;
      cutoff?: number;
      attack?: number;
      release?: number;
      detuneCents?: number;
    },
  ) => void;
  humanize: (t: number) => number;
};
