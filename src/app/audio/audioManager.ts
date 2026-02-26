/**
 * Centralized audio manager: effects + ambient music with separate channels.
 * Pause support, persistent volume/mute prefs, theme-based ambient loops.
 */
type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";

const MUSIC_ENABLED_KEY = "phuzzle:musicEnabled";
const MUSIC_VOLUME_KEY = "phuzzle:musicVolume";

function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const classList = document.documentElement.classList;
  if (classList.contains("theme-space")) return "space";
  if (classList.contains("theme-ocean")) return "ocean";
  if (classList.contains("theme-forest")) return "forest";
  if (classList.contains("theme-sunset")) return "sunset";
  if (classList.contains("theme-dark")) return "dark";
  return "light";
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private musicEnabled = false;
  private musicVolume = 0.15;
  private paused = false;
  private ambientNodes: { gain: GainNode; stop: () => void }[] = [];
  private ambientTimeout: number | null = null;

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

  // ─── Music channel ───
  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    try {
      localStorage.setItem(MUSIC_ENABLED_KEY, enabled ? "true" : "false");
    } catch {
      /* ignore */
    }
    if (enabled && !this.paused) {
      this.startAmbient();
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
      localStorage.setItem(MUSIC_VOLUME_KEY, this.musicVolume.toString());
    } catch {
      /* ignore */
    }
    this.updateAmbientGain();
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  // ─── Pause (game paused = music paused) ───
  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) {
      this.stopAmbient();
    } else if (this.musicEnabled) {
      this.startAmbient();
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  // ─── Ambient loops (theme-based) ───
  private startAmbient() {
    this.stopAmbient();
    const ctx = this.getContext();
    if (!ctx || !this.musicEnabled || this.paused) return;
    if (ctx.state === "suspended") ctx.resume();

    const theme = getTheme();
    const gainNode = ctx.createGain();
    gainNode.gain.value = this.musicVolume;
    gainNode.connect(ctx.destination);

    const stopFns: (() => void)[] = [];

    if (theme === "ocean") {
      const { stop } = this.createOceanLoop(ctx, gainNode);
      stopFns.push(stop);
    } else if (theme === "forest") {
      const { stop } = this.createForestLoop(ctx, gainNode);
      stopFns.push(stop);
    } else if (theme === "space") {
      const { stop } = this.createSpaceLoop(ctx, gainNode);
      stopFns.push(stop);
    } else if (theme === "sunset") {
      const { stop } = this.createSpaceLoop(ctx, gainNode); // reuse warm drone for sunset
      stopFns.push(stop);
    }
    // light/dark: no ambient

    if (stopFns.length > 0) {
      this.ambientNodes.push({
        gain: gainNode,
        stop: () => stopFns.forEach((f) => f()),
      });
    }
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
    if (this.ambientTimeout != null) {
      clearTimeout(this.ambientTimeout);
      this.ambientTimeout = null;
    }
  }

  private updateAmbientGain() {
    for (const { gain } of this.ambientNodes) {
      gain.gain.setTargetAtTime(this.musicVolume, 0, 0.1);
    }
  }

  private createOceanLoop(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    const bufferSize = ctx.sampleRate * 2;
    const noise = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      data[i] = (b0 + b1 + b2) / 6;
    }
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 180;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(0);
    return { stop: () => source.stop() };
  }

  private createForestLoop(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    let cancelled = false;
    const playChirp = () => {
      if (cancelled) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, 0);
      osc.frequency.exponentialRampToValueAtTime(1600 + Math.random() * 400, 0.15);
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.04, 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.25);
      osc.start(0);
      osc.stop(0.25);
    };
    const schedule = () => {
      if (cancelled) return;
      playChirp();
      this.ambientTimeout = window.setTimeout(schedule, 2000 + Math.random() * 4000);
    };
    schedule();
    return {
      stop: () => {
        cancelled = true;
        if (this.ambientTimeout != null) {
          clearTimeout(this.ambientTimeout);
          this.ambientTimeout = null;
        }
      },
    };
  }

  private createSpaceLoop(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 72;
    osc.connect(gain);
    gain.gain.value = 0.06;
    gain.connect(destination);
    osc.start(0);
    return { stop: () => osc.stop() };
  }

  loadPreferences() {
    try {
      const m = localStorage.getItem(MUSIC_ENABLED_KEY);
      if (m !== null) this.musicEnabled = m === "true";
      const mv = localStorage.getItem(MUSIC_VOLUME_KEY);
      if (mv !== null) this.musicVolume = parseFloat(mv) || 0.15;
    } catch {
      /* ignore */
    }
  }

  /** Sync ambient when theme changes */
  onThemeChange() {
    if (this.musicEnabled && !this.paused) {
      this.startAmbient();
    }
  }
}

export const audioManager = new AudioManager();
audioManager.loadPreferences();
