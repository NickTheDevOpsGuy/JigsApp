/**
 * Daily Puzzle - deterministic puzzle selection from date.
 * Same date = same puzzle for everyone (client-only, no backend).
 * Load via dynamic import when user opens daily modal to avoid pulling samplePuzzles
 * into initial bundle.
 */
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import type { SamplePuzzle } from "@/data/samplePuzzles";

import { getTodayDateString, DAILY_DATE_KEY } from "./dailyPuzzleCore";

export {
  GRID_OPTIONS,
  DAILY_DATE_KEY,
  getTodayDateString,
  isDailyPuzzleSession,
  isTodayDailyCompleted,
  recordDailyCompletion,
  getTodayDailyTime,
  getCurrentStreak,
} from "./dailyPuzzleCore";

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDate(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getTime();
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
