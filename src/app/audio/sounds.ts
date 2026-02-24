/**
 * sounds – Web Audio API effects (snap, place, rotate, etc.), haptic feedback, theme variants.
 */
type SoundType = "snap" | "place" | "rotate" | "complete" | "pickup" | "undo";

type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";

export type SnapSoundPref = "default" | "classic" | "soft" | "punchy" | "muted";

const SNAP_SOUND_KEY = "phuzzle:snapSound";

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
    const snap = localStorage.getItem(SNAP_SOUND_KEY);
    if (snap !== null && ["default", "classic", "soft", "punchy", "muted"].includes(snap)) {
      this.snapSoundPref = snap as SnapSoundPref;
    }
  }

  private snapSoundPref: SnapSoundPref = "default";

  setSnapSoundPref(pref: SnapSoundPref) {
    this.snapSoundPref = pref;
    try {
      localStorage.setItem(SNAP_SOUND_KEY, pref);
    } catch {
      /* ignore */
    }
  }

  getSnapSoundPref(): SnapSoundPref {
    return this.snapSoundPref;
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

  play(sound: SoundType, opts?: { groupSize?: number }) {
    // Trigger haptic feedback (works even if sound is muted)
    this.triggerHaptic(sound, opts?.groupSize);

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
        if (this.snapSoundPref === "muted") break;
        this.playSnap(ctx, opts?.groupSize ?? 2);
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
      case "undo":
        this.playUndo(ctx);
        break;
    }
  }

  // Trigger haptic feedback based on sound type
  private triggerHaptic(sound: SoundType, groupSize?: number) {
    switch (sound) {
      case "pickup":
        // Light tap
        this.vibrate(10);
        break;
      case "snap": {
        // Scale by group size: small = subtle, large = stronger
        const snapStrength = groupSize != null ? Math.min(50, 15 + groupSize * 6) : 25;
        this.vibrate(snapStrength);
        break;
      }
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
      case "undo":
        // Quick reverse buzz
        this.vibrate(20);
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
      // Sci-fi blip: soft square wave with quick decay
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
      // Bubble pop: bright sine that rises
      this.playTone(ctx, {
        freq: 600,
        type: "sine",
        vol: this.volume * 0.1,
        duration: 0.08,
        start: t,
        freqRamp: { to: 1200, at: 0.04 },
      });
    } else if (theme === "forest") {
      // Leaf rustle: two soft chirps
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
      // Sunset: warm glow, soft triangle with gentle sustain
      this.playTone(ctx, {
        freq: 520,
        type: "triangle",
        vol: this.volume * 0.12,
        duration: 0.1,
      });
    } else {
      // Light/dark: default
      this.playTone(ctx, { freq: 800, vol: this.volume * 0.15, duration: 0.05 });
    }
  }

  private playSnapByPref(ctx: AudioContext, pref: Exclude<SnapSoundPref, "default" | "muted">, groupSize: number) {
    const t = ctx.currentTime;
    const volScale = Math.max(0.5, Math.min(1, 0.5 + (groupSize - 2) * 0.06));
    if (pref === "classic") {
      this.playTone(ctx, { freq: 1200 * volScale, vol: this.volume * 0.35 * volScale, duration: 0.07, start: t });
      this.playTone(ctx, { freq: 1800 * volScale, vol: this.volume * 0.2 * volScale, duration: 0.05, start: t + 0.02 });
    } else if (pref === "soft") {
      this.playTone(ctx, { freq: 880 * volScale, type: "sine", vol: this.volume * 0.18 * volScale, duration: 0.08, start: t });
      this.playTone(ctx, { freq: 1320 * volScale, type: "sine", vol: this.volume * 0.1 * volScale, duration: 0.06, start: t + 0.025 });
    } else if (pref === "punchy") {
      this.playTone(ctx, { freq: 200, type: "square", vol: this.volume * 0.2 * volScale, duration: 0.03, start: t });
      this.playTone(ctx, { freq: 1400 * volScale, vol: this.volume * 0.45 * volScale, duration: 0.06, start: t + 0.01 });
    }
  }

  private playSnap(ctx: AudioContext, groupSize: number = 2) {
    const pref = this.snapSoundPref;
    if (pref === "muted") return;
    if (pref !== "default") {
      this.playSnapByPref(ctx, pref, groupSize);
      return;
    }
    const theme = getTheme();
    const t = ctx.currentTime;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const volScale = clamp(0.5 + (groupSize - 2) * 0.06);
    const freqScale = Math.max(0.65, 1 - (groupSize - 1) * 0.05);
    if (theme === "space") {
      const baseFreq = 660 * freqScale;
      this.playTone(ctx, {
        freq: baseFreq,
        type: "square",
        vol: this.volume * 0.25 * volScale,
        duration: 0.06 + groupSize * 0.008,
        start: t,
      });
      this.playTone(ctx, {
        freq: baseFreq * 2,
        type: "square",
        vol: this.volume * 0.2 * volScale,
        duration: 0.08 + groupSize * 0.01,
        start: t + 0.02,
      });
    } else if (theme === "ocean") {
      const baseFreq = 880 * freqScale;
      this.playTone(ctx, {
        freq: baseFreq,
        type: "sine",
        vol: this.volume * 0.32 * volScale,
        duration: 0.05 + groupSize * 0.006,
        start: t,
      });
      this.playTone(ctx, {
        freq: baseFreq * 2,
        type: "sine",
        vol: this.volume * 0.18 * volScale,
        duration: 0.05 + groupSize * 0.005,
        start: t + 0.015,
      });
    } else if (theme === "forest") {
      const baseFreq = 660 * freqScale;
      this.playTone(ctx, {
        freq: baseFreq,
        type: "sine",
        vol: this.volume * 0.35 * volScale,
        duration: 0.05 + groupSize * 0.007,
        start: t,
      });
      this.playTone(ctx, {
        freq: baseFreq * 1.5,
        type: "sine",
        vol: this.volume * 0.22 * volScale,
        duration: 0.06 + groupSize * 0.01,
        start: t + 0.02,
      });
    } else if (theme === "sunset") {
      const baseFreq = 880 * freqScale;
      this.playTone(ctx, {
        freq: baseFreq,
        type: "triangle",
        vol: this.volume * 0.3 * volScale,
        duration: 0.07 + groupSize * 0.008,
        start: t,
      });
      this.playTone(ctx, {
        freq: baseFreq * 1.5,
        type: "triangle",
        vol: this.volume * 0.18 * volScale,
        duration: 0.06 + groupSize * 0.006,
        start: t + 0.02,
      });
    } else {
      const baseFreq = 1200 * freqScale;
      this.playTone(ctx, {
        freq: baseFreq,
        vol: this.volume * 0.4 * volScale,
        duration: 0.08 + groupSize * 0.008,
        start: t,
      });
      this.playTone(ctx, {
        freq: baseFreq * 1.5,
        vol: this.volume * 0.2 * volScale,
        duration: 0.06 + groupSize * 0.006,
        start: t + 0.02,
      });
    }
  }

  private playPlace(ctx: AudioContext) {
    const theme = getTheme();
    const t = ctx.currentTime;
    const softClickVol = this.volume * 0.15;
    if (theme === "space") {
      // Deep thunk: magnetic clamp
      this.playTone(ctx, {
        freq: 220,
        type: "square",
        vol: this.volume * 0.3,
        duration: 0.2,
        freqRamp: { to: 80, at: 0.15 },
      });
      this.playTone(ctx, {
        freq: 1200,
        type: "sine",
        vol: softClickVol,
        duration: 0.04,
        start: t,
      });
    } else if (theme === "ocean") {
      // Plop: water settling
      this.playTone(ctx, {
        freq: 440,
        type: "sine",
        vol: this.volume * 0.4,
        duration: 0.16,
        freqRamp: { to: 180, at: 0.12 },
      });
      this.playTone(ctx, {
        freq: 1400,
        type: "sine",
        vol: softClickVol,
        duration: 0.035,
        start: t,
      });
    } else if (theme === "forest") {
      // Soft thud: mossy landing
      this.playTone(ctx, {
        freq: 280,
        type: "sine",
        vol: this.volume * 0.38,
        duration: 0.18,
        freqRamp: { to: 140, at: 0.12 },
      });
      this.playTone(ctx, {
        freq: 1100,
        type: "sine",
        vol: softClickVol,
        duration: 0.04,
        start: t,
      });
    } else if (theme === "sunset") {
      // Sunset: warm settle, cozy drop
      this.playTone(ctx, {
        freq: 330,
        type: "triangle",
        vol: this.volume * 0.42,
        duration: 0.17,
        freqRamp: { to: 165, at: 0.11 },
      });
      this.playTone(ctx, {
        freq: 1300,
        type: "triangle",
        vol: softClickVol,
        duration: 0.035,
        start: t,
      });
    } else {
      // Light/dark: default
      this.playTone(ctx, {
        freq: 400,
        type: "triangle",
        vol: this.volume * 0.5,
        duration: 0.15,
        freqRamp: { to: 200, at: 0.1 },
      });
      this.playTone(ctx, {
        freq: 1000,
        type: "sine",
        vol: softClickVol,
        duration: 0.045,
        start: t,
      });
    }
  }

  private playUndo(ctx: AudioContext) {
    const theme = getTheme();
    const t = ctx.currentTime;
    // Subtle "rewind" tone - soft, descending
    if (
      theme === "space" ||
      theme === "ocean" ||
      theme === "forest" ||
      theme === "sunset"
    ) {
      this.playTone(ctx, {
        freq: 400,
        type: "sine",
        vol: this.volume * 0.12,
        duration: 0.06,
        start: t,
        freqRamp: { to: 200, at: 0.04 },
      });
    } else {
      this.playTone(ctx, {
        freq: 350,
        type: "triangle",
        vol: this.volume * 0.12,
        duration: 0.06,
        start: t,
        freqRamp: { to: 180, at: 0.04 },
      });
    }
  }

  private playRotate(ctx: AudioContext) {
    const theme = getTheme();
    if (theme === "space") {
      // Servo whir: ascending square
      this.playTone(ctx, {
        freq: 200,
        type: "square",
        vol: this.volume * 0.12,
        duration: 0.1,
        freqRamp: { to: 500, at: 0.08 },
      });
    } else if (theme === "ocean") {
      // Swirl: quick sine sweep
      this.playTone(ctx, {
        freq: 400,
        type: "sine",
        vol: this.volume * 0.15,
        duration: 0.08,
        freqRamp: { to: 800, at: 0.06 },
      });
    } else if (theme === "forest") {
      // Branch creak: low-to-mid
      this.playTone(ctx, {
        freq: 220,
        type: "sine",
        vol: this.volume * 0.16,
        duration: 0.09,
        freqRamp: { to: 440, at: 0.07 },
      });
    } else if (theme === "sunset") {
      // Sunset: gentle turn, warm triangle sweep
      this.playTone(ctx, {
        freq: 260,
        type: "triangle",
        vol: this.volume * 0.18,
        duration: 0.1,
        freqRamp: { to: 520, at: 0.08 },
      });
    } else {
      // Light/dark: default
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
      // Sci-fi victory: minor arpeggio, square wave
      const notes = [349.23, 415.3, 523.25, 698.46]; // F4, G#4, C5, F5
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
      // Wave crest: bright major arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
      // Birdsong finish: natural major
      const notes = [392, 523.25, 659.25, 1046.5]; // G4, C5, E5, C6
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
      // Sunset: golden hour, warm triangle chord
      const notes = [392, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
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
      // Light/dark: default celebration
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
