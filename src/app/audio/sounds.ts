// src/app/audio/sounds.ts
// Sound effects using Web Audio API - no external files needed
// Haptic feedback using Vibration API
// Theme-specific sound variants

type SoundType = "snap" | "place" | "rotate" | "complete" | "pickup";

type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";

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

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;
  private hapticsEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch {
        console.warn("Web Audio API not supported");
        return null;
      }
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem("phuzzle:soundEnabled", enabled ? "true" : "false");
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    localStorage.setItem("phuzzle:hapticsEnabled", enabled ? "true" : "false");
  }

  isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem("phuzzle:soundVolume", this.volume.toString());
  }

  getVolume(): number {
    return this.volume;
  }

  loadPreferences() {
    const enabled = localStorage.getItem("phuzzle:soundEnabled");
    if (enabled !== null) this.enabled = enabled === "true";
    const volume = localStorage.getItem("phuzzle:soundVolume");
    if (volume !== null) this.volume = parseFloat(volume);
    const haptics = localStorage.getItem("phuzzle:hapticsEnabled");
    if (haptics !== null) this.hapticsEnabled = haptics === "true";
  }

  private vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* ignore */
      }
    }
  }

  play(sound: SoundType) {
    this.triggerHaptic(sound);
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    switch (sound) {
      case "pickup":
        this.playPickup(ctx);
        break;
      case "snap":
        this.playSnap(ctx);
        break;
      case "place":
        this.playPlace(ctx);
        break;
      case "rotate":
        this.playRotate(ctx);
        break;
      case "complete":
        this.playComplete(ctx);
        break;
    }
  }

  private triggerHaptic(sound: SoundType) {
    switch (sound) {
      case "pickup":
        this.vibrate(10);
        break;
      case "snap":
        this.vibrate(25);
        break;
      case "place":
        this.vibrate(40);
        break;
      case "rotate":
        this.vibrate(15);
        break;
      case "complete":
        this.vibrate([50, 50, 50, 50, 100]);
        break;
    }
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
    },
  ) {
    const start = opts.start ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, start);
    if (opts.freqRamp) {
      osc.frequency.exponentialRampToValueAtTime(
        opts.freqRamp.to,
        start + opts.freqRamp.at,
      );
    }
    gain.gain.setValueAtTime(opts.vol, start);
    gain.gain.exponentialDecayTo(0.001, start + opts.duration);
    osc.start(start);
    osc.stop(start + opts.duration);
  }

  private playPickup(ctx: AudioContext) {
    const theme = getTheme();
    const t = ctx.currentTime;
    if (theme === "space") {
      this.playTone(ctx, {
        freq: 480,
        type: "square",
        vol: this.volume * 0.08,
        duration: 0.06,
        start: t,
      });
      this.playTone(ctx, {
        freq: 720,
        type: "square",
        vol: this.volume * 0.06,
        duration: 0.05,
        start: t + 0.02,
      });
    } else if (theme === "ocean") {
      this.playTone(ctx, {
        freq: 600,
        type: "sine",
        vol: this.volume * 0.1,
        duration: 0.08,
        start: t,
        freqRamp: { to: 1200, at: 0.04 },
      });
    } else if (theme === "forest") {
      this.playTone(ctx, {
        freq: 880,
        type: "sine",
        vol: this.volume * 0.1,
        duration: 0.04,
        start: t,
      });
      this.playTone(ctx, {
        freq: 1100,
        type: "sine",
        vol: this.volume * 0.08,
        duration: 0.035,
        start: t + 0.03,
      });
    } else if (theme === "sunset") {
      this.playTone(ctx, {
        freq: 520,
        type: "triangle",
        vol: this.volume * 0.12,
        duration: 0.1,
      });
    } else {
      this.playTone(ctx, { freq: 800, vol: this.volume * 0.15, duration: 0.05 });
    }
  }

  private playSnap(ctx: AudioContext) {
    const theme = getTheme();
    const t = ctx.currentTime;
    if (theme === "space") {
      this.playTone(ctx, {
        freq: 660,
        type: "square",
        vol: this.volume * 0.25,
        duration: 0.08,
        start: t,
      });
      this.playTone(ctx, {
        freq: 1320,
        type: "square",
        vol: this.volume * 0.2,
        duration: 0.1,
        start: t + 0.02,
      });
    } else if (theme === "ocean") {
      this.playTone(ctx, {
        freq: 880,
        type: "sine",
        vol: this.volume * 0.32,
        duration: 0.07,
        start: t,
      });
      this.playTone(ctx, {
        freq: 1760,
        type: "sine",
        vol: this.volume * 0.18,
        duration: 0.06,
        start: t + 0.015,
      });
    } else if (theme === "forest") {
      this.playTone(ctx, {
        freq: 660,
        type: "sine",
        vol: this.volume * 0.35,
        duration: 0.06,
        start: t,
      });
      this.playTone(ctx, {
        freq: 990,
        type: "sine",
        vol: this.volume * 0.22,
        duration: 0.08,
        start: t + 0.02,
      });
    } else if (theme === "sunset") {
      this.playTone(ctx, {
        freq: 880,
        type: "triangle",
        vol: this.volume * 0.3,
        duration: 0.09,
        start: t,
      });
      this.playTone(ctx, {
        freq: 1320,
        type: "triangle",
        vol: this.volume * 0.18,
        duration: 0.07,
        start: t + 0.02,
      });
    } else {
      this.playTone(ctx, {
        freq: 1200,
        vol: this.volume * 0.4,
        duration: 0.1,
        start: t,
      });
      this.playTone(ctx, {
        freq: 1800,
        vol: this.volume * 0.2,
        duration: 0.08,
        start: t + 0.02,
      });
    }
  }

  private playPlace(ctx: AudioContext) {
    const theme = getTheme();
    if (theme === "space") {
      this.playTone(ctx, {
        freq: 220,
        type: "square",
        vol: this.volume * 0.3,
        duration: 0.2,
        freqRamp: { to: 80, at: 0.15 },
      });
    } else if (theme === "ocean") {
      this.playTone(ctx, {
        freq: 440,
        type: "sine",
        vol: this.volume * 0.4,
        duration: 0.16,
        freqRamp: { to: 180, at: 0.12 },
      });
    } else if (theme === "forest") {
      this.playTone(ctx, {
        freq: 280,
        type: "sine",
        vol: this.volume * 0.38,
        duration: 0.18,
        freqRamp: { to: 140, at: 0.12 },
      });
    } else if (theme === "sunset") {
      this.playTone(ctx, {
        freq: 330,
        type: "triangle",
        vol: this.volume * 0.42,
        duration: 0.17,
        freqRamp: { to: 165, at: 0.11 },
      });
    } else {
      this.playTone(ctx, {
        freq: 400,
        type: "triangle",
        vol: this.volume * 0.5,
        duration: 0.15,
        freqRamp: { to: 200, at: 0.1 },
      });
    }
  }

  private playRotate(ctx: AudioContext) {
    const theme = getTheme();
    if (theme === "space") {
      this.playTone(ctx, {
        freq: 200,
        type: "square",
        vol: this.volume * 0.12,
        duration: 0.1,
        freqRamp: { to: 500, at: 0.08 },
      });
    } else if (theme === "ocean") {
      this.playTone(ctx, {
        freq: 400,
        type: "sine",
        vol: this.volume * 0.15,
        duration: 0.08,
        freqRamp: { to: 800, at: 0.06 },
      });
    } else if (theme === "forest") {
      this.playTone(ctx, {
        freq: 220,
        type: "sine",
        vol: this.volume * 0.16,
        duration: 0.09,
        freqRamp: { to: 440, at: 0.07 },
      });
    } else if (theme === "sunset") {
      this.playTone(ctx, {
        freq: 260,
        type: "triangle",
        vol: this.volume * 0.18,
        duration: 0.1,
        freqRamp: { to: 520, at: 0.08 },
      });
    } else {
      this.playTone(ctx, {
        freq: 300,
        vol: this.volume * 0.2,
        duration: 0.1,
        freqRamp: { to: 600, at: 0.1 },
      });
    }
  }

  private playComplete(ctx: AudioContext) {
    const theme = getTheme();
    if (theme === "space") {
      const notes = [349.23, 415.3, 523.25, 698.46];
      const step = 0.2;
      notes.forEach((freq, i) => {
        const start = ctx.currentTime + i * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "square";
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.22, start + 0.02);
        gain.gain.exponentialDecayTo(0.001, start + step + 0.15);
        osc.start(start);
        osc.stop(start + step + 0.15);
      });
    } else if (theme === "ocean") {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const step = 0.16;
      notes.forEach((freq, i) => {
        const start = ctx.currentTime + i * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, start + 0.025);
        gain.gain.exponentialDecayTo(0.001, start + step + 0.12);
        osc.start(start);
        osc.stop(start + step + 0.12);
      });
    } else if (theme === "forest") {
      const notes = [392, 523.25, 659.25, 1046.5];
      const step = 0.18;
      notes.forEach((freq, i) => {
        const start = ctx.currentTime + i * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.36, start + 0.03);
        gain.gain.exponentialDecayTo(0.001, start + step + 0.14);
        osc.start(start);
        osc.stop(start + step + 0.14);
      });
    } else if (theme === "sunset") {
      const notes = [392, 493.88, 587.33, 783.99];
      const step = 0.17;
      notes.forEach((freq, i) => {
        const start = ctx.currentTime + i * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "triangle";
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.38, start + 0.025);
        gain.gain.exponentialDecayTo(0.001, start + step + 0.12);
        osc.start(start);
        osc.stop(start + step + 0.12);
      });
    } else {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const step = 0.15;
      notes.forEach((freq, i) => {
        const start = ctx.currentTime + i * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, start + 0.02);
        gain.gain.exponentialDecayTo(0.001, start + step + 0.1);
        osc.start(start);
        osc.stop(start + step + 0.1);
      });
      const chordTime = ctx.currentTime + notes.length * step;
      [523.25, 659.25, 783.99].forEach((freq) => {
        this.playTone(ctx, {
          freq,
          vol: this.volume * 0.3,
          duration: 0.5,
          start: chordTime,
        });
      });
    }
  }
}

declare global {
  interface AudioParam {
    exponentialDecayTo(value: number, endTime: number): void;
  }
}

AudioParam.prototype.exponentialDecayTo = function (value: number, endTime: number) {
  this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
};

export const soundManager = new SoundManager();
soundManager.loadPreferences();
