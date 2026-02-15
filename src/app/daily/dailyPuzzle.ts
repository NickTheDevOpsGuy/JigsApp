/**
 * Daily Puzzle - deterministic puzzle selection from date.
 * Same date = same puzzle for everyone (client-only, no backend).
 * User chooses difficulty (grid size) - same image, different piece counts.
 */

import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import type { SamplePuzzle } from "@/data/samplePuzzles";

export const GRID_OPTIONS = [
  { rows: 3, cols: 3, label: "Easy 🌱", pieces: 9 },
  { rows: 4, cols: 4, label: "Medium ⚡", pieces: 16 },
  { rows: 5, cols: 5, label: "Hard 🔥", pieces: 25 },
  { rows: 6, cols: 6, label: "Expert 👑", pieces: 36 },
  { rows: 7, cols: 7, label: "Master 🧠", pieces: 49 },
  { rows: 8, cols: 8, label: "Legend 🔮", pieces: 64 },
] as const;

export const DAILY_DATE_KEY = "phuzzle:dailyDate";
const DAILY_PREFIX = "phuzzle:daily:";

/**
 * Mulberry32 - fast 32-bit PRNG with good distribution.
 * Seeded with date so same date = same puzzle for everyone.
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed from date string (YYYY-MM-DD) for deterministic but well-distributed selection */
function seedFromDate(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getTime();
}

/** Get today's date string in user's local timezone (YYYY-MM-DD) */
export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Get the puzzle for a given date (deterministic). Grid is chosen by user. */
export function getDailyPuzzleForDate(dateStr: string): SamplePuzzle | null {
  const puzzles = SAMPLE_PUZZLES;
  if (puzzles.length === 0) return null;

  const seed = seedFromDate(dateStr);
  const rng = mulberry32(seed);
  const puzzleIndex = Math.floor(rng() * puzzles.length);
  return puzzles[puzzleIndex];
}

/** Get today's daily puzzle (image only). User picks difficulty. */
export function getTodayDailyPuzzle(): SamplePuzzle | null {
  return getDailyPuzzleForDate(getTodayDateString());
}

/** Start the daily puzzle with user-chosen grid size */
export function startDailyPuzzle(grid: { rows: number; cols: number }): {
  imageUrl: string;
  grid: { rows: number; cols: number };
} | null {
  const puzzle = getDailyPuzzleForDate(getTodayDateString());
  if (!puzzle) return null;

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
    return (
      localStorage.getItem(`${DAILY_PREFIX}${getTodayDateString()}:completed`) === "true"
    );
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
