/**
 * Constants for usePlayScreenAnimation (RAF loop, throttling, lerp).
 */

/** Lerp factor for smooth drag position (0–1; higher = snappier). */
export const DRAG_LERP = 0.32;

/** Duration of lock-place ease animation (ms). Short (100–150ms) for satisfying snap. */
export const LOCK_LERP_MS = 120;

/** Max upward lift (px) when piece snaps; actual lift scales with piece height for mobile and desktop. */
export const LOCK_LIFT_MAX_PX = 12;

/** Magnetic snap: fraction of snap delta applied per frame when within snap radius (smooth slide into place). */
export const MAGNETIC_PULL_STRENGTH = 0.15;

/** When idle: throttle redraw to this FPS for 50+ piece puzzles. */
export const IDLE_TARGET_FPS = 30;
export const IDLE_MIN_INTERVAL_MS = 1000 / IDLE_TARGET_FPS;

/** Piece count above which we throttle idle redraws. Lower when battery saver is on. */
export function getHighPieceCountThreshold(batterySaverMode: boolean): number {
  return batterySaverMode ? 25 : 50;
}

/** Idle time (ms) before showing "ghost when idle" hint. */
export const IDLE_GHOST_MS = 4000;
