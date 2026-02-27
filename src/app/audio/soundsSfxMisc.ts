/**
 * Pickup, place, rotate, undo SFX (theme-aware).
 */
import { getTheme } from "./audioUtils";
import type { SoundsSfxHelpers } from "./soundsSfxTypes";

export function playPickupSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const theme = getTheme();
  const t = ctx.currentTime;
  h.playNoiseClick(ctx, {
    vol: h.volume * 0.05,
    duration: 0.05,
    start: t,
    bandpassHz: theme === "ocean" ? 1200 : 1600,
    toReverb: theme === "sunset" || theme === "space",
  });
  h.playTone(ctx, {
    freq: theme === "ocean" ? 520 : theme === "forest" ? 640 : 700,
    type: "sine",
    vol: h.volume * 0.09,
    duration: 0.07,
    start: t + 0.01,
    freqRamp: { to: theme === "space" ? 900 : 760, at: 0.05 },
    toReverb: theme !== "light" && theme !== "dark",
  });
}

export function playPlaceSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const theme = getTheme();
  const t = ctx.currentTime;
  const base =
    theme === "ocean"
      ? 210
      : theme === "forest"
        ? 240
        : theme === "sunset"
          ? 220
          : theme === "space"
            ? 180
            : 230;

  h.playTone(ctx, {
    freq: base,
    type: theme === "space" ? "sine" : "triangle",
    vol: h.volume * 0.16,
    duration: 0.12,
    start: t,
    freqRamp: { to: base * 0.75, at: 0.1 },
    toReverb: theme === "ocean" || theme === "sunset",
  });
  h.playNoiseClick(ctx, {
    vol: h.volume * 0.05,
    duration: 0.05,
    start: t + 0.01,
    bandpassHz: theme === "space" ? 2000 : 1400,
    toReverb: theme === "ocean" || theme === "sunset",
  });
}

export function playRotateSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const theme = getTheme();
  const t = ctx.currentTime;
  h.playNoiseClick(ctx, {
    vol: h.volume * 0.04,
    duration: 0.08,
    start: t,
    bandpassHz: theme === "space" ? 1600 : 1200,
    toReverb: theme !== "light" && theme !== "dark",
  });
  h.playTone(ctx, {
    freq: theme === "sunset" ? 260 : theme === "ocean" ? 300 : 320,
    type: "sine",
    vol: h.volume * 0.07,
    duration: 0.09,
    start: t + 0.01,
    freqRamp: { to: theme === "space" ? 520 : 480, at: 0.08 },
    toReverb: theme === "sunset" || theme === "ocean" || theme === "space",
  });
}

export function playUndoSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const theme = getTheme();
  const t = ctx.currentTime;
  const startFreq = theme === "space" ? 520 : 420;
  const endFreq = theme === "space" ? 260 : 220;
  h.playTone(ctx, {
    freq: startFreq,
    type: "sine",
    vol: h.volume * 0.08,
    duration: 0.09,
    start: t,
    freqRamp: { to: endFreq, at: 0.08 },
    toReverb: theme !== "light" && theme !== "dark",
  });
}
