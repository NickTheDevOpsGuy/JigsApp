/** Time tracking modes for different play styles */
export type TimeMode =
  | "elapsed" // Count up from 0 (default)
  | "countdown" // Start at limit, game over at 0
  | "active" // Only count while moving pieces
  | "relaxed" // Same as elapsed but timer hidden
  | "best"; // Track personal best per grid size

export const TIME_MODE_KEY = "phuzzle:timeMode";
export const COUNTDOWN_MINUTES_KEY = "phuzzle:countdownMinutes";
export const BEST_TIME_PREFIX = "phuzzle:bestTime_";

export const DEFAULT_TIME_MODE: TimeMode = "elapsed";
export const DEFAULT_COUNTDOWN_MINUTES = 10;
export const COUNTDOWN_OPTIONS = [5, 10, 15, 20, 30] as const;
export const ACTIVE_IDLE_MS = 2500; // Stop counting after 2.5s idle

export function getBestTimeKey(rows: number, cols: number): string {
  return `${BEST_TIME_PREFIX}${rows}x${cols}`;
}

export function getBestTime(rows: number, cols: number): number | null {
  try {
    const raw = localStorage.getItem(getBestTimeKey(rows, cols));
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function setBestTime(rows: number, cols: number, seconds: number): void {
  try {
    localStorage.setItem(getBestTimeKey(rows, cols), String(seconds));
  } catch {
    // ignore
  }
}
