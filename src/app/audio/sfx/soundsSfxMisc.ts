/**
 * Pickup, place, rotate, undo SFX (theme-aware).
 */
import { getTheme } from "@/audio/core/audioUtils";
import type { SoundsSfxHelpers } from "./soundsSfxTypes";

function profileVol(h: SoundsSfxHelpers, base: number): number {
  const scale =
    h.profile === "soft-mobile" ? 0.88 : h.profile === "low-stimulation" ? 0.7 : 1;
  return Math.max(0.0002, base * scale);
}

export function playPickupSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const theme = getTheme();
  const t = ctx.currentTime;
  h.playNoiseClick(ctx, {
    vol: profileVol(h, h.volume * 0.05),
    duration: 0.05,
    start: t,
    bandpassHz: theme === "ocean" ? 1200 : 1600,
    toReverb: theme === "sunset" || theme === "space",
  });
  h.playTone(ctx, {
    freq: theme === "ocean" ? 520 : theme === "forest" ? 640 : 700,
    type: "sine",
    vol: profileVol(h, h.volume * 0.09),
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
    vol: profileVol(h, h.volume * 0.16),
    duration: 0.12,
    start: t,
    freqRamp: { to: base * 0.75, at: 0.1 },
    toReverb: theme === "ocean" || theme === "sunset",
  });
  h.playNoiseClick(ctx, {
    vol: profileVol(h, h.volume * 0.05),
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
    vol: profileVol(h, h.volume * 0.04),
    duration: 0.08,
    start: t,
    bandpassHz: theme === "space" ? 1600 : 1200,
    toReverb: theme !== "light" && theme !== "dark",
  });
  h.playTone(ctx, {
    freq: theme === "sunset" ? 260 : theme === "ocean" ? 300 : 320,
    type: "sine",
    vol: profileVol(h, h.volume * 0.07),
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
    vol: profileVol(h, h.volume * 0.08),
    duration: 0.09,
    start: t,
    freqRamp: { to: endFreq, at: 0.08 },
    toReverb: theme !== "light" && theme !== "dark",
  });
}

export function playLockSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const t = ctx.currentTime;
  h.playNoiseClick(ctx, {
    vol: profileVol(h, h.volume * 0.035),
    duration: 0.045,
    start: t,
    bandpassHz: h.profile === "soft-mobile" ? 1100 : 1450,
  });
  h.playTone(ctx, {
    freq: 460 + h.randomSigned() * 8,
    type: "triangle",
    vol: profileVol(h, h.volume * 0.06),
    duration: 0.06,
    start: t + 0.005,
    freqRamp: { to: 520, at: 0.05 },
  });
}

export function playHoverSnapSfx(
  ctx: AudioContext,
  h: SoundsSfxHelpers,
  proximity = 0.5,
) {
  if (h.profile === "low-stimulation") return;
  const t = ctx.currentTime;
  const p = Math.max(0, Math.min(1, proximity));
  const base = 560 + p * 180;
  h.playTone(ctx, {
    freq: base + h.randomSigned() * 5,
    type: "sine",
    vol: profileVol(h, h.volume * (0.02 + p * 0.02)),
    duration: 0.035,
    start: t,
    toReverb: h.profile === "soft-mobile",
  });
}
