/**
 * Lightweight daily puzzle helpers. No puzzle/image imports.
 * Use when you only need completion/streak/date logic.
 * For puzzle selection, dynamically import dailyPuzzle.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";
export { GRID_OPTIONS } from "./dailyGridOptions";
import { GRID_OPTIONS } from "./dailyGridOptions";

export const DAILY_DATE_KEY = "phuzzle:dailyDate";
export const DAILY_MODIFIER_KEY = "phuzzle:dailyModifier";
export const DAILY_PREFERRED_MODIFIER_KEY = "phuzzle:dailyPreferredModifier";
const DAILY_PREFERRED_GRID_KEY = "phuzzle:dailyPreferredGrid";
const DAILY_PREFIX = "phuzzle:daily:";
const STREAK_FREEZE_KEY = "phuzzle:streakFreeze";
const STREAK_FREEZE_WEEK_KEY = "phuzzle:streakFreezeWeek";
const STREAK_FREEZE_EARNED_WEEK_KEY = "phuzzle:streakFreezeEarnedWeek";
const STREAK_FREEZE_DISMISSED_KEY = "phuzzle:streakFreezeDismissed";

export type DailyVisualModifier = "none" | "fog" | "night" | "sepia";

/** Read selected daily visual modifier for current run. */
export function getDailyVisualModifier(): DailyVisualModifier {
  try {
    const raw = safeLocalStorage.getItem(DAILY_MODIFIER_KEY);
    return raw === "fog" || raw === "night" || raw === "sepia" ? raw : "none";
  } catch {
    return "none";
  }
}

/** Read preferred visual modifier for next daily puzzle (Appearance setting). */
export function getDailyPreferredModifier(): DailyVisualModifier {
  try {
    const raw = safeLocalStorage.getItem(DAILY_PREFERRED_MODIFIER_KEY);
    return raw === "fog" || raw === "night" || raw === "sepia" ? raw : "none";
  } catch {
    return "none";
  }
}

/** Save preferred visual modifier for next daily puzzle. */
export function setDailyPreferredModifier(modifier: DailyVisualModifier): void {
  try {
    safeLocalStorage.setItem(DAILY_PREFERRED_MODIFIER_KEY, modifier);
  } catch {
    /* ignore */
  }
}

/** Get today's date string in user's local timezone (YYYY-MM-DD) */
export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Epoch for daily puzzle number (UTC). Day 1 = 2024-01-01. */
const DAILY_EPOCH_MS = new Date("2024-01-01T00:00:00.000Z").getTime();
const MS_PER_DAY = 86400000;

/** Deterministic daily puzzle number for today (days since epoch). Used for Daily Share format. */
export function getDailyPuzzleNumber(): number {
  const now = Date.now();
  const days = Math.floor((now - DAILY_EPOCH_MS) / MS_PER_DAY);
  return Math.max(1, days);
}

/** Get user's preferred daily difficulty index (0–6), or null if not set */
export function getDailyPreferredDifficultyIndex(): number | null {
  try {
    const raw = safeLocalStorage.getItem(DAILY_PREFERRED_GRID_KEY);
    if (raw === null) return null;
    const idx = parseInt(raw, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= GRID_OPTIONS.length) return null;
    return idx;
  } catch {
    return null;
  }
}

/** Save user's preferred daily difficulty index for future sessions */
export function setDailyPreferredDifficultyIndex(index: number): void {
  try {
    safeLocalStorage.setItem(DAILY_PREFERRED_GRID_KEY, String(index));
  } catch {
    /* ignore */
  }
}

/** Clear saved daily difficulty preference */
export function clearDailyPreferredDifficulty(): void {
  try {
    safeLocalStorage.removeItem(DAILY_PREFERRED_GRID_KEY);
  } catch {
    /* ignore */
  }
}

/** Get yesterday's date string (UTC, consistent with getTodayDateString) */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** True if user dismissed the streak freeze offer today (don't show again this session) */
export function wasFreezeOfferDismissedToday(): boolean {
  try {
    return (
      safeLocalStorage.getItem(
        `${STREAK_FREEZE_DISMISSED_KEY}:${getTodayDateString()}`,
      ) === "true"
    );
  } catch {
    return false;
  }
}

/** Mark the streak freeze offer as dismissed for today */
export function dismissFreezeOfferToday(): void {
  try {
    safeLocalStorage.setItem(
      `${STREAK_FREEZE_DISMISSED_KEY}:${getTodayDateString()}`,
      "true",
    );
  } catch {
    /* ignore */
  }
}

/** True if yesterday was not completed and no freeze was used for it */
export function wasYesterdayMissed(): boolean {
  try {
    const yesterday = getYesterdayDateString();
    const completed =
      safeLocalStorage.getItem(`${DAILY_PREFIX}${yesterday}:completed`) === "true";
    const freezeUsed =
      safeLocalStorage.getItem(`${STREAK_FREEZE_KEY}:used:${yesterday}`) === "true";
    return !completed && !freezeUsed;
  } catch {
    return false;
  }
}

/** Check if current play session is a daily puzzle */
export function isDailyPuzzleSession(): boolean {
  try {
    const stored = safeLocalStorage.getItem(DAILY_DATE_KEY);
    return stored === getTodayDateString();
  } catch {
    return false;
  }
}

/** Check if today's daily is already completed */
export function isTodayDailyCompleted(): boolean {
  try {
    return (
      safeLocalStorage.getItem(`${DAILY_PREFIX}${getTodayDateString()}:completed`) ===
      "true"
    );
  } catch {
    return false;
  }
}

/** Record daily puzzle completion and return new streak */
export function recordDailyCompletion(elapsedSeconds: number): number {
  const dateStr = getTodayDateString();
  try {
    safeLocalStorage.setItem(`${DAILY_PREFIX}${dateStr}:completed`, "true");
    safeLocalStorage.setItem(`${DAILY_PREFIX}${dateStr}:time`, String(elapsedSeconds));
    const streak = getCurrentStreak();
    tryEarnStreakFreeze(streak);
    return streak;
  } catch {
    /* ignore */
  }
  return getCurrentStreak();
}

/** Get today's completion time in seconds, or null if not completed */
export function getTodayDailyTime(): number | null {
  try {
    const raw = safeLocalStorage.getItem(`${DAILY_PREFIX}${getTodayDateString()}:time`);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

/** Get count of available streak freeze tokens (1 per week, max 1). Earned after 5-day streak. */
export function getStreakFreezeCount(): number {
  try {
    const raw = safeLocalStorage.getItem(STREAK_FREEZE_KEY);
    if (raw === null) return 0;
    const count = parseInt(raw, 10);
    return Number.isNaN(count) ? 0 : Math.min(1, Math.max(0, count));
  } catch {
    return 0;
  }
}

/** Get the week key for this week (weeks since epoch, unique per week). */
function getWeekKey(): string {
  return String(Math.floor(Date.now() / 604800000));
}

/**
 * Try to earn a streak freeze. Call after recording completion.
 * Earns 1 freeze per week when streak reaches 5+.
 */
export function tryEarnStreakFreeze(currentStreak: number): number {
  try {
    if (currentStreak < 5) return getStreakFreezeCount();
    const weekKey = getWeekKey();
    const earnedWeek = safeLocalStorage.getItem(STREAK_FREEZE_EARNED_WEEK_KEY);
    if (earnedWeek === weekKey) return getStreakFreezeCount();
    const count = getStreakFreezeCount();
    const newCount = Math.min(1, count + 1);
    safeLocalStorage.setItem(STREAK_FREEZE_KEY, String(newCount));
    safeLocalStorage.setItem(STREAK_FREEZE_EARNED_WEEK_KEY, weekKey);
    return newCount;
  } catch {
    return getStreakFreezeCount();
  }
}

/** Refill streak freeze at start of new week (reset earned flag). */
export function refreshStreakFreeze(): number {
  try {
    const weekKey = getWeekKey();
    const storedWeek = safeLocalStorage.getItem(STREAK_FREEZE_WEEK_KEY);
    if (storedWeek !== weekKey) {
      safeLocalStorage.setItem(STREAK_FREEZE_WEEK_KEY, weekKey);
    }
    return getStreakFreezeCount();
  } catch {
    return 1;
  }
}

/** Auto-apply streak freeze if yesterday was missed and we have one. Returns true if applied. */
export function tryAutoApplyStreakFreeze(): boolean {
  try {
    // E2E/QA: set phuzzle:testDisableAutoStreakFreeze=true to skip auto-apply and test manual offer
    if (safeLocalStorage.getItem("phuzzle:testDisableAutoStreakFreeze") === "true")
      return false;
  } catch {
    /* ignore */
  }
  if (!wasYesterdayMissed() || getStreakFreezeCount() <= 0) return false;
  return useStreakFreeze(getYesterdayDateString());
}

/** Use a streak freeze for a specific date (when user missed that day). Returns true if consumed. */
export function useStreakFreeze(forDate: string): boolean {
  const count = getStreakFreezeCount();
  if (count <= 0) return false;
  try {
    safeLocalStorage.setItem(STREAK_FREEZE_KEY, String(count - 1));
    safeLocalStorage.setItem(`${STREAK_FREEZE_KEY}:used:${forDate}`, "true");
    return true;
  } catch {
    return false;
  }
}

/** Check if a streak freeze was used for a given date. */
function wasFreezeUsedFor(dateStr: string): boolean {
  try {
    return safeLocalStorage.getItem(`${STREAK_FREEZE_KEY}:used:${dateStr}`) === "true";
  } catch {
    return false;
  }
}

/** Count consecutive days of completion ending today. Treats freeze-used dates as complete. */
export function getCurrentStreak(): number {
  const today = getTodayDateString();
  let streak = 0;
  const d = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    const completed =
      safeLocalStorage.getItem(`${DAILY_PREFIX}${dateStr}:completed`) === "true" ||
      wasFreezeUsedFor(dateStr);
    if (completed) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Call at app init to refresh freeze count and auto-apply if day was missed. */
export function initStreakFreeze(): void {
  refreshStreakFreeze();
  tryAutoApplyStreakFreeze();
}
