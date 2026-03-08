/**
 * Daily Puzzle - deterministic puzzle selection from date.
 * Same date = same puzzle for everyone (client-only, no backend).
 * Load via dynamic import when user opens daily modal to avoid pulling samplePuzzles
 * into initial bundle.
 */
import { SAMPLE_PUZZLES } from "@/data/packs/samplePuzzles";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";

import { safeLocalStorage } from "@/utils/safeLocalStorage";
import {
  getTodayDateString,
  DAILY_DATE_KEY,
  DAILY_MODIFIER_KEY,
} from "./dailyPuzzleCore";

export {
  GRID_OPTIONS,
  DAILY_DATE_KEY,
  DAILY_MODIFIER_KEY,
  getDailyPreferredModifier,
  setDailyPreferredModifier,
  getTodayDateString,
  getYesterdayDateString,
  getDailyPreferredDifficultyIndex,
  setDailyPreferredDifficultyIndex,
  clearDailyPreferredDifficulty,
  isDailyPuzzleSession,
  isTodayDailyCompleted,
  recordDailyCompletion,
  getTodayDailyTime,
  getCurrentStreak,
  getStreakFreezeCount,
  useStreakFreeze,
  wasYesterdayMissed,
  wasFreezeOfferDismissedToday,
  dismissFreezeOfferToday,
  initStreakFreeze,
  refreshStreakFreeze,
  getDailyVisualModifier,
  type DailyVisualModifier,
} from "./dailyPuzzleCore";

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash string to number for reproducible daily selection. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Get the puzzle for a given date (deterministic, good distribution). Same date = same puzzle for everyone. */
export function getDailyPuzzleForDate(dateStr: string): SamplePuzzle | null {
  const puzzles = SAMPLE_PUZZLES;
  if (puzzles.length === 0) return null;

  const seed = hashString(`phuzzle-daily-${dateStr}`);
  const rng = mulberry32(seed);
  const puzzleIndex = Math.floor(rng() * puzzles.length);
  return puzzles[puzzleIndex];
}

/** Get today's daily puzzle (image only). User picks difficulty. */
export function getTodayDailyPuzzle(): SamplePuzzle | null {
  return getDailyPuzzleForDate(getTodayDateString());
}

/** Start the daily puzzle with user-chosen grid size */
export function startDailyPuzzle(
  grid: { rows: number; cols: number },
  modifier: "none" | "fog" | "night" | "sepia" = "none",
): {
  imageUrl: string;
  grid: { rows: number; cols: number };
} | null {
  const puzzle = getDailyPuzzleForDate(getTodayDateString());
  if (!puzzle) return null;

  const dateStr = getTodayDateString();

  safeLocalStorage.setItem("phuzzle:imageDataUrl", puzzle.fullImage);
  safeLocalStorage.setItem("phuzzle:gridSize", `${grid.rows}x${grid.cols}`);
  safeLocalStorage.setItem(DAILY_DATE_KEY, dateStr);
  safeLocalStorage.setItem(DAILY_MODIFIER_KEY, modifier);

  return { imageUrl: puzzle.fullImage, grid };
}
