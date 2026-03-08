/**
 * Completion fanfare SFX (theme-aware chord).
 */
import { getTheme } from "@/audio/core/audioUtils";
import type { SoundsSfxHelpers, Note } from "./soundsSfxTypes";

export function playCompleteSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const theme = getTheme();
  const t = ctx.currentTime;
  const profileScale =
    h.profile === "soft-mobile" ? 0.9 : h.profile === "low-stimulation" ? 0.72 : 1;
  const vol = h.volume * 0.12 * profileScale;
  let notes: Note[] = [];

  if (theme === "ocean") {
    notes = [
      { f: 523.25, dt: 0.0, dur: 0.16, type: "sine", rev: true },
      { f: 659.25, dt: 0.14, dur: 0.16, type: "sine", rev: true },
      { f: 783.99, dt: 0.28, dur: 0.16, type: "sine", rev: true },
      { f: 1046.5, dt: 0.42, dur: 0.22, type: "sine", rev: true },
    ];
  } else if (theme === "sunset") {
    notes = [
      { f: 392.0, dt: 0.0, dur: 0.18, type: "triangle", rev: true },
      { f: 493.88, dt: 0.16, dur: 0.18, type: "triangle", rev: true },
      { f: 587.33, dt: 0.32, dur: 0.18, type: "triangle", rev: true },
      { f: 783.99, dt: 0.48, dur: 0.24, type: "triangle", rev: true },
    ];
  } else if (theme === "space") {
    notes = [
      { f: 349.23, dt: 0.0, dur: 0.18, type: "sine", rev: true },
      { f: 415.3, dt: 0.16, dur: 0.18, type: "sine", rev: true },
      { f: 523.25, dt: 0.32, dur: 0.18, type: "sine", rev: true },
      { f: 698.46, dt: 0.48, dur: 0.26, type: "sine", rev: true },
    ];
  } else if (theme === "forest") {
    notes = [
      { f: 392.0, dt: 0.0, dur: 0.18, type: "sine" },
      { f: 523.25, dt: 0.16, dur: 0.16, type: "sine" },
      { f: 659.25, dt: 0.3, dur: 0.16, type: "sine" },
      { f: 1046.5, dt: 0.44, dur: 0.22, type: "sine" },
    ];
  } else {
    notes = [
      { f: 523.25, dt: 0.0, dur: 0.16, type: "sine" },
      { f: 659.25, dt: 0.14, dur: 0.16, type: "sine" },
      { f: 783.99, dt: 0.28, dur: 0.16, type: "sine" },
      { f: 1046.5, dt: 0.42, dur: 0.22, type: "sine" },
    ];
  }

  for (const n of notes) {
    h.playTone(ctx, {
      freq: n.f * (1 + h.randomSigned() * 0.01),
      type: n.type ?? "sine",
      vol,
      duration: n.dur,
      start: t + n.dt,
      toReverb: n.rev ?? false,
    });
  }

  const chordT = t + 0.72;
  const chord: number[] =
    theme === "sunset"
      ? [392.0, 493.88, 587.33]
      : theme === "space"
        ? [349.23, 523.25, 698.46]
        : [523.25, 659.25, 783.99];

  for (const f of chord) {
    h.playTone(ctx, {
      freq: f * (1 + h.randomSigned() * 0.008),
      type: theme === "sunset" ? "triangle" : "sine",
      vol: h.volume * 0.07 * profileScale,
      duration: 0.45,
      start: chordT,
      toReverb: theme !== "light" && theme !== "dark",
    });
  }
}
