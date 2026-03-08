/**
 * Snap SFX: pref-based (classic/soft/punchy) and theme-default.
 */
import { getTheme } from "@/audio/core/audioUtils";
import { clamp01, type SoundsSfxHelpers, type SnapSoundPref } from "./soundsSfxTypes";

function withVariation(freq: number, h: SoundsSfxHelpers): number {
  const jitterPct = h.profile === "low-stimulation" ? 0.008 : 0.015;
  return Math.max(80, freq * (1 + h.randomSigned() * jitterPct));
}

function withVol(vol: number, h: SoundsSfxHelpers): number {
  const profileScale =
    h.profile === "soft-mobile" ? 0.9 : h.profile === "low-stimulation" ? 0.75 : 1;
  const randomScale = 1 + h.randomSigned() * 0.06;
  return Math.max(0.0002, vol * profileScale * randomScale);
}

export function playSnapByPrefSfx(
  ctx: AudioContext,
  h: SoundsSfxHelpers,
  pref: Exclude<SnapSoundPref, "default" | "muted">,
  groupSize: number,
) {
  const t = ctx.currentTime;
  const volScale = Math.max(0.55, Math.min(1, 0.55 + (groupSize - 2) * 0.05));

  if (pref === "classic") {
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.06 * volScale,
      duration: 0.06,
      start: t,
      bandpassHz: 1700,
    });
    h.playTone(ctx, {
      freq: 980,
      type: "triangle",
      vol: withVol(h.volume * 0.12 * volScale, h),
      duration: 0.06,
      start: t + 0.01,
    });
    h.playTone(ctx, {
      freq: withVariation(1470, h),
      type: "sine",
      vol: withVol(h.volume * 0.07 * volScale, h),
      duration: 0.05,
      start: t + 0.02,
    });
  } else if (pref === "soft") {
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.04 * volScale,
      duration: 0.07,
      start: t,
      bandpassHz: 1200,
    });
    h.playTone(ctx, {
      freq: withVariation(740, h),
      type: "sine",
      vol: withVol(h.volume * 0.1 * volScale, h),
      duration: 0.08,
      start: t + 0.01,
    });
  } else if (pref === "punchy") {
    h.playTone(ctx, {
      freq: withVariation(160, h),
      type: "triangle",
      vol: withVol(h.volume * 0.12 * volScale, h),
      duration: 0.05,
      start: t,
    });
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.06 * volScale,
      duration: 0.05,
      start: t + 0.01,
      bandpassHz: 1900,
    });
    h.playTone(ctx, {
      freq: withVariation(980, h),
      type: "sine",
      vol: withVol(h.volume * 0.1 * volScale, h),
      duration: 0.05,
      start: t + 0.015,
    });
  }
}

function playSnapDefaultSfx(ctx: AudioContext, h: SoundsSfxHelpers, groupSize: number) {
  const theme = getTheme();
  const t = ctx.currentTime;
  const volScale = clamp01(0.55 + (groupSize - 2) * 0.05);
  const freqScale = Math.max(0.7, 1 - (groupSize - 1) * 0.04);

  if (theme === "ocean") {
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.05 * volScale,
      duration: 0.06,
      start: t,
      bandpassHz: 1100,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: withVariation(660 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.13 * volScale, h),
      duration: 0.07,
      start: t + 0.01,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: withVariation(990 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.07 * volScale, h),
      duration: 0.06,
      start: t + 0.02,
      toReverb: true,
    });
  } else if (theme === "sunset") {
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.045 * volScale,
      duration: 0.06,
      start: t,
      bandpassHz: 1400,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: withVariation(740 * freqScale, h),
      type: "triangle",
      vol: withVol(h.volume * 0.12 * volScale, h),
      duration: 0.08,
      start: t + 0.01,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: withVariation(1110 * freqScale, h),
      type: "triangle",
      vol: withVol(h.volume * 0.06 * volScale, h),
      duration: 0.06,
      start: t + 0.02,
      toReverb: true,
    });
  } else if (theme === "space") {
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.04 * volScale,
      duration: 0.05,
      start: t,
      bandpassHz: 1800,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: withVariation(520 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.1 * volScale, h),
      duration: 0.08,
      start: t + 0.01,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: withVariation(530 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.08 * volScale, h),
      duration: 0.08,
      start: t + 0.012,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: withVariation(1040 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.05 * volScale, h),
      duration: 0.05,
      start: t + 0.03,
      toReverb: true,
    });
  } else if (theme === "forest") {
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.045 * volScale,
      duration: 0.06,
      start: t,
      bandpassHz: 1300,
    });
    h.playTone(ctx, {
      freq: withVariation(620 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.12 * volScale, h),
      duration: 0.07,
      start: t + 0.01,
    });
    h.playTone(ctx, {
      freq: withVariation(930 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.06 * volScale, h),
      duration: 0.06,
      start: t + 0.02,
    });
  } else {
    h.playNoiseClick(ctx, {
      vol: h.volume * 0.05 * volScale,
      duration: 0.05,
      start: t,
      bandpassHz: 1600,
    });
    h.playTone(ctx, {
      freq: withVariation(780 * freqScale, h),
      type: "triangle",
      vol: withVol(h.volume * 0.11 * volScale, h),
      duration: 0.07,
      start: t + 0.01,
    });
    h.playTone(ctx, {
      freq: withVariation(1170 * freqScale, h),
      type: "sine",
      vol: withVol(h.volume * 0.06 * volScale, h),
      duration: 0.05,
      start: t + 0.02,
    });
  }
}

export function playSnapSfx(ctx: AudioContext, h: SoundsSfxHelpers, groupSize: number) {
  const pref = h.snapSoundPref;
  if (pref === "muted") return;
  if (pref !== "default") {
    playSnapByPrefSfx(ctx, h, pref, groupSize);
    return;
  }
  playSnapDefaultSfx(ctx, h, groupSize);
}
