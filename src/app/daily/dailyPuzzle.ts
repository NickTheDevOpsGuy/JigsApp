/**
 * Daily Puzzle - deterministic puzzle selection from date.
 * Same date = same puzzle for everyone (client-only, no backend).
 */

import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import type { SamplePuzzle } from "@/data/samplePuzzles";

const GRID_OPTIONS = [
  { rows: 3, cols: 3 },
  { rows: 4, cols: 4 },
  { rows: 5, cols: 5 },
  { rows: 6, cols: 6 },
] as const;

export const DAILY_DATE_KEY = "phuzzle:dailyDate";
const DAILY_PREFIX = "phuzzle:daily:";

/** Simple deterministic hash from string */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

/** Get today's date string in user's local timezone (YYYY-MM-DD) */
export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Get the puzzle and grid for a given date (deterministic) */
export function getDailyPuzzleForDate(dateStr: string): {
  puzzle: SamplePuzzle;
  grid: { rows: number; cols: number };
} | null {
  const puzzles = SAMPLE_PUZZLES;
  if (puzzles.length === 0) return null;

  const puzzleIndex = hash(dateStr) % puzzles.length;
  const gridIndex = hash(dateStr + ":grid") % GRID_OPTIONS.length;

  return {
    puzzle: puzzles[puzzleIndex],
    grid: { ...GRID_OPTIONS[gridIndex] },
  };
}

/** Get today's daily puzzle config, or default if no puzzles available */
export function getTodayDailyPuzzle(): {
  puzzle: SamplePuzzle;
  grid: { rows: number; cols: number };
} {
  const result = getDailyPuzzleForDate(getTodayDateString());
  if (!result) {
    const fallback = SAMPLE_PUZZLES[0];
    return {
      puzzle: fallback ?? { id: "", name: "—", category: "", thumbnail: "", fullImage: "" },
      grid: { rows: 4, cols: 4 },
    };
  }
  return result;
}

/** Start the daily puzzle: set storage and return config for navigation */
export function startDailyPuzzle(): { imageUrl: string; grid: { rows: number; cols: number } } | null {
  const config = getDailyPuzzleForDate(getTodayDateString());
  if (!config) return null;

  const { puzzle, grid } = config;
  const dateStr = getTodayDateString();

  try {
    localStorage.setItem("phuzzle:imageDataUrl", puzzle.fullImage);
    localStorage.setItem("phuzzle:gridSize", `${grid.rows}x${grid.cols}`);
    localStorage.setItem(DAILY_DATE_KEY, dateStr);
  } catch (e) {
    console.warn("Failed to set daily puzzle:", e);
  }

  return { imageUrl: puzzle.fullImage, grid };
}

/** Check if current play session is a daily puzzle */
export function isDailyPuzzleSession(): boolean {
  try {
    const stored = localStorage.getItem(DAILY_DATE_KEY);
    return stored === getTodayDateString();
  } catch {
    return false;
  }
}

/** Record daily puzzle completion and return new streak */
export function recordDailyCompletion(elapsedSeconds: number): number {
  const dateStr = getTodayDateString();
  try {
    localStorage.setItem(`${DAILY_PREFIX}${dateStr}:completed`, "true");
    localStorage.setItem(`${DAILY_PREFIX}${dateStr}:time`, String(elapsedSeconds));
  } catch {
    // ignore
  }
  return getCurrentStreak();
}

/** Check if today's daily is already completed */
export function isTodayDailyCompleted(): boolean {
  try {
    return localStorage.getItem(`${DAILY_PREFIX}${getTodayDateString()}:completed`) === "true";
  } catch {
    return false;
  }
}

/** Get today's completion time in seconds, or null if not completed */
export function getTodayDailyTime(): number | null {
  try {
    const raw = localStorage.getItem(`${DAILY_PREFIX}${getTodayDateString()}:time`);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

/** Count consecutive days of completion ending today */
export function getCurrentStreak(): number {
  const today = getTodayDateString();
  let streak = 0;
  const d = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (localStorage.getItem(`${DAILY_PREFIX}${dateStr}:completed`) === "true") {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
