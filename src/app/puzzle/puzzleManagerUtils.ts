/**
 * Pure helpers for PuzzleManager (undo limit, clamping, snap tolerance, tray placement).
 */
import type { MutableRefObject } from "react";
import type { Piece } from "./types";

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
  /** Dynamic Difficulty: 0.9 = tighter (skilled), 1.1 = more forgiving */
  dynamicDifficultyMultiplierRef?: MutableRefObject<number> | undefined;
  isMobile: boolean;
};

/**
 * Zoom-adaptive snap tolerance (board or neighbor).
 * Used by PuzzleManager for getEffectiveTolerance logic.
 */
/**
 * @param firstSnapMultiplier - Slightly > 1 for first placement only (early competence feel).
 */
export function getEffectiveTolerance(
  basePx: number,
  options: EffectiveToleranceOptions,
  firstSnapMultiplier = 1,
): number {
  const scale = Math.max(0.25, Math.min(4, options.snapScaleRef?.current ?? 1));
  const relaxedMult = options.relaxedToleranceMultiplierRef?.current ?? 1;
  const overrideMult = Math.max(
    0.6,
    Math.min(1.6, options.snapToleranceOverrideRef?.current ?? 1),
  );
  const dynamicMult = options.dynamicDifficultyMultiplierRef?.current ?? 1;
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

  effective *= relaxedMult * overrideMult * dynamicMult * firstSnapMultiplier;

  const minMult = options.isMobile ? 0.45 : 0.35;
  const maxMult = options.isMobile ? 3 : 2.5;
  return clamp(effective, basePx * minMult, basePx * maxMult);
}

const MOVE_FROM_TRAY_PAD = 16;
const MOVE_FROM_TRAY_RETRY_MAX = 24;

/**
 * Find a non-overlapping (x, y) for a piece being moved from tray onto the board.
 * Returns container top-left position; uses effective rotated bbox for overlap check.
 */
export function findPlacementFromTray(
  boardWidth: number,
  boardHeight: number,
  piece: Piece,
  boardPieces: Piece[],
  rand: (min: number, max: number) => number,
): { x: number; y: number } {
  const rot = piece.rotation % 360;
  const effW = rot === 90 || rot === 270 ? piece.h : piece.w;
  const effH = rot === 90 || rot === 270 ? piece.w : piece.h;
  const offsetX = (piece.w - effW) / 2;
  const offsetY = (piece.h - effH) / 2;

  const pad = MOVE_FROM_TRAY_PAD;
  const xMin = pad - offsetX;
  const xMax = Math.max(xMin, boardWidth - effW - pad - offsetX);
  const yMin = pad - offsetY;
  const yMax = Math.max(yMin, boardHeight - effH - pad - offsetY);

  let x = rand(xMin, xMax);
  let y = rand(yMin, yMax);
  for (let retry = 0; retry < MOVE_FROM_TRAY_RETRY_MAX; retry++) {
    x = clamp(rand(xMin, xMax), xMin, Math.max(xMin, boardWidth - effW - pad - offsetX));
    y = clamp(rand(yMin, yMax), yMin, Math.max(yMin, boardHeight - effH - pad - offsetY));

    const ourLeft = x + offsetX;
    const ourTop = y + offsetY;
    let overlaps = false;
    for (const p of boardPieces) {
      const pr = p.rotation % 360;
      const pw = pr === 90 || pr === 270 ? p.h : p.w;
      const ph = pr === 90 || pr === 270 ? p.w : p.h;
      const pOffX = (p.w - pw) / 2;
      const pOffY = (p.h - ph) / 2;
      const pLeft = p.x + pOffX;
      const pTop = p.y + pOffY;
      if (
        !(
          ourLeft + effW <= pLeft ||
          pLeft + pw <= ourLeft ||
          ourTop + effH <= pTop ||
          pTop + ph <= ourTop
        )
      ) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) break;
  }
  return { x, y };
}
