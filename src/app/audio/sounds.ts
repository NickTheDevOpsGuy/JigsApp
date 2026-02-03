// src/app/audio/sounds.ts
// Sound effects using Web Audio API - no external files needed
// Haptic feedback using Vibration API

type SoundType = "snap" | "place" | "rotate" | "complete" | "pickup";

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
    // Save preference
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
    if (enabled !== null) {
      this.enabled = enabled === "true";
    }
    const volume = localStorage.getItem("phuzzle:soundVolume");
    if (volume !== null) {
      this.volume = parseFloat(volume);
    }
    const haptics = localStorage.getItem("phuzzle:hapticsEnabled");
    if (haptics !== null) {
      this.hapticsEnabled = haptics === "true";
    }
  }

  // Vibrate if supported and enabled
  private vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration not supported or blocked
      }
    }
  }

  play(sound: SoundType) {
    // Trigger haptic feedback (works even if sound is muted)
    this.triggerHaptic(sound);

    if (!this.enabled) return;

    const ctx = this.getContext();
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

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

  // Trigger haptic feedback based on sound type
  private triggerHaptic(sound: SoundType) {
    switch (sound) {
      case "pickup":
        // Light tap
        this.vibrate(10);
        break;
      case "snap":
        // Satisfying click
        this.vibrate(25);
        break;
      case "place":
        // Heavier thunk
        this.vibrate(40);
        break;
      case "rotate":
        // Quick buzz
        this.vibrate(15);
        break;
      case "complete":
        // Celebration pattern: short-pause-short-pause-long
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
    this.playTone(ctx, { freq: 800, vol: this.volume * 0.15, duration: 0.05 });
  }

  private playSnap(ctx: AudioContext) {
    this.playTone(ctx, { freq: 1200, vol: this.volume * 0.4, duration: 0.1 });
    this.playTone(ctx, { freq: 1800, vol: this.volume * 0.2, duration: 0.08 });
  }

  private playPlace(ctx: AudioContext) {
    this.playTone(ctx, {
      freq: 400,
      type: "triangle",
      vol: this.volume * 0.5,
      duration: 0.15,
      freqRamp: { to: 200, at: 0.1 },
    });
  }

  private playRotate(ctx: AudioContext) {
    this.playTone(ctx, {
      freq: 300,
      vol: this.volume * 0.2,
      duration: 0.1,
      freqRamp: { to: 600, at: 0.1 },
    });
  }

  private playComplete(ctx: AudioContext) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
    const chordTime = base + notes.length * step;
    [523.25, 659.25, 783.99].forEach((freq) =>
      this.playTone(ctx, {
        freq,
        vol: this.volume * 0.3,
        duration: 0.5,
        start: chordTime,
      }),
    );
  }
}

// Polyfill for exponentialDecayTo (not standard)
declare global {
  interface AudioParam {
    exponentialDecayTo(value: number, endTime: number): void;
  }
}

AudioParam.prototype.exponentialDecayTo = function (value: number, endTime: number) {
  this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
};

// Singleton instance
export const soundManager = new SoundManager();

// Initialize preferences on load
soundManager.loadPreferences();
