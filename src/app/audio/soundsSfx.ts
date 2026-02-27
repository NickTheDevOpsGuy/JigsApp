/**
 * Theme-aware SFX builders for SoundEngine.
 * SoundEngine calls these with ctx + helpers (playTone, playNoiseClick, volume, snapSoundPref).
 */
import { getTheme } from "./audioUtils";

export type SnapSoundPref = "default" | "classic" | "soft" | "punchy" | "muted";
export type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export type SoundsSfxPlayTone = (
  ctx: AudioContext,
  opts: {
    freq: number;
    type?: OscillatorType;
    vol: number;
    duration: number;
    start?: number;
    freqRamp?: { to: number; at: number };
    pan?: number;
    toReverb?: boolean;
  },
) => void;

export type SoundsSfxPlayNoiseClick = (
  ctx: AudioContext,
  opts: {
    vol: number;
    duration: number;
    start?: number;
    bandpassHz?: number;
    toReverb?: boolean;
  },
) => void;

export interface SoundsSfxHelpers {
  volume: number;
  snapSoundPref: SnapSoundPref;
  playTone: SoundsSfxPlayTone;
  playNoiseClick: SoundsSfxPlayNoiseClick;
}

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
      vol: h.volume * 0.12 * volScale,
      duration: 0.06,
      start: t + 0.01,
    });
    h.playTone(ctx, {
      freq: 1470,
      type: "sine",
      vol: h.volume * 0.07 * volScale,
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
      freq: 740,
      type: "sine",
      vol: h.volume * 0.1 * volScale,
      duration: 0.08,
      start: t + 0.01,
    });
  } else if (pref === "punchy") {
    h.playTone(ctx, {
      freq: 160,
      type: "triangle",
      vol: h.volume * 0.12 * volScale,
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
      freq: 980,
      type: "sine",
      vol: h.volume * 0.1 * volScale,
      duration: 0.05,
      start: t + 0.015,
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
      freq: 660 * freqScale,
      type: "sine",
      vol: h.volume * 0.13 * volScale,
      duration: 0.07,
      start: t + 0.01,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: 990 * freqScale,
      type: "sine",
      vol: h.volume * 0.07 * volScale,
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
      freq: 740 * freqScale,
      type: "triangle",
      vol: h.volume * 0.12 * volScale,
      duration: 0.08,
      start: t + 0.01,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: 1110 * freqScale,
      type: "triangle",
      vol: h.volume * 0.06 * volScale,
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
      freq: 520 * freqScale,
      type: "sine",
      vol: h.volume * 0.1 * volScale,
      duration: 0.08,
      start: t + 0.01,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: 530 * freqScale,
      type: "sine",
      vol: h.volume * 0.08 * volScale,
      duration: 0.08,
      start: t + 0.012,
      toReverb: true,
    });
    h.playTone(ctx, {
      freq: 1040 * freqScale,
      type: "sine",
      vol: h.volume * 0.05 * volScale,
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
      freq: 620 * freqScale,
      type: "sine",
      vol: h.volume * 0.12 * volScale,
      duration: 0.07,
      start: t + 0.01,
    });
    h.playTone(ctx, {
      freq: 930 * freqScale,
      type: "sine",
      vol: h.volume * 0.06 * volScale,
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
      freq: 780 * freqScale,
      type: "triangle",
      vol: h.volume * 0.11 * volScale,
      duration: 0.07,
      start: t + 0.01,
    });
    h.playTone(ctx, {
      freq: 1170 * freqScale,
      type: "sine",
      vol: h.volume * 0.06 * volScale,
      duration: 0.05,
      start: t + 0.02,
    });
  }
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

type Note = {
  f: number;
  dt: number;
  dur: number;
  type?: OscillatorType;
  rev?: boolean;
};

export function playCompleteSfx(ctx: AudioContext, h: SoundsSfxHelpers) {
  const theme = getTheme();
  const t = ctx.currentTime;
  const vol = h.volume * 0.12;
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
      freq: n.f,
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
      freq: f,
      type: theme === "sunset" ? "triangle" : "sine",
      vol: h.volume * 0.07,
      duration: 0.45,
      start: chordT,
      toReverb: theme !== "light" && theme !== "dark",
    });
  }
}
