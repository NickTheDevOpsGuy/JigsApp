// src/app/audio/sounds.ts
// Sound effects using Web Audio API - no external files needed

type SoundType = "snap" | "place" | "rotate" | "complete" | "pickup";

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

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
  }

  play(sound: SoundType) {
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

  // Soft click when picking up a piece
  private playPickup(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 800;
    osc.type = "sine";

    gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
    gain.gain.exponentialDecayTo(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  // Satisfying click when pieces snap together
  private playSnap(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 1200;
    osc.type = "sine";

    gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    gain.gain.exponentialDecayTo(0.001, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);

    // Add a second tone for richness
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.frequency.value = 1800;
    osc2.type = "sine";

    gain2.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gain2.gain.exponentialDecayTo(0.001, ctx.currentTime + 0.08);

    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.08);
  }

  // Heavier thunk when piece locks to board position
  private playPlace(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    osc.type = "triangle";

    gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gain.gain.exponentialDecayTo(0.001, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  // Soft whoosh for rotation
  private playRotate(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    osc.type = "sine";

    gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gain.gain.exponentialDecayTo(0.001, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // Celebration fanfare for puzzle completion
  private playComplete(ctx: AudioContext) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const duration = 0.15;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = "sine";

      const startTime = ctx.currentTime + i * duration;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.02);
      gain.gain.exponentialDecayTo(0.001, startTime + duration + 0.1);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });

    // Add a final chord
    const chordTime = ctx.currentTime + notes.length * duration;
    [523.25, 659.25, 783.99].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = "sine";

      gain.gain.setValueAtTime(this.volume * 0.3, chordTime);
      gain.gain.exponentialDecayTo(0.001, chordTime + 0.5);

      osc.start(chordTime);
      osc.stop(chordTime + 0.5);
    });
  }
}

// Polyfill for exponentialDecayTo (not standard)
declare global {
  interface AudioParam {
    exponentialDecayTo(value: number, endTime: number): void;
  }
}

AudioParam.prototype.exponentialDecayTo = function (
  value: number,
  endTime: number
) {
  this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
};

// Singleton instance
export const soundManager = new SoundManager();

// Initialize preferences on load
soundManager.loadPreferences();