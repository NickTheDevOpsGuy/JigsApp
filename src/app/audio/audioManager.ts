/**
 * Centralized audio manager: procedural ambient music with separate channel.
 * Pause support, persistent volume/mute prefs, theme-based procedural loops.
 *
 * Uses sequencer + playVoice approach: chords, bass, arpeggios per theme.
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

function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Scheduler: steps slightly ahead to reduce jitter.
 * stepDur = eighth note; 16 steps = 2 bars in 4/4
 */
function startSequencer(
  ctx: AudioContext,
  bpm: number,
  onStep: (time: number, step: number) => void,
) {
  const LOOKAHEAD_MS = 25;
  const AHEAD_SEC = 0.12;
  const stepDur = 60 / bpm / 2;
  let step = 0;
  let nextTime = ctx.currentTime + 0.05;

  const id = window.setInterval(() => {
    while (nextTime < ctx.currentTime + AHEAD_SEC) {
      onStep(nextTime, step);
      step = (step + 1) % 16;
      nextTime += stepDur;
    }
  }, LOOKAHEAD_MS);

  return () => window.clearInterval(id);
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private musicEnabled = false;
  private musicVolume = 0.4;
  private paused = false;

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
    out.gain.value = 1;
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
      localStorage.setItem(MUSIC_ENABLED_KEY, enabled ? "true" : "false");
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
      localStorage.setItem(MUSIC_VOLUME_KEY, this.musicVolume.toString());
    } catch {
      /* ignore */
    }
    this.updateAmbientGain();
  }

  getMusicVolume(): number {
    return this.musicVolume;
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
    let stop: () => void;

    if (theme === "ocean") stop = this.createOceanMusic(ctx, gainNode).stop;
    else if (theme === "forest") stop = this.createForestMusic(ctx, gainNode).stop;
    else if (theme === "space") stop = this.createSpaceMusic(ctx, gainNode).stop;
    else if (theme === "sunset") stop = this.createSunsetMusic(ctx, gainNode).stop;
    else stop = this.createLightDarkMusic(ctx, gainNode).stop;

    this.ambientNodes.push({ gain: gainNode, stop });
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
    const target = this.musicVolume * 0.32;
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

  /** Ocean: waves (filtered noise) + soft chord pad (Cmaj7 -> Am7 -> Fmaj7 -> G7) */
  private createOceanMusic(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    // Wave layer: pink noise through bandpass for ocean rumble + higher shimmer
    const bufSize = ctx.sampleRate * 2;
    const noise = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      data[i] = (b0 + b1 + b2) / 6;
    }

    const waveMix = ctx.createGain();
    waveMix.gain.value = 0.12;
    waveMix.connect(destination);

    // Deep rumble (undertow)
    const rumble = ctx.createBufferSource();
    rumble.buffer = noise;
    rumble.loop = true;
    const rumbleF = ctx.createBiquadFilter();
    rumbleF.type = "bandpass";
    rumbleF.frequency.value = 55;
    rumbleF.Q.value = 0.25;
    const rumbleG = ctx.createGain();
    rumbleG.gain.value = 0.22;
    rumble.connect(rumbleF);
    rumbleF.connect(rumbleG);
    rumbleG.connect(waveMix);

    // Mid waves (the main "whoosh")
    const waves = ctx.createBufferSource();
    waves.buffer = noise;
    waves.loop = true;
    const waveF = ctx.createBiquadFilter();
    waveF.type = "bandpass";
    waveF.frequency.value = 140;
    waveF.Q.value = 0.35;
    const waveG = ctx.createGain();
    waveG.gain.value = 0.18;
    waves.connect(waveF);
    waveF.connect(waveG);
    waveG.connect(waveMix);

    // High foam/shimmer
    const foam = ctx.createBufferSource();
    foam.buffer = noise;
    foam.loop = true;
    const foamF = ctx.createBiquadFilter();
    foamF.type = "bandpass";
    foamF.frequency.value = 380;
    foamF.Q.value = 0.4;
    const foamG = ctx.createGain();
    foamG.gain.value = 0.06;
    foam.connect(foamF);
    foamF.connect(foamG);
    foamG.connect(waveMix);

    rumble.start(0);
    waves.start(0);
    foam.start(0);

    const bpm = 72;
    const chords: number[][] = [
      [48, 52, 55, 59],
      [45, 48, 52, 55],
      [41, 45, 48, 52],
      [43, 47, 50, 53],
    ];
    const arpPattern = [0, 2, 1, 2];
    const padGain = 0.024;
    const bassGain = 0.014;
    const arpGain = 0.011;
    const padCutoff = 2200;
    const bassCutoff = 1500;
    const arpCutoff = 4200;

    const stopSeq = startSequencer(ctx, bpm, (time, step) => {
      const chordIndex = Math.floor(step / 4) % chords.length;
      const chord = chords[chordIndex];

      if (step % 4 === 0) {
        for (const n of chord) {
          this.playVoice(ctx, destination, {
            time: this.humanize(time),
            midi: n + 24,
            duration: 60 / bpm,
            type: "triangle",
            gain: padGain * (0.85 + Math.random() * 0.1),
            cutoff: padCutoff,
            attack: 0.09,
            release: 0.22,
            detuneCents: -6,
          });
          this.playVoice(ctx, destination, {
            time: this.humanize(time),
            midi: n + 24,
            duration: 60 / bpm,
            type: "triangle",
            gain: padGain * (0.75 + Math.random() * 0.1),
            cutoff: padCutoff,
            attack: 0.09,
            release: 0.22,
            detuneCents: 6,
          });
        }
        this.playVoice(ctx, destination, {
          time: this.humanize(time),
          midi: chord[0] + 12,
          duration: (60 / bpm) * 0.95,
          type: "sine",
          gain: bassGain,
          cutoff: bassCutoff,
          attack: 0.02,
          release: 0.16,
        });
      }

      const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
      this.playVoice(ctx, destination, {
        time: this.humanize(time),
        midi: arpNote,
        duration: (60 / bpm / 2) * 0.92,
        type: "sine",
        gain: arpGain * (0.9 + Math.random() * 0.15),
        cutoff: arpCutoff,
        attack: 0.01,
        release: 0.08,
      });
    });

    return {
      stop: () => {
        stopSeq();
        rumble.stop();
        waves.stop();
        foam.stop();
      },
    };
  }

  /** Forest: soft pad + bird chirps (scheduled high tones) + gentle breeze (filtered noise) */
  private createForestMusic(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    const forestMix = ctx.createGain();
    forestMix.gain.value = 1;
    forestMix.connect(destination);

    // Breeze: very soft bandpass noise
    const bufSize = ctx.sampleRate * 2;
    const noise = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      data[i] = (b0 + b1 + b2) / 6;
    }
    const breezeSrc = ctx.createBufferSource();
    breezeSrc.buffer = noise;
    breezeSrc.loop = true;
    const breezeF = ctx.createBiquadFilter();
    breezeF.type = "bandpass";
    breezeF.frequency.value = 280;
    breezeF.Q.value = 0.2;
    const breezeG = ctx.createGain();
    breezeG.gain.value = 0.04;
    breezeSrc.connect(breezeF);
    breezeF.connect(breezeG);
    breezeG.connect(forestMix);
    breezeSrc.start(0);

    let chirpCancelled = false;
    const scheduleChirp = () => {
      if (chirpCancelled) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400 + Math.random() * 1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        2200 + Math.random() * 600,
        ctx.currentTime + 0.08,
      );
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(g);
      g.connect(forestMix);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
      chirpTimer = window.setTimeout(scheduleChirp, 1800 + Math.random() * 4000);
    };
    let chirpTimer = window.setTimeout(scheduleChirp, 1200 + Math.random() * 2000);

    const bpm = 68;
    const chords: number[][] = [
      [50, 53, 57],
      [45, 48, 52],
      [52, 55, 59],
      [43, 47, 50],
    ];
    const arpPattern = [0, 1, 2, 1];
    const padGain = 0.022;
    const bassGain = 0.014;
    const arpGain = 0.009;
    const cutoff = 2800;

    const stopSeq = startSequencer(ctx, bpm, (time, step) => {
      const chordIndex = Math.floor(step / 4) % chords.length;
      const chord = chords[chordIndex];

      if (step % 4 === 0) {
        for (const n of chord) {
          this.playVoice(ctx, forestMix, {
            time: this.humanize(time),
            midi: n + 24,
            duration: 60 / bpm,
            type: "triangle",
            gain: padGain * (0.9 + Math.random() * 0.1),
            cutoff,
            attack: 0.12,
            release: 0.28,
          });
        }
        this.playVoice(ctx, forestMix, {
          time: this.humanize(time),
          midi: chord[0] + 12,
          duration: (60 / bpm) * 0.95,
          type: "sine",
          gain: bassGain,
          cutoff: 2000,
          attack: 0.03,
          release: 0.2,
        });
      }

      const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
      this.playVoice(ctx, forestMix, {
        time: this.humanize(time),
        midi: arpNote,
        duration: (60 / bpm / 2) * 0.9,
        type: "sine",
        gain: arpGain * (0.9 + Math.random() * 0.15),
        cutoff: 4500,
        attack: 0.015,
        release: 0.1,
      });
    });

    return {
      stop: () => {
        stopSeq();
        chirpCancelled = true;
        if (chirpTimer != null) clearTimeout(chirpTimer);
        breezeSrc.stop();
      },
    };
  }

  /** Space: deep drone + cosmic hiss (filtered noise) + slow chord pad */
  private createSpaceMusic(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    const spaceMix = ctx.createGain();
    spaceMix.gain.value = 1;
    spaceMix.connect(destination);

    // Deep space drone (constant low sine)
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 36;
    const droneG = ctx.createGain();
    droneG.gain.value = 0.06;
    drone.connect(droneG);
    droneG.connect(spaceMix);
    drone.start(0);

    // Cosmic dust: very soft high filtered noise
    const bufSize = ctx.sampleRate * 2;
    const noise = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      data[i] = (b0 + b1 + b2) / 6;
    }
    const cosmicSrc = ctx.createBufferSource();
    cosmicSrc.buffer = noise;
    cosmicSrc.loop = true;
    const cosmicF = ctx.createBiquadFilter();
    cosmicF.type = "bandpass";
    cosmicF.frequency.value = 2400;
    cosmicF.Q.value = 0.15;
    const cosmicG = ctx.createGain();
    cosmicG.gain.value = 0.03;
    cosmicSrc.connect(cosmicF);
    cosmicF.connect(cosmicG);
    cosmicG.connect(spaceMix);
    cosmicSrc.start(0);

    const bpm = 54;
    const chords: number[][] = [
      [45, 48, 52],
      [52, 55, 59],
      [47, 50, 54],
      [41, 45, 48],
    ];
    const arpPattern = [0, 2, 1, 0];
    const padGain = 0.024;
    const bassGain = 0.015;
    const arpGain = 0.008;
    const padCutoff = 2000;
    const arpCutoff = 3600;

    const stopSeq = startSequencer(ctx, bpm, (time, step) => {
      const chordIndex = Math.floor(step / 4) % chords.length;
      const chord = chords[chordIndex];

      if (step % 4 === 0) {
        for (const n of chord) {
          this.playVoice(ctx, spaceMix, {
            time: this.humanize(time),
            midi: n + 24,
            duration: (60 / bpm) * 1.1,
            type: "triangle",
            gain: padGain * (0.85 + Math.random() * 0.1),
            cutoff: padCutoff,
            attack: 0.15,
            release: 0.35,
            detuneCents: (Math.random() - 0.5) * 8,
          });
        }
        this.playVoice(ctx, spaceMix, {
          time: this.humanize(time),
          midi: chord[0] + 12,
          duration: (60 / bpm) * 1.05,
          type: "sine",
          gain: bassGain,
          cutoff: 1600,
          attack: 0.05,
          release: 0.25,
        });
      }

      const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
      this.playVoice(ctx, spaceMix, {
        time: this.humanize(time),
        midi: arpNote,
        duration: (60 / bpm / 2) * 0.95,
        type: "sine",
        gain: arpGain * (0.85 + Math.random() * 0.2),
        cutoff: arpCutoff,
        attack: 0.02,
        release: 0.12,
      });
    });

    return {
      stop: () => {
        stopSeq();
        drone.stop();
        cosmicSrc.stop();
      },
    };
  }

  /** Sunset: warm pad + golden-hour texture (warm band noise) + soft dusk rumble */
  private createSunsetMusic(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    const sunsetMix = ctx.createGain();
    sunsetMix.gain.value = 1;
    sunsetMix.connect(destination);

    const bufSize = ctx.sampleRate * 2;
    const noise = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      data[i] = (b0 + b1 + b2) / 6;
    }

    // Warm band (dusk atmosphere)
    const warmSrc = ctx.createBufferSource();
    warmSrc.buffer = noise;
    warmSrc.loop = true;
    const warmF = ctx.createBiquadFilter();
    warmF.type = "bandpass";
    warmF.frequency.value = 220;
    warmF.Q.value = 0.25;
    const warmG = ctx.createGain();
    warmG.gain.value = 0.055;
    warmSrc.connect(warmF);
    warmF.connect(warmG);
    warmG.connect(sunsetMix);
    warmSrc.start(0);

    // Soft low rumble (distant horizon)
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = noise;
    rumbleSrc.loop = true;
    const rumbleF = ctx.createBiquadFilter();
    rumbleF.type = "bandpass";
    rumbleF.frequency.value = 65;
    rumbleF.Q.value = 0.2;
    const rumbleG = ctx.createGain();
    rumbleG.gain.value = 0.05;
    rumbleSrc.connect(rumbleF);
    rumbleF.connect(rumbleG);
    rumbleG.connect(sunsetMix);
    rumbleSrc.start(0);

    const bpm = 64;
    const chords: number[][] = [
      [41, 45, 48, 52],
      [48, 52, 55, 60],
      [43, 47, 50, 55],
      [45, 48, 52, 57],
    ];
    const arpPattern = [0, 2, 3, 1];
    const padGain = 0.026;
    const bassGain = 0.015;
    const arpGain = 0.011;
    const padCutoff = 3400;
    const arpCutoff = 4600;

    const stopSeq = startSequencer(ctx, bpm, (time, step) => {
      const chordIndex = Math.floor(step / 4) % chords.length;
      const chord = chords[chordIndex];

      if (step % 4 === 0) {
        for (const n of chord) {
          this.playVoice(ctx, sunsetMix, {
            time: this.humanize(time),
            midi: n + 24,
            duration: 60 / bpm,
            type: "triangle",
            gain: padGain * (0.88 + Math.random() * 0.08),
            cutoff: padCutoff,
            attack: 0.1,
            release: 0.24,
            detuneCents: (Math.random() - 0.5) * 4,
          });
        }
        this.playVoice(ctx, sunsetMix, {
          time: this.humanize(time),
          midi: chord[0] + 12,
          duration: (60 / bpm) * 0.95,
          type: "sine",
          gain: bassGain,
          cutoff: 2200,
          attack: 0.025,
          release: 0.18,
        });
      }

      const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
      this.playVoice(ctx, sunsetMix, {
        time: this.humanize(time),
        midi: arpNote,
        duration: (60 / bpm / 2) * 0.9,
        type: "sine",
        gain: arpGain * (0.9 + Math.random() * 0.15),
        cutoff: arpCutoff,
        attack: 0.012,
        release: 0.09,
      });
    });

    return {
      stop: () => {
        stopSeq();
        warmSrc.stop();
        rumbleSrc.stop();
      },
    };
  }

  /** Light/Dark: minimal pad (Em -> C) + very soft room tone (neutral ambience) */
  private createLightDarkMusic(
    ctx: AudioContext,
    destination: AudioNode,
  ): { stop: () => void } {
    const neutralMix = ctx.createGain();
    neutralMix.gain.value = 1;
    neutralMix.connect(destination);

    // Barely-there room tone
    const bufSize = ctx.sampleRate * 2;
    const noise = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      data[i] = (b0 + b1 + b2) / 6;
    }
    const roomSrc = ctx.createBufferSource();
    roomSrc.buffer = noise;
    roomSrc.loop = true;
    const roomF = ctx.createBiquadFilter();
    roomF.type = "bandpass";
    roomF.frequency.value = 180;
    roomF.Q.value = 0.15;
    const roomG = ctx.createGain();
    roomG.gain.value = 0.025;
    roomSrc.connect(roomF);
    roomF.connect(roomG);
    roomG.connect(neutralMix);
    roomSrc.start(0);

    const bpm = 48;
    const chords: number[][] = [
      [52, 55, 59],
      [48, 52, 55],
    ];
    const arpPattern = [0, 1, 2];
    const padGain = 0.022;
    const bassGain = 0.012;
    const arpGain = 0.008;
    const cutoff = 2800;

    const stopSeq = startSequencer(ctx, bpm, (time, step) => {
      const chordIndex = Math.floor(step / 8) % chords.length;
      const chord = chords[chordIndex];

      if (step % 8 === 0) {
        for (const n of chord) {
          this.playVoice(ctx, neutralMix, {
            time: this.humanize(time),
            midi: n + 24,
            duration: (60 / bpm) * 2,
            type: "triangle",
            gain: padGain * (0.9 + Math.random() * 0.1),
            cutoff,
            attack: 0.2,
            release: 0.4,
          });
        }
        this.playVoice(ctx, neutralMix, {
          time: this.humanize(time),
          midi: chord[0] + 12,
          duration: (60 / bpm) * 1.95,
          type: "sine",
          gain: bassGain,
          cutoff: 2000,
          attack: 0.06,
          release: 0.3,
        });
      }

      const arpNote = chord[arpPattern[step % arpPattern.length]] + 36;
      this.playVoice(ctx, neutralMix, {
        time: this.humanize(time),
        midi: arpNote,
        duration: (60 / bpm / 2) * 0.92,
        type: "sine",
        gain: arpGain * (0.85 + Math.random() * 0.2),
        cutoff: 4200,
        attack: 0.02,
        release: 0.15,
      });
    });

    return {
      stop: () => {
        stopSeq();
        roomSrc.stop();
      },
    };
  }

  loadPreferences() {
    try {
      const m = localStorage.getItem(MUSIC_ENABLED_KEY);
      if (m !== null) this.musicEnabled = m === "true";
      const mv = localStorage.getItem(MUSIC_VOLUME_KEY);
      if (mv !== null) this.musicVolume = parseFloat(mv) || 0.4;
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
