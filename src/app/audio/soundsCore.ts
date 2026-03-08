import {
  clamp01,
  resumeIfSuspended,
  createTinyImpulse,
} from "./soundsDsp";
import {
  loadSoundPreferencesFromStorage,
  saveSoundPreference,
  type SnapSoundPref as SnapSoundPrefType,
} from "./soundsPreferences";
import { startAmbientFromTheme, getAmbientTheme } from "./soundEngineAmbient";
import {
  playPickupSfx,
  playSnapSfx,
  playPlaceSfx,
  playRotateSfx,
  playUndoSfx,
  playCompleteSfx,
} from "./soundsSfx";
import { logger } from "@/utils/logger";
import { triggerHaptic } from "./soundsCoreHaptics";
import {
  ensureReverb as ensureReverbNode,
  playNoiseClick as playNoiseClickCore,
  playTone as playToneCore,
} from "./soundsCorePlayback";

export type SoundType = "snap" | "place" | "rotate" | "complete" | "pickup" | "undo";
export type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";
export type SnapSoundPref = SnapSoundPrefType;
type StopFn = () => void;

class SoundEngine {
  private audioContext: AudioContext | null = null;

  private enabled = true;
  private volume = 0.3;
  private hapticsEnabled = true;
  private snapSoundPref: SnapSoundPref = "default";

  private musicEnabled = false;
  private musicVolume = 0.35;
  private paused = false;

  private ambientGain: GainNode | null = null;
  private ambientStops: StopFn[] = [];
  private ambientTheme: Theme | null = null;

  private masterReverb: ConvolverNode | null = null;

  private getContext(): AudioContext | null {
    if (this.audioContext) return this.audioContext;
    try {
      this.audioContext = new AudioContext();
      return this.audioContext;
    } catch {
      logger.warn("Web Audio API not supported");
      return null;
    }
  }

  unlockAudioFromGesture() {
    const ctx = this.getContext();
    if (!ctx) return;
    resumeIfSuspended(ctx);
  }

  loadPreferences() {
    const prefs = loadSoundPreferencesFromStorage();
    this.enabled = prefs.enabled;
    this.volume = prefs.volume;
    this.hapticsEnabled = prefs.hapticsEnabled;
    this.snapSoundPref = prefs.snapSoundPref;
    this.musicEnabled = prefs.musicEnabled;
    this.musicVolume = prefs.musicVolume;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    saveSoundPreference("enabled", enabled);
  }
  isEnabled() {
    return this.enabled;
  }

  setVolume(volume: number) {
    this.volume = clamp01(volume);
    saveSoundPreference("volume", this.volume);
  }
  getVolume() {
    return this.volume;
  }

  setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    saveSoundPreference("hapticsEnabled", enabled);
  }
  isHapticsEnabled() {
    return this.hapticsEnabled;
  }

  setSnapSoundPref(pref: SnapSoundPref) {
    this.snapSoundPref = pref;
    saveSoundPreference("snapSoundPref", pref);
  }
  getSnapSoundPref() {
    return this.snapSoundPref;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    saveSoundPreference("musicEnabled", enabled);
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
    saveSoundPreference("musicVolume", this.musicVolume);
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

  private ensureReverb(ctx: AudioContext) {
    const reverb = ensureReverbNode(ctx, this.masterReverb, createTinyImpulse);
    this.masterReverb = reverb;
    return reverb;
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
    playToneCore(ctx, opts, () => this.ensureReverb(ctx));
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
    playNoiseClickCore(ctx, opts, () => this.ensureReverb(ctx));
  }

  play(sound: SoundType, opts?: { groupSize?: number }) {
    triggerHaptic(sound, this.hapticsEnabled, opts?.groupSize);

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
