/**
 * Constants for usePlayScreenAnimation (RAF loop, throttling, lerp).
 */

/** Lerp factor for smooth drag position (0–1; higher = snappier). */
export const DRAG_LERP = 0.32;

/** Duration of lock-place ease animation (ms). Longer = softer settle (less “hard lock”). */
export const LOCK_LERP_MS = 205;

/** Max upward lift (px) when piece snaps; keep small so the lock doesn’t feel punchy. */
export const LOCK_LIFT_MAX_PX = 7;

/** Magnetic snap: fraction of snap delta per frame; lower = gentler slide toward slot. */
export const MAGNETIC_PULL_STRENGTH = 0.11;

/** When idle: throttle redraw to this FPS to keep static boards cool. */
export const IDLE_TARGET_FPS = 24;
export const IDLE_MIN_INTERVAL_MS = 1000 / IDLE_TARGET_FPS;

/** When idle and 64+ pieces: throttle more aggressively to reduce CPU. */
export const LARGE_PUZZLE_PIECE_COUNT = 64;
export const IDLE_TARGET_FPS_LARGE = 14;
export const IDLE_MIN_INTERVAL_MS_LARGE = 1000 / IDLE_TARGET_FPS_LARGE;

/** After the board has been still for a moment, redraw rarely; the canvas is static. */
export const QUIET_IDLE_AFTER_MS = 1200;
export const QUIET_IDLE_TARGET_FPS = 8;
export const QUIET_IDLE_MIN_INTERVAL_MS = 1000 / QUIET_IDLE_TARGET_FPS;

/** Piece count above which we throttle idle redraws. Lower when battery saver is on. */
export function getHighPieceCountThreshold(batterySaverMode: boolean): number {
  return batterySaverMode ? 25 : 50;
}

/** Idle time (ms) before showing "ghost when idle" hint. */
export const IDLE_GHOST_MS = 4000;

/** Idle time (ms) before a subtle pulse on one already-correct board piece (nudge when stuck). */
export const IDLE_CORRECT_PIECE_PULSE_MS = 5200;
