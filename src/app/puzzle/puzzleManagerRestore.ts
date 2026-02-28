/**
 * Pure helpers for restoring piece state from saved snapshots (undo/redo).
 * Used by PuzzleManager.restoreFromSaved.
 */
import type { Piece } from "./types";
import type { SavedPiece } from "./puzzleStorage";

/**
 * Merge saved piece data into current pieces. Returns new array; does not mutate.
 * Validates count and id set; throws if mismatch.
 */
export function applySavedPieces(
  currentPieces: Piece[],
  savedPieces: SavedPiece[],
): Piece[] {
  if (savedPieces.length !== currentPieces.length) {
    throw new Error(
      `Saved piece count (${savedPieces.length}) does not match grid (${currentPieces.length})`,
    );
  }
  const pieceMap = new Map(savedPieces.map((p) => [p.id, p]));
  const currentIds = new Set(currentPieces.map((p) => p.id));
  for (const sp of savedPieces) {
    if (!currentIds.has(sp.id)) {
      throw new Error(`Saved piece id ${sp.id} not found in current puzzle`);
    }
  }

  return currentPieces.map((p) => {
    const saved = pieceMap.get(p.id);
    if (saved) {
      return {
        ...p,
        x: saved.x,
        y: saved.y,
        z: saved.z,
        rotation: saved.rotation,
        groupId: saved.groupId,
        isPlaced: saved.isPlaced,
        locked: saved.locked ?? false,
        inTray: saved.inTray,
        dragCount: saved.dragCount ?? p.dragCount ?? 0,
      };
    }
    return p;
  });
}

/** Dev-only: warn if any piece has invalid groupId. */
export function assertGroupConsistency(pieces: Piece[]): void {
  if (import.meta.env?.DEV !== true) return;
  for (const p of pieces) {
    if (!p.groupId || typeof p.groupId !== "string") {
      console.warn("[PuzzleManager] Piece has invalid groupId after restore:", p.id);
    }
  }
}
