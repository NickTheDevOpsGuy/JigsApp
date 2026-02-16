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

/** Get today's date string in user's local timezone (YYYY-MM-DD) */
export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
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
