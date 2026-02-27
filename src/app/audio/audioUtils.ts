/**
 * Shared audio helpers: theme detection, MIDI conversion, sequencer.
 * Used by audioManager for procedural ambient music.
 */
export type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const classList = document.documentElement.classList;
  if (classList.contains("theme-space")) return "space";
  if (classList.contains("theme-ocean")) return "ocean";
  if (classList.contains("theme-forest")) return "forest";
  if (classList.contains("theme-sunset")) return "sunset";
  if (classList.contains("theme-dark")) return "dark";
  return "light";
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Scheduler: steps slightly ahead to reduce jitter.
 * stepDur = eighth note; 16 steps = 2 bars in 4/4
 */
export function startSequencer(
  ctx: AudioContext,
  bpm: number,
  onStep: (time: number, step: number) => void,
): () => void {
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
