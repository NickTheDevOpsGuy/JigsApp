/**
 * Lightweight daily puzzle helpers. No puzzle/image imports.
 * Use when you only need completion/streak/date logic.
 * For puzzle selection, dynamically import dailyPuzzle.
 */
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
const STREAK_FREEZE_KEY = "phuzzle:streakFreeze";
const STREAK_FREEZE_WEEK_KEY = "phuzzle:streakFreezeWeek";

/** Get today's date string in user's local timezone (YYYY-MM-DD) */
export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Get yesterday's date string */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** True if yesterday was not completed and no freeze was used for it */
export function wasYesterdayMissed(): boolean {
  try {
    const yesterday = getYesterdayDateString();
    const completed =
      localStorage.getItem(`${DAILY_PREFIX}${yesterday}:completed`) === "true";
    const freezeUsed =
      localStorage.getItem(`${STREAK_FREEZE_KEY}:used:${yesterday}`) === "true";
    return !completed && !freezeUsed;
  } catch {
    return false;
  }
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

/** Record daily puzzle completion and return new streak */
export function recordDailyCompletion(elapsedSeconds: number): number {
  const dateStr = getTodayDateString();
  try {
    localStorage.setItem(`${DAILY_PREFIX}${dateStr}:completed`, "true");
    localStorage.setItem(`${DAILY_PREFIX}${dateStr}:time`, String(elapsedSeconds));
  } catch {
    /* ignore */
  }
  return getCurrentStreak();
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

/** Get count of available streak freeze tokens (1 per week, max 1). */
export function getStreakFreezeCount(): number {
  try {
    const raw = localStorage.getItem(STREAK_FREEZE_KEY);
    if (raw === null) return 1;
    const count = parseInt(raw, 10);
    return Number.isNaN(count) ? 1 : Math.min(1, Math.max(0, count));
  } catch {
    return 1;
  }
}

/** Get the week key for this week (weeks since epoch, unique per week). */
function getWeekKey(): string {
  return String(Math.floor(Date.now() / 604800000));
}

/** Refill streak freeze to 1 at start of each week. Returns current count. */
export function refreshStreakFreeze(): number {
  try {
    const weekKey = getWeekKey();
    const storedWeek = localStorage.getItem(STREAK_FREEZE_WEEK_KEY);
    if (storedWeek !== weekKey) {
      localStorage.setItem(STREAK_FREEZE_KEY, "1");
      localStorage.setItem(STREAK_FREEZE_WEEK_KEY, weekKey);
      return 1;
    }
    return getStreakFreezeCount();
  } catch {
    return 1;
  }
}

/** Use a streak freeze for a specific date (when user missed that day). Returns true if consumed. */
export function useStreakFreeze(forDate: string): boolean {
  const count = getStreakFreezeCount();
  if (count <= 0) return false;
  try {
    localStorage.setItem(STREAK_FREEZE_KEY, String(count - 1));
    localStorage.setItem(`${STREAK_FREEZE_KEY}:used:${forDate}`, "true");
    return true;
  } catch {
    return false;
  }
}

/** Check if a streak freeze was used for a given date. */
function wasFreezeUsedFor(dateStr: string): boolean {
  try {
    return localStorage.getItem(`${STREAK_FREEZE_KEY}:used:${dateStr}`) === "true";
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
      localStorage.getItem(`${DAILY_PREFIX}${dateStr}:completed`) === "true" ||
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

/** Call at app init to refresh freeze count for new week. */
export function initStreakFreeze(): void {
  refreshStreakFreeze();
}
