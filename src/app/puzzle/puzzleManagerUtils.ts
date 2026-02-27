/**
 * Pure helpers for PuzzleManager (undo limit, clamping, snap tolerance).
 */
import type { MutableRefObject } from "react";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

/** Undo limit: 50 for ≤64 pieces, 25 for 81+ to reduce memory on large puzzles. */
export function getUndoLimit(pieceCount: number): number {
  return pieceCount <= 64 ? 50 : 25;
}

export type EffectiveToleranceOptions = {
  snapScaleRef?: MutableRefObject<number> | undefined;
  relaxedToleranceMultiplierRef?: MutableRefObject<number> | undefined;
  snapToleranceOverrideRef?: MutableRefObject<number> | undefined;
  isMobile: boolean;
};

/**
 * Zoom-adaptive snap tolerance (board or neighbor).
 * Used by PuzzleManager for getEffectiveTolerance logic.
 */
export function getEffectiveTolerance(
  basePx: number,
  options: EffectiveToleranceOptions,
): number {
  const scale = Math.max(0.25, Math.min(4, options.snapScaleRef?.current ?? 1));
  const relaxedMult = options.relaxedToleranceMultiplierRef?.current ?? 1;
  const overrideMult = Math.max(
    0.6,
    Math.min(1.6, options.snapToleranceOverrideRef?.current ?? 1),
  );
  const mobileBump = options.isMobile ? 1.2 : 1;
  let effective = basePx * mobileBump;

  if (scale < 1) {
    const zoomOutBoost = options.isMobile
      ? 1 + (1 - scale) * 1.25
      : 1 + (1 - scale) * 0.75;
    effective *= zoomOutBoost;
  } else if (scale > 1) {
    const zoomInTighten = options.isMobile
      ? 1 / (1 + (scale - 1) * 0.45)
      : 1 / (1 + (scale - 1) * 0.8);
    effective *= zoomInTighten;
  }

  effective *= relaxedMult * overrideMult;

  const minMult = options.isMobile ? 0.45 : 0.35;
  const maxMult = options.isMobile ? 3 : 2.5;
  return clamp(effective, basePx * minMult, basePx * maxMult);
}
