/**
 * completionGrades – S, A, B, C tiers based on time and efficiency.
 * Encourages replayability with clear grading logic per grid size and time mode.
 */
import type { TimeMode } from "@/screens/Play/timeMode";

export type CompletionGrade = "S" | "A" | "B" | "C";

export type GradeParams = {
  elapsedSeconds: number;
  grid: { rows: number; cols: number };
  timeMode?: TimeMode;
  countdownMinutes?: number;
  undoCount?: number;
  /** For timeDecay mode: final score (higher = better). */
  timeDecayScore?: number;
};

/** Time thresholds (seconds) per piece count for elapsed/relaxed/best/active modes. */
const ELAPSED_THRESHOLDS: Record<number, { s: number; a: number; b: number }> = {
  9: { s: 55, a: 100, b: 180 },
  16: { s: 100, a: 180, b: 320 },
  25: { s: 165, a: 320, b: 550 },
  36: { s: 270, a: 480, b: 820 },
  49: { s: 380, a: 660, b: 1050 },
  64: { s: 540, a: 880, b: 1380 },
};

/** Fraction of countdown time remaining for countdown/timeAttack modes. */
const COUNTDOWN_THRESHOLDS = {
  s: 0.55,
  a: 0.35,
  b: 0.12,
};

function getElapsedThresholds(pieceCount: number): { s: number; a: number; b: number } {
  if (pieceCount <= 9) return ELAPSED_THRESHOLDS[9];
  if (pieceCount <= 16) return ELAPSED_THRESHOLDS[16];
  if (pieceCount <= 25) return ELAPSED_THRESHOLDS[25];
  if (pieceCount <= 36) return ELAPSED_THRESHOLDS[36];
  if (pieceCount <= 49) return ELAPSED_THRESHOLDS[49];
  return ELAPSED_THRESHOLDS[64];
}

/**
 * Compute completion grade from time and efficiency.
 * Clear logic per grid size; different rules for countdown vs elapsed modes.
 */
export function getCompletionGrade(params: GradeParams): CompletionGrade {
  const { elapsedSeconds, grid, timeMode = "elapsed", countdownMinutes = 10 } = params;
  const pieceCount = grid.rows * grid.cols;

  // Time Decay: grade by score (higher = better).
  if (timeMode === "timeDecay" && params.timeDecayScore != null) {
    const base = 600 + pieceCount * 8;
    const pct = Math.max(0, Math.min(1, params.timeDecayScore / base));
    if (pct >= 0.75) return "S";
    if (pct >= 0.55) return "A";
    if (pct >= 0.35) return "B";
    return "C";
  }

  // Countdown and Time Attack: grade by fraction of time remaining
  if (timeMode === "countdown" || timeMode === "timeAttack") {
    const totalSeconds = countdownMinutes * 60;
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);
    const fractionLeft = remaining / totalSeconds;
    if (fractionLeft >= COUNTDOWN_THRESHOLDS.s) return "S";
    if (fractionLeft >= COUNTDOWN_THRESHOLDS.a) return "A";
    if (fractionLeft >= COUNTDOWN_THRESHOLDS.b) return "B";
    return "C";
  }

  // Elapsed, relaxed, best, active: grade by total time
  const t = getElapsedThresholds(pieceCount);
  if (elapsedSeconds <= t.s) return "S";
  if (elapsedSeconds <= t.a) return "A";
  if (elapsedSeconds <= t.b) return "B";
  return "C";
}

/** Grade label for display (optional emoji for flair). */
export const GRADE_LABELS: Record<CompletionGrade, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
};
