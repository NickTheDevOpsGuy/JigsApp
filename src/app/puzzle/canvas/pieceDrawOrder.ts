/**
 * Shared piece ordering for canvas draw + hit testing.
 *
 * Guarantees:
 * - Higher z draws on top (bumpGroupZ on drag/snap keeps active groups visible).
 * - Active dragged group always renders above all others.
 * - Hit-test order mirrors draw order.
 */
import type { Piece } from "@/puzzle/types";

function layerBucketFromFlags(flags: { hasMovable: boolean }): number {
  return flags.hasMovable ? 1 : 0;
}

function buildGroupLayerMap(pieces: Piece[]): Map<string, { hasMovable: boolean }> {
  const map = new Map<string, { hasMovable: boolean }>();
  for (const p of pieces) {
    const groupId = p.groupId;
    const prev = map.get(groupId);
    const isMovable = !p.locked && !p.isPlaced;
    if (!prev) {
      map.set(groupId, { hasMovable: isMovable });
      continue;
    }
    if (isMovable && !prev.hasMovable) prev.hasMovable = true;
  }
  return map;
}

function compareBackToFront(
  a: Piece,
  b: Piece,
  groupLayerMap: Map<string, { hasMovable: boolean }>,
): number {
  const aMovable = !a.locked && !a.isPlaced;
  const bMovable = !b.locked && !b.isPlaced;
  // Per-piece invariant: movable pieces must draw above locked/placed pieces.
  if (aMovable !== bMovable) return aMovable ? 1 : -1;

  const aFlags = groupLayerMap.get(a.groupId) ?? { hasMovable: !a.locked && !a.isPlaced };
  const bFlags = groupLayerMap.get(b.groupId) ?? { hasMovable: !b.locked && !b.isPlaced };
  const layerDelta = layerBucketFromFlags(aFlags) - layerBucketFromFlags(bFlags);
  if (layerDelta !== 0) return layerDelta;
  if (a.z !== b.z) return a.z - b.z;
  /* Tie-break: just-snapped pieces draw on top so they never pop behind */
  if (a.justSnapped !== b.justSnapped) return a.justSnapped ? 1 : -1;
  if (a.groupId !== b.groupId) return a.groupId.localeCompare(b.groupId);
  return a.id.localeCompare(b.id);
}

/**
 * Sort pieces in draw order (back -> front).
 * Pure z-order draw with dragged-group override.
 */
export function sortPiecesForDraw(
  pieces: Piece[],
  draggedGroupId: string | null,
): Piece[] {
  const groupLayerMap = buildGroupLayerMap(pieces);
  return [...pieces].sort((a, b) => {
    if (draggedGroupId != null) {
      const aDragging = a.groupId === draggedGroupId;
      const bDragging = b.groupId === draggedGroupId;
      if (aDragging !== bDragging) return aDragging ? 1 : -1;
    }
    return compareBackToFront(a, b, groupLayerMap);
  });
}

/**
 * Sort pieces in hit-test order (front -> back).
 * Matches draw order so the topmost visible piece is hit first.
 */
export function sortPiecesForHitTest(pieces: Piece[]): Piece[] {
  const groupLayerMap = buildGroupLayerMap(pieces);
  return [...pieces].sort((a, b) => compareBackToFront(b, a, groupLayerMap));
}
