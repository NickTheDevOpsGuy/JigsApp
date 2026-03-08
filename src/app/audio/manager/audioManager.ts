/**
 * Centralized audio manager: procedural ambient music (the music you hear when
 * Music is enabled in settings). Theme is read from document.documentElement
 * (class theme-light, theme-ocean, etc.) so switching theme in Display updates
 * the loop. Pause support, persistent volume/mute prefs.
 *
 * Theme music implementations live in audioManagerThemes.ts.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { getTheme, midiToFreq } from "@/audio/core/audioUtils";
import {
  createOceanMusic,
  createForestMusic,
  createSpaceMusic,
  createSunsetMusic,
  createLightDarkMusic,
} from "@/audio/themes/audioManagerThemes";

const MUSIC_ENABLED_KEY = "phuzzle:musicEnabled";
const MUSIC_VOLUME_KEY = "phuzzle:musicVolume";
const MASTER_VOLUME_KEY = "phuzzle:masterVolume";

class AudioManager {
  private audioContext: AudioContext | null = null;
  private musicEnabled = false;
  private musicVolume = 0.4;
  private masterVolume = 0.9;
  private paused = false;
  private duckFactor = 1;
  private duckResetTimer: ReturnType<typeof setTimeout> | null = null;

  private ambientNodes: { gain: GainNode; stop: () => void }[] = [];
  private master: {
    tone: BiquadFilterNode;
    comp: DynamicsCompressorNode;
    out: GainNode;
  } | null = null;

  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch {
        return null;
      }
    }
    return this.audioContext;
  }

  private getMaster(ctx: AudioContext) {
    if (this.master) return this.master;
    const out = ctx.createGain();
    out.gain.value = this.masterVolume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -26;
    comp.knee.value = 20;
    comp.ratio.value = 5;
    comp.attack.value = 0.005;
    comp.release.value = 0.18;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 6500;
    tone.Q.value = 0.7;
    tone.connect(comp);
    comp.connect(out);
    out.connect(ctx.destination);
    this.master = { tone, comp, out };
    return this.master;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    try {
      safeLocalStorage.setItem(MUSIC_ENABLED_KEY, enabled ? "true" : "false");
    } catch {
      /* ignore */
    }
    if (enabled && !this.paused) {
      void this.startAmbient();
    } else {
      this.stopAmbient();
    }
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try {
      safeLocalStorage.setItem(MUSIC_VOLUME_KEY, this.musicVolume.toString());
    } catch {
      /* ignore */
    }
    this.updateAmbientGain();
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    try {
      safeLocalStorage.setItem(MASTER_VOLUME_KEY, this.masterVolume.toString());
    } catch {
      /* ignore */
    }
    if (this.master && this.audioContext) {
      this.master.out.gain.setTargetAtTime(
        Math.max(0.0001, this.masterVolume),
        this.audioContext.currentTime,
        0.08,
      );
    }
    this.updateAmbientGain();
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) {
      this.stopAmbient();
    } else if (this.musicEnabled) {
      void this.startAmbient();
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  duckTransient(factor: number, ms = 180) {
    const clamped = Math.max(0.3, Math.min(1, factor));
    this.duckFactor = Math.min(this.duckFactor, clamped);
    this.updateAmbientGain();
    if (this.duckResetTimer != null) clearTimeout(this.duckResetTimer);
    this.duckResetTimer = setTimeout(
      () => {
        this.duckFactor = 1;
        this.updateAmbientGain();
        this.duckResetTimer = null;
      },
      Math.max(80, ms),
    );
  }

  private async startAmbient() {
    this.stopAmbient();
    const ctx = this.getContext();
    if (!ctx || !this.musicEnabled || this.paused) return;
    if (ctx.state === "suspended") {
      await ctx.resume();
      if (!this.musicEnabled || this.paused) return;
    }

    const master = this.getMaster(ctx);
    const gainNode = ctx.createGain();
    const target = this.musicVolume * 0.32;
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, target),
      ctx.currentTime + 0.25,
    );
    gainNode.connect(master.tone);

    const theme = getTheme();
    const helpers = {
      playVoice: this.playVoice.bind(this),
      humanize: this.humanize.bind(this),
    };
    let result: { stop: () => void };
    if (theme === "ocean") result = createOceanMusic(ctx, gainNode, helpers);
    else if (theme === "forest") result = createForestMusic(ctx, gainNode, helpers);
    else if (theme === "space") result = createSpaceMusic(ctx, gainNode, helpers);
    else if (theme === "sunset") result = createSunsetMusic(ctx, gainNode, helpers);
    else result = createLightDarkMusic(ctx, gainNode, helpers);

    this.ambientNodes.push({ gain: gainNode, stop: result.stop });
  }

  private stopAmbient() {
    for (const { stop } of this.ambientNodes) {
      try {
        stop();
      } catch {
        /* ignore */
      }
    }
    this.ambientNodes = [];
  }

  private updateAmbientGain() {
    const ctx = this.audioContext;
    const t = ctx ? ctx.currentTime : 0;
    const target = this.musicVolume * 0.32 * this.masterVolume * this.duckFactor;
    for (const { gain } of this.ambientNodes) {
      try {
        gain.gain.setTargetAtTime(Math.max(0.0001, target), t, 0.12);
      } catch {
        /* ignore */
      }
    }
  }

  private playVoice(
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
  ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();

    f.type = "lowpass";
    f.frequency.value = opts.cutoff ?? 5200;
    f.Q.value = 0.65;

    osc.type = opts.type;
    osc.frequency.setValueAtTime(midiToFreq(opts.midi), opts.time);
    if (opts.detuneCents != null) {
      osc.detune.setValueAtTime(opts.detuneCents, opts.time);
    }

    const attack = opts.attack ?? 0.03;
    const release = opts.release ?? 0.18;

    g.gain.setValueAtTime(0.0001, opts.time);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, opts.gain), opts.time + attack);
    const end = opts.time + Math.max(0.05, opts.duration);
    const relStart = Math.max(opts.time + attack + 0.02, end - release);
    g.gain.setValueAtTime(Math.max(0.0001, opts.gain), relStart);
    g.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(f);
    f.connect(g);
    g.connect(destination);

    osc.start(opts.time);
    osc.stop(end + 0.02);
  }

  private humanize(t: number) {
    return t + (Math.random() - 0.5) * 0.004;
  }

  loadPreferences() {
    try {
      const m = safeLocalStorage.getItem(MUSIC_ENABLED_KEY);
      if (m !== null) this.musicEnabled = m === "true";
      const mv = safeLocalStorage.getItem(MUSIC_VOLUME_KEY);
      if (mv !== null) this.musicVolume = Math.max(0, Math.min(1, parseFloat(mv) || 0.4));
      const sv = safeLocalStorage.getItem(MASTER_VOLUME_KEY);
      if (sv !== null)
        this.masterVolume = Math.max(0, Math.min(1, parseFloat(sv) || 0.9));
    } catch {
      /* ignore */
    }
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

  /** Stop ambient when leaving the play screen (e.g. navigating to main menu) */
  leavePlayScreen() {
    this.stopAmbient();
  }
}

export const audioManager = new AudioManager();
audioManager.loadPreferences();
