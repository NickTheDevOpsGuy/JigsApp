/**
 * Daily Puzzle - deterministic puzzle selection from date.
 * Same date = same puzzle for everyone (client-only, no backend).
 * Load via dynamic import when user opens daily modal to avoid pulling samplePuzzles
 * into initial bundle.
 */
import { getCategorySpotlight } from "@/data/packs/categoryDisplay";
import { SAMPLE_PUZZLES, getDailyRotationCategoryIds } from "@/data/packs/samplePuzzles";
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

/**
 * Featured category for a calendar day (rotates through categories that have puzzles).
 * Same date ⇒ same category for everyone.
 */
export function getDailyFeaturedCategoryIdForDate(dateStr: string): string | null {
  const ids = getDailyRotationCategoryIds();
  if (ids.length === 0) return null;
  const seed = hashString(`phuzzle-daily-category-${dateStr}`);
  const rng = mulberry32(seed);
  const idx = Math.floor(rng() * ids.length);
  return ids[idx] ?? null;
}

/**
 * Deterministic daily puzzle: picked from that day’s featured category so each day
 * highlights variety and gives players a reason to check back.
 */
export function getDailyPuzzleForDate(dateStr: string): SamplePuzzle | null {
  const puzzles = SAMPLE_PUZZLES;
  if (puzzles.length === 0) return null;

  const catId = getDailyFeaturedCategoryIdForDate(dateStr);
  const pool = catId ? puzzles.filter((p) => p.category === catId) : puzzles;
  const usePool = pool.length > 0 ? pool : puzzles;

  const seed = hashString(`phuzzle-daily-puzzle-${dateStr}-${catId ?? "all"}`);
  const rng = mulberry32(seed);
  const puzzleIndex = Math.floor(rng() * usePool.length);
  return usePool[puzzleIndex] ?? null;
}

/** Today’s spotlight copy for menu / marketing (dynamic import from home to avoid eager puzzle assets). */
export function getTodayDailySpotlight(): {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  puzzleName: string;
} | null {
  const dateStr = getTodayDateString();
  const puzzle = getDailyPuzzleForDate(dateStr);
  const catId = getDailyFeaturedCategoryIdForDate(dateStr);
  if (!puzzle || !catId) return null;
  const meta = getCategorySpotlight(catId);
  return {
    categoryId: catId,
    categoryName: meta.name,
    categoryEmoji: meta.emoji,
    puzzleName: puzzle.name,
  };
}

/** Get today's daily puzzle (image only). User picks difficulty. */
export function getTodayDailyPuzzle(): SamplePuzzle | null {
  return getDailyPuzzleForDate(getTodayDateString());
}

function addLocalDays(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y || 1970, (m || 1) - 1, d || 1 + deltaDays);
  if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
    date.setDate((d || 1) + deltaDays);
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getDailyArchiveItems(count = 5): Array<{
  dateStr: string;
  puzzle: SamplePuzzle;
  completed: boolean;
}> {
  const today = getTodayDateString();
  const items: Array<{ dateStr: string; puzzle: SamplePuzzle; completed: boolean }> = [];
  for (let i = 1; i <= count; i++) {
    const dateStr = addLocalDays(today, -i);
    const puzzle = getDailyPuzzleForDate(dateStr);
    if (!puzzle) continue;
    items.push({
      dateStr,
      puzzle,
      completed:
        safeLocalStorage.getItem(`phuzzle:daily:${dateStr}:completed`) === "true",
    });
  }
  return items;
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

/** Start a past daily as an archive puzzle. Archive plays do not count for today's streak. */
export function startDailyArchivePuzzle(
  dateStr: string,
  grid: { rows: number; cols: number },
): {
  imageUrl: string;
  grid: { rows: number; cols: number };
} | null {
  const puzzle = getDailyPuzzleForDate(dateStr);
  if (!puzzle) return null;

  safeLocalStorage.setItem("phuzzle:imageDataUrl", puzzle.fullImage);
  safeLocalStorage.setItem("phuzzle:gridSize", `${grid.rows}x${grid.cols}`);
  safeLocalStorage.setItem("phuzzle:puzzleName", puzzle.name);
  safeLocalStorage.removeItem(DAILY_DATE_KEY);
  safeLocalStorage.removeItem(DAILY_MODIFIER_KEY);

  return { imageUrl: puzzle.fullImage, grid };
}
