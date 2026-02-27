/**
 * adaptiveDifficultyService – track completion times, suggest grid/cut based on performance.
 * Increases complexity when fast, softens when struggling.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

const STORAGE_KEY = "phuzzle:completionHistory";
const MAX_ENTRIES = 30;
const FAST_SEC_PER_PIECE = 25;
const SLOW_SEC_PER_PIECE = 55;

export type CompletionEntry = {
  rows: number;
  cols: number;
  elapsedSeconds: number;
  timestamp: number;
};

function loadHistory(): CompletionEntry[] {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is CompletionEntry =>
        typeof e?.rows === "number" &&
        typeof e?.cols === "number" &&
        typeof e?.elapsedSeconds === "number" &&
        typeof e?.timestamp === "number",
    );
  } catch {
    return [];
  }
}

function saveHistory(entries: CompletionEntry[]) {
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
}

/** Record a puzzle completion for adaptive suggestions. */
export function recordCompletion(
  rows: number,
  cols: number,
  elapsedSeconds: number,
): void {
  const entries = loadHistory();
  entries.push({ rows, cols, elapsedSeconds, timestamp: Date.now() });
  saveHistory(entries);
}

function avgSecPerPiece(entries: CompletionEntry[]): number | null {
  if (entries.length === 0) return null;
  let totalSeconds = 0;
  let totalPieces = 0;
  for (const e of entries) {
    totalSeconds += e.elapsedSeconds;
    totalPieces += e.rows * e.cols;
  }
  return totalPieces > 0 ? totalSeconds / totalPieces : null;
}

const PRESET_SIZES = [
  { rows: 3, cols: 3 },
  { rows: 4, cols: 4 },
  { rows: 5, cols: 5 },
  { rows: 6, cols: 6 },
  { rows: 7, cols: 7 },
  { rows: 8, cols: 8 },
  { rows: 9, cols: 9 },
];

export type AdaptiveSuggestion = {
  gridIndex: number;
  rows: number;
  cols: number;
  label: string;
  reason: "progress" | "step_up" | "step_down" | "stay";
  /** Short hint for the suggestion button. */
  hint: string;
};

const PRESET_LABELS = [
  "Easy 🌱",
  "Medium ⚡",
  "Hard 🔥",
  "Expert 👑",
  "Master 🧠",
  "Legend 🔮",
  "Extreme 💀",
];

/**
 * Get grid suggestion considering completion times.
 * - Fast avg time → suggest stepping up
 * - Slow avg time → suggest staying or stepping down
 */
export function getAdaptiveSuggestion(
  getBestTime: (rows: number, cols: number) => number | null,
): AdaptiveSuggestion | null {
  const history = loadHistory();
  const recent = history.slice(-10);

  let largestCompleted = -1;
  for (let i = 0; i < PRESET_SIZES.length; i++) {
    const { rows, cols } = PRESET_SIZES[i];
    if (getBestTime(rows, cols) != null) {
      largestCompleted = i;
    }
  }

  const baseIndex = largestCompleted + 1;
  if (baseIndex >= PRESET_SIZES.length) {
    const last = PRESET_SIZES[PRESET_SIZES.length - 1];
    return {
      gridIndex: PRESET_SIZES.length - 1,
      rows: last.rows,
      cols: last.cols,
      label: `${PRESET_LABELS[PRESET_LABELS.length - 1]} (${last.rows}×${last.cols})`,
      reason: "progress",
      hint: `Based on your progress, try ${last.rows}×${last.cols} next`,
    };
  }

  const avg = avgSecPerPiece(recent);
  const current = PRESET_SIZES[largestCompleted];

  if (avg != null && recent.length >= 2) {
    if (avg < FAST_SEC_PER_PIECE && baseIndex < PRESET_SIZES.length) {
      const next = PRESET_SIZES[baseIndex];
      return {
        gridIndex: baseIndex,
        rows: next.rows,
        cols: next.cols,
        label: `${PRESET_LABELS[baseIndex]} (${next.rows}×${next.cols})`,
        reason: "step_up",
        hint: `You're on fire! Try ${next.rows}×${next.cols} →`,
      };
    }
    if (avg > SLOW_SEC_PER_PIECE && largestCompleted > 0) {
      const softer = PRESET_SIZES[largestCompleted - 1];
      return {
        gridIndex: largestCompleted - 1,
        rows: softer.rows,
        cols: softer.cols,
        label: `${PRESET_LABELS[largestCompleted - 1]} (${softer.rows}×${softer.cols})`,
        reason: "step_down",
        hint: `Take it easier with ${softer.rows}×${softer.cols} →`,
      };
    }
    if (avg > SLOW_SEC_PER_PIECE) {
      return {
        gridIndex: largestCompleted,
        rows: current.rows,
        cols: current.cols,
        label: `${PRESET_LABELS[largestCompleted]} (${current.rows}×${current.cols})`,
        reason: "stay",
        hint: `Stick with ${current.rows}×${current.cols} for now`,
      };
    }
  }

  const next = PRESET_SIZES[baseIndex];
  return {
    gridIndex: baseIndex,
    rows: next.rows,
    cols: next.cols,
    label: `${PRESET_LABELS[baseIndex]} (${next.rows}×${next.cols})`,
    reason: "progress",
    hint: `Based on your progress, try ${next.rows}×${next.cols} next →`,
  };
}
