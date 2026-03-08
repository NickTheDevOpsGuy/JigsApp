import type { Piece, GridSize } from "@/puzzle/core/types";

/**
 * SnapLogic
 *
 * Pure logic helpers for snapping behavior.
 * No DOM, no canvas, no side effects.
 *
 * PuzzleManager calls into these functions to decide:
 * - should a piece snap to the board?
 * - should it snap to a neighbor?
 * - should groups merge?
 */

export type SnapResult =
  | { kind: "none" }
  | { kind: "board"; pieceId: string }
  | { kind: "neighbor"; a: string; b: string };

export function trySnapToBoard(piece: Piece, snapTolerancePx: number): boolean {
  const dx = Math.abs(piece.x + piece.pad - piece.targetX);
  const dy = Math.abs(piece.y + piece.pad - piece.targetY);
  const dr = normalizeRotation(piece.rotation - piece.targetRotation);

  return dx <= snapTolerancePx && dy <= snapTolerancePx && dr === 0;
}

/**
 * Try snapping piece A to piece B.
 * Only works if:
 * - they are grid neighbors
 * - rotations match
 * - relative position is within tolerance
 */
export function trySnapToNeighbor(
  a: Piece,
  b: Piece,
  grid: GridSize,
  snapTolerancePx: number,
): boolean {
  if (a.rotation !== b.rotation) return false;

  const dRow = a.row - b.row;
  const dCol = a.col - b.col;

  // must be cardinal neighbors
  if (Math.abs(dRow) + Math.abs(dCol) !== 1) return false;

  const expectedDx = (a.col - b.col) * a.tileW;
  const expectedDy = (a.row - b.row) * a.tileH;

  const actualDx = a.x + a.pad - (b.x + b.pad);
  const actualDy = a.y + a.pad - (b.y + b.pad);

  const dxErr = Math.abs(actualDx - expectedDx);
  const dyErr = Math.abs(actualDy - expectedDy);

  return dxErr <= snapTolerancePx && dyErr <= snapTolerancePx;
}

/**
 * Merge two groups by assigning the same groupId.
 */
export function mergeGroups(pieces: Piece[], groupA: string, groupB: string): void {
  if (groupA === groupB) return;

  for (const p of pieces) {
    if (p.groupId === groupB) {
      p.groupId = groupA;
    }
  }
}

/**
 * Normalize rotation to 0, 90, 180, 270
 */
function normalizeRotation(deg: number): number {
  return ((Math.round(deg) % 360) + 360) % 360;
}
