/**
 * Shared piece ordering for canvas draw + hit testing.
 *
 * Guarantees:
 * - Locked/placed pieces render below movable pieces.
 * - Higher z draws on top (and is hit-tested first).
 * - Active dragged group always renders above all others.
 */
import type { Piece } from "@/puzzle/types";

function isBottomLayer(piece: Piece): boolean {
  return piece.isPlaced || piece.locked;
}

function compareBackToFront(a: Piece, b: Piece): number {
  const aBottom = isBottomLayer(a);
  const bBottom = isBottomLayer(b);
  if (aBottom !== bBottom) return aBottom ? -1 : 1;
  if (a.z !== b.z) return a.z - b.z;
  if (a.groupId !== b.groupId) return a.groupId.localeCompare(b.groupId);
  return a.id.localeCompare(b.id);
}

/**
 * Sort pieces in draw order (back -> front).
 */
export function sortPiecesForDraw(
  pieces: Piece[],
  draggedGroupId: string | null,
): Piece[] {
  return [...pieces].sort((a, b) => {
    if (draggedGroupId != null) {
      const aDragging = a.groupId === draggedGroupId;
      const bDragging = b.groupId === draggedGroupId;
      if (aDragging !== bDragging) return aDragging ? 1 : -1;
    }
    return compareBackToFront(a, b);
  });
}

/**
 * Sort pieces in hit-test order (front -> back).
 */
export function sortPiecesForHitTest(pieces: Piece[]): Piece[] {
  return [...pieces].sort((a, b) => compareBackToFront(b, a));
}
