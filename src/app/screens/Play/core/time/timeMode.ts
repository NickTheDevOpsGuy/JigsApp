/**
 * timeMode values + helpers for persisted mode handling.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export type TimeMode =
  | "elapsed" // Legacy mode (kept for backward compatibility in stored values)
  | "countdown" // Start at limit, game over at 0
  | "active" // Only count while moving pieces
  | "relaxed" // Same as elapsed but timer hidden
  | "best" // Track personal best per grid size
  | "speedrun" // Quadrant timers + PB comparison
  | "timeattack"; // 3 lives, wrong snap costs life, leaderboard by time + lives

export type SelectableTimeMode = Exclude<TimeMode, "elapsed">;

export const TIME_MODE_KEY = "phuzzle:timeMode";
export const COUNTDOWN_MINUTES_KEY = "phuzzle:countdownMinutes";
export const BEST_TIME_PREFIX = "phuzzle:bestTime_";

export const DEFAULT_TIME_MODE: SelectableTimeMode = "active";
export const DEFAULT_COUNTDOWN_MINUTES = 10;
export const COUNTDOWN_OPTIONS = [5, 10, 15, 20, 30] as const;
export const ACTIVE_IDLE_MS = 2500; // Stop counting after 2.5s idle

export const SELECTABLE_TIME_MODES: readonly SelectableTimeMode[] = [
  "countdown",
  "active",
  "relaxed",
  "best",
  "speedrun",
  "timeattack",
];

export function normalizeTimeMode(value: string | null | undefined): SelectableTimeMode {
  if (!value || value === "elapsed") return DEFAULT_TIME_MODE;
  if ((SELECTABLE_TIME_MODES as readonly string[]).includes(value)) {
    return value as SelectableTimeMode;
  }
  return DEFAULT_TIME_MODE;
}

export function getBestTimeKey(rows: number, cols: number): string {
  return `${BEST_TIME_PREFIX}${rows}x${cols}`;
}

export function getBestTime(rows: number, cols: number): number | null {
  const raw = safeLocalStorage.getItem(getBestTimeKey(rows, cols));
  return raw ? parseInt(raw, 10) : null;
}

export function setBestTime(rows: number, cols: number, seconds: number): void {
  safeLocalStorage.setItem(getBestTimeKey(rows, cols), String(seconds));
}

/** Quadrant indices: 0=TL, 1=TR, 2=BL, 3=BR */
export function getQuadrant(
  row: number,
  col: number,
  rows: number,
  cols: number,
): 0 | 1 | 2 | 3 {
  const midR = rows / 2;
  const midC = cols / 2;
  if (row < midR && col < midC) return 0;
  if (row < midR && col >= midC) return 1;
  if (row >= midR && col < midC) return 2;
  return 3;
}

const QUADRANT_PB_PREFIX = "phuzzle:quadrantPb_";
export function getQuadrantPbKey(rows: number, cols: number, q: 0 | 1 | 2 | 3): string {
  return `${QUADRANT_PB_PREFIX}${rows}x${cols}_q${q}`;
}
export function getQuadrantPb(
  rows: number,
  cols: number,
  q: 0 | 1 | 2 | 3,
): number | null {
  const raw = safeLocalStorage.getItem(getQuadrantPbKey(rows, cols, q));
  return raw ? parseInt(raw, 10) : null;
}
export function setQuadrantPb(
  rows: number,
  cols: number,
  q: 0 | 1 | 2 | 3,
  seconds: number,
): void {
  safeLocalStorage.setItem(getQuadrantPbKey(rows, cols, q), String(seconds));
}
