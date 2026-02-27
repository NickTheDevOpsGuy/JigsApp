/**
 * sounds.ts – SFX, haptics, and (optionally) alternate ambient music.
 *
 * SFX are theme-aware via getTheme(). Alternate ambient loops (ocean/sunset/space/forest/light-dark)
 * live in soundsAmbient and are started via soundEngineAmbient.
 *
 * Uses Web Audio API only (no external assets).
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import {
  clamp01,
  resumeIfSuspended,
  createNoiseBuffer,
  createTinyImpulse,
} from "./soundsDsp";
import { startAmbientFromTheme, getAmbientTheme } from "./soundEngineAmbient";
import {
  playPickupSfx,
  playSnapSfx,
  playPlaceSfx,
  playRotateSfx,
  playUndoSfx,
  playCompleteSfx,
} from "./soundsSfx";

export type SoundType = "snap" | "place" | "rotate" | "complete" | "pickup" | "undo";
export type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";
export type SnapSoundPref = "default" | "classic" | "soft" | "punchy" | "muted";

const SOUND_ENABLED_KEY = "phuzzle:soundEnabled";
const SOUND_VOLUME_KEY = "phuzzle:soundVolume";
const HAPTICS_ENABLED_KEY = "phuzzle:hapticsEnabled";
const SNAP_SOUND_KEY = "phuzzle:snapSound";

const MUSIC_ENABLED_KEY = "phuzzle:musicEnabled";
const MUSIC_VOLUME_KEY = "phuzzle:musicVolume";

type StopFn = () => void;

class SoundEngine {
  private audioContext: AudioContext | null = null;

  // SFX channel prefs
  private enabled = true;
  private volume = 0.3;
  private hapticsEnabled = true;
  private snapSoundPref: SnapSoundPref = "default";

  // Music channel prefs
  private musicEnabled = false;
  private musicVolume = 0.35;
  private paused = false;

  // Ambient nodes
  private ambientGain: GainNode | null = null;
  private ambientStops: StopFn[] = [];
  private ambientTheme: Theme | null = null;

  // Shared DSP nodes (created lazily)
  private masterReverb: ConvolverNode | null = null;

  private getContext(): AudioContext | null {
    if (this.audioContext) return this.audioContext;
    try {
      this.audioContext = new AudioContext();
      return this.audioContext;
    } catch {
      console.warn("Web Audio API not supported");
      return null;
    }
  }

  /** Call this from a user gesture (first tap) if you want to guarantee audio starts on iOS. */
  unlockAudioFromGesture() {
    const ctx = this.getContext();
    if (!ctx) return;
    resumeIfSuspended(ctx);
  }

  // ---------- Preferences ----------
  loadPreferences() {
    const enabled = safeLocalStorage.getItem(SOUND_ENABLED_KEY);
    if (enabled !== null) this.enabled = enabled === "true";

    const volume = safeLocalStorage.getItem(SOUND_VOLUME_KEY);
    if (volume !== null) this.volume = clamp01(parseFloat(volume));

    const haptics = safeLocalStorage.getItem(HAPTICS_ENABLED_KEY);
    if (haptics !== null) this.hapticsEnabled = haptics === "true";

    const snap = safeLocalStorage.getItem(SNAP_SOUND_KEY);
    if (
      snap !== null &&
      ["default", "classic", "soft", "punchy", "muted"].includes(snap)
    ) {
      this.snapSoundPref = snap as SnapSoundPref;
    }

    const m = safeLocalStorage.getItem(MUSIC_ENABLED_KEY);
    if (m !== null) this.musicEnabled = m === "true";

    const mv = safeLocalStorage.getItem(MUSIC_VOLUME_KEY);
    if (mv !== null) this.musicVolume = clamp01(parseFloat(mv) || 0.35);
  }

  // ---------- Public setters/getters ----------
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    safeLocalStorage.setItem(SOUND_ENABLED_KEY, enabled ? "true" : "false");
  }
  isEnabled() {
    return this.enabled;
  }

  setVolume(volume: number) {
    this.volume = clamp01(volume);
    safeLocalStorage.setItem(SOUND_VOLUME_KEY, this.volume.toString());
  }
  getVolume() {
    return this.volume;
  }

  setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    safeLocalStorage.setItem(HAPTICS_ENABLED_KEY, enabled ? "true" : "false");
  }
  isHapticsEnabled() {
    return this.hapticsEnabled;
  }

  setSnapSoundPref(pref: SnapSoundPref) {
    this.snapSoundPref = pref;
    safeLocalStorage.setItem(SNAP_SOUND_KEY, pref);
  }
  getSnapSoundPref() {
    return this.snapSoundPref;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    safeLocalStorage.setItem(MUSIC_ENABLED_KEY, enabled ? "true" : "false");
    if (enabled && !this.paused) {
      void this.startAmbient();
    } else {
      this.stopAmbient();
    }
  }
  isMusicEnabled() {
    return this.musicEnabled;
  }

  setMusicVolume(vol: number) {
    this.musicVolume = clamp01(vol);
    safeLocalStorage.setItem(MUSIC_VOLUME_KEY, this.musicVolume.toString());
    this.updateAmbientGain();
  }
  getMusicVolume() {
    return this.musicVolume;
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.stopAmbient();
    else if (this.musicEnabled) void this.startAmbient();
  }
  isPaused() {
    return this.paused;
  }

  onThemeChange() {
    if (this.musicEnabled && !this.paused) {
      void this.startAmbient();
    }
  }

  tryStartAmbientIfEnabled() {
    if (this.musicEnabled && !this.paused) {
      void this.startAmbient();
    }
  }

  /** Stop ambient when leaving the play screen (e.g. navigating to menu). */
  leavePlayScreen() {
    this.stopAmbient();
  }

  // ---------- Haptics ----------
  private vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }

  private triggerHaptic(sound: SoundType, groupSize?: number) {
    switch (sound) {
      case "pickup":
        this.vibrate(10);
        break;
      case "snap": {
        const snapStrength = groupSize != null ? Math.min(50, 15 + groupSize * 6) : 25;
        this.vibrate(snapStrength);
        break;
      }
      case "place":
        this.vibrate(30);
        break;
      case "rotate":
        this.vibrate(12);
        break;
      case "complete":
        this.vibrate([40, 45, 40, 45, 90]);
        break;
      case "undo":
        this.vibrate(18);
        break;
    }
  }

  // ---------- Core tone/noise helpers ----------
  private ensureReverb(ctx: AudioContext) {
    if (this.masterReverb) return this.masterReverb;
    const conv = ctx.createConvolver();
    conv.buffer = createTinyImpulse(ctx);
    this.masterReverb = conv;
    return conv;
  }

  private playTone(
    ctx: AudioContext,
    opts: {
      freq: number;
      type?: OscillatorType;
      vol: number;
      duration: number;
      start?: number;
      freqRamp?: { to: number; at: number };
      pan?: number; // -1..1
      toReverb?: boolean;
    },
  ) {
    const start = opts.start ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, start);
    if (opts.freqRamp) {
      osc.frequency.exponentialRampToValueAtTime(
        opts.freqRamp.to,
        start + opts.freqRamp.at,
      );
    }

    // Smooth attack, fast decay
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.vol), start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);

    panner.pan.value = clamp01((opts.pan ?? 0) + 1) * 2 - 1;

    osc.connect(gain);
    gain.connect(panner);

    if (opts.toReverb) {
      const reverb = this.ensureReverb(ctx);
      const wet = ctx.createGain();
      wet.gain.value = 0.25;
      panner.connect(reverb);
      reverb.connect(wet);
      wet.connect(ctx.destination);

      // still send dry
      const dry = ctx.createGain();
      dry.gain.value = 0.85;
      panner.connect(dry);
      dry.connect(ctx.destination);
    } else {
      panner.connect(ctx.destination);
    }

    osc.start(start);
    osc.stop(start + opts.duration + 0.02);
  }

  private playNoiseClick(
    ctx: AudioContext,
    opts: {
      vol: number;
      duration: number;
      start?: number;
      bandpassHz?: number;
      toReverb?: boolean;
    },
  ) {
    const start = opts.start ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, opts.duration);

    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = opts.bandpassHz ?? 1400;
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.vol), start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);

    src.connect(filter);
    filter.connect(gain);

    if (opts.toReverb) {
      const reverb = this.ensureReverb(ctx);
      const wet = ctx.createGain();
      wet.gain.value = 0.22;
      gain.connect(reverb);
      reverb.connect(wet);
      wet.connect(ctx.destination);

      const dry = ctx.createGain();
      dry.gain.value = 0.9;
      gain.connect(dry);
      dry.connect(ctx.destination);
    } else {
      gain.connect(ctx.destination);
    }

    src.start(start);
    src.stop(start + opts.duration + 0.02);
  }

  // ---------- SFX ----------
  play(sound: SoundType, opts?: { groupSize?: number }) {
    this.triggerHaptic(sound, opts?.groupSize);

    if (!this.enabled) return;

    const ctx = this.getContext();
    if (!ctx) return;
    resumeIfSuspended(ctx);

    const sfxHelpers = {
      volume: this.volume,
      snapSoundPref: this.snapSoundPref,
      playTone: this.playTone.bind(this),
      playNoiseClick: this.playNoiseClick.bind(this),
    };

    switch (sound) {
      case "pickup":
        playPickupSfx(ctx, sfxHelpers);
        break;
      case "snap":
        if (this.snapSoundPref === "muted") break;
        playSnapSfx(ctx, sfxHelpers, opts?.groupSize ?? 2);
        break;
      case "place":
        playPlaceSfx(ctx, sfxHelpers);
        break;
      case "rotate":
        playRotateSfx(ctx, sfxHelpers);
        break;
      case "complete":
        playCompleteSfx(ctx, sfxHelpers);
        break;
      case "undo":
        playUndoSfx(ctx, sfxHelpers);
        break;
    }
  }

  // ---------- Ambient music ----------
  private updateAmbientGain() {
    if (!this.ambientGain) return;
    const ctx = this.getContext();
    if (!ctx) return;
    this.ambientGain.gain.setTargetAtTime(this.musicVolume, ctx.currentTime, 0.08);
  }

  private stopAmbient() {
    for (const stop of this.ambientStops) {
      try {
        stop();
      } catch {
        // ignore
      }
    }
    this.ambientStops = [];

    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {
        // ignore
      }
    }
    this.ambientGain = null;
    this.ambientTheme = null;
  }

  private async startAmbient() {
    this.stopAmbient();

    const ctx = this.getContext();
    if (!ctx) return;
    if (!this.musicEnabled || this.paused) return;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
      if (!this.musicEnabled || this.paused) return;
    }

    const theme = getAmbientTheme();
    this.ambientTheme = theme;

    const reverb = this.ensureReverb(ctx);
    const { stopFns, gainNode } = startAmbientFromTheme(
      ctx,
      theme,
      this.musicVolume,
      reverb,
      {
        playTone: this.playTone.bind(this),
        playNoiseClick: this.playNoiseClick.bind(this),
      },
    );
    this.ambientGain = gainNode;
    this.ambientStops = stopFns;
  }
}

export const soundEngine = new SoundEngine();
soundEngine.loadPreferences();

/** SFX + haptics. Ambient music is @/audio/audioManager. */
export const soundManager = soundEngine;
