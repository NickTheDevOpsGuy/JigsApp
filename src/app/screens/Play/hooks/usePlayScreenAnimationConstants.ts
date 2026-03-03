/**
 * Constants for usePlayScreenAnimation (RAF loop, throttling, lerp).
 */

/** Lerp factor for smooth drag position (0–1; higher = snappier). */
export const DRAG_LERP = 0.32;

/** Duration of lock-place ease animation (ms). Longer + smooth easing so lock feels good in any direction. */
export const LOCK_LERP_MS = 240;

/** When idle: throttle redraw to this FPS for 50+ piece puzzles. */
export const IDLE_TARGET_FPS = 30;
export const IDLE_MIN_INTERVAL_MS = 1000 / IDLE_TARGET_FPS;

/** Piece count above which we throttle idle redraws. Lower when battery saver is on. */
export function getHighPieceCountThreshold(batterySaverMode: boolean): number {
  return batterySaverMode ? 25 : 50;
}

/** Idle time (ms) before showing "ghost when idle" hint. */
export const IDLE_GHOST_MS = 4000;
