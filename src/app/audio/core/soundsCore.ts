import { clamp01, resumeIfSuspended } from "./soundsDsp";
import {
  loadSoundPreferencesFromStorage,
  saveSoundPreference,
  type SnapSoundPref as SnapSoundPrefType,
  type AudioProfile as AudioProfileType,
} from "./soundsPreferences";
import { logger } from "@/utils/logger";
import { audioManager } from "@/audio/manager/audioManager";
import { triggerHaptic } from "./soundsCoreHaptics";
import {
  shouldGateSound,
  executePlay,
  type SoundType as SoundTypeValue,
} from "./soundsCorePlayDispatch";
import {
  ensureReverbForEngine,
  updateSfxOutputGainForEngine,
  playToneForEngine,
  playNoiseClickForEngine,
  type EnginePlaybackState,
} from "./soundsCoreEngineHelpers";
import {
  clearAmbient,
  updateAmbientGain as updateAmbientGainFn,
} from "./soundsCoreAmbient";
import { runStartAmbientForEngine } from "./soundsCoreStartAmbient";

export type SoundType = SoundTypeValue;
export type Theme = import("./soundsCoreAmbient").Theme;
export type SnapSoundPref = SnapSoundPrefType;
export type AudioProfile = AudioProfileType;
type StopFn = () => void;

class SoundEngine {
  private audioContext: AudioContext | null = null;

  private enabled = true;
  private sfxVolume = 0.3;
  private masterVolume = 0.9;
  private hapticsEnabled = true;
  private snapSoundPref: SnapSoundPref = "default";
  private audioProfile: AudioProfile = "balanced";

  private musicEnabled = false;
  private musicVolume = 0.35;
  private paused = false;

  private ambientGain: GainNode | null = null;
  private ambientStops: StopFn[] = [];

  private masterReverb: ConvolverNode | null = null;
  private sfxMasterGain: GainNode | null = null;
  private lastPlayAtMs = new Map<SoundType, number>();

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
    this.sfxVolume = prefs.sfxVolume;
    this.masterVolume = prefs.masterVolume;
    this.hapticsEnabled = prefs.hapticsEnabled;
    this.snapSoundPref = prefs.snapSoundPref;
    this.audioProfile = prefs.audioProfile;
    this.musicEnabled = prefs.musicEnabled;
    this.musicVolume = prefs.musicVolume;
    audioManager.setMasterVolume(this.masterVolume);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    saveSoundPreference("enabled", enabled);
  }
  isEnabled() {
    return this.enabled;
  }
  setVolume(volume: number) {
    this.setSfxVolume(volume);
  }
  getVolume() {
    return this.getSfxVolume();
  }
  setSfxVolume(volume: number) {
    this.sfxVolume = clamp01(volume);
    saveSoundPreference("sfxVolume", this.sfxVolume);
    saveSoundPreference("volume", this.sfxVolume);
  }
  getSfxVolume() {
    return this.sfxVolume;
  }
  setMasterVolume(volume: number) {
    this.masterVolume = clamp01(volume);
    saveSoundPreference("masterVolume", this.masterVolume);
    audioManager.setMasterVolume(this.masterVolume);
    this.updateSfxOutputGain();
  }
  getMasterVolume() {
    return this.masterVolume;
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
  setAudioProfile(profile: AudioProfile) {
    this.audioProfile = profile;
    saveSoundPreference("audioProfile", profile);
  }
  getAudioProfile() {
    return this.audioProfile;
  }
  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    saveSoundPreference("musicEnabled", enabled);
    if (enabled && !this.paused) void this.startAmbient();
    else this.stopAmbient();
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

  private getPlaybackState(): EnginePlaybackState {
    return {
      getContext: () => this.getContext(),
      getMasterReverb: () => this.masterReverb,
      setMasterReverb: (r) => {
        this.masterReverb = r;
      },
      getSfxMasterGain: () => this.sfxMasterGain,
      setSfxMasterGain: (g) => {
        this.sfxMasterGain = g;
      },
      getMasterVolume: () => this.masterVolume,
      getAudioContext: () => this.audioContext,
    };
  }

  private ensureReverb(ctx: AudioContext) {
    return ensureReverbForEngine(this.getPlaybackState(), ctx);
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
      pan?: number;
      toReverb?: boolean;
    },
  ) {
    playToneForEngine(this.getPlaybackState(), ctx, opts);
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
    playNoiseClickForEngine(this.getPlaybackState(), ctx, opts);
  }

  private updateSfxOutputGain() {
    updateSfxOutputGainForEngine(this.getPlaybackState());
  }

  play(sound: SoundType, opts?: { groupSize?: number; proximity?: number }) {
    triggerHaptic(sound, this.hapticsEnabled, opts?.groupSize);

    if (!this.enabled) return;
    if (shouldGateSound(sound, this.lastPlayAtMs)) return;
    if (sound === "hoverSnap" && this.audioProfile === "low-stimulation") return;

    const ctx = this.getContext();
    if (!ctx) return;
    resumeIfSuspended(ctx);

    const profileVolScale =
      this.audioProfile === "soft-mobile"
        ? 0.9
        : this.audioProfile === "low-stimulation"
          ? 0.72
          : 1;

    const sfxHelpers = {
      volume: this.sfxVolume * this.masterVolume * profileVolScale,
      snapSoundPref: this.snapSoundPref,
      profile: this.audioProfile,
      randomSigned: () => Math.random() * 2 - 1,
      playTone: this.playTone.bind(this),
      playNoiseClick: this.playNoiseClick.bind(this),
    };

    executePlay(ctx, sound, opts, sfxHelpers);
  }

  private updateAmbientGain() {
    if (!this.ambientGain) return;
    const ctx = this.getContext();
    if (!ctx) return;
    updateAmbientGainFn(this.ambientGain, ctx, this.musicVolume);
  }

  private stopAmbient() {
    clearAmbient(this.ambientStops, this.ambientGain);
    this.ambientStops = [];
    this.ambientGain = null;
  }

  private async startAmbient() {
    await runStartAmbientForEngine({
      getContext: () => this.getContext(),
      getMusicEnabled: () => this.musicEnabled,
      getPaused: () => this.paused,
      getMusicVolume: () => this.musicVolume,
      ensureReverb: (ctx) => this.ensureReverb(ctx),
      playTone: (ctx, opts) => this.playTone(ctx, opts as never),
      playNoiseClick: (ctx, opts) => this.playNoiseClick(ctx, opts as never),
      stopAmbient: () => this.stopAmbient(),
      setAmbientState: (g, s) => {
        this.ambientGain = g;
        this.ambientStops = s;
      },
    });
  }
}

export const soundEngine = new SoundEngine();
soundEngine.loadPreferences();
/** SFX + haptics. Ambient music is @/audio/audioManager. */
export const soundManager = soundEngine;
