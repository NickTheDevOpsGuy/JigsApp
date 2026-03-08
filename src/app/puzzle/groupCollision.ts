import type { Piece } from "./types";

export type GroupBounds = { minX: number; minY: number; maxX: number; maxY: number };

export function getCollisionBounds(
  piece: Piece,
  dx: number = 0,
  dy: number = 0,
): GroupBounds {
  // Use tile footprint (without sprite padding) for overlap checks.
  // Piece art includes `pad` halo, which should not block valid snaps/merges.
  const minX = piece.x + piece.pad + dx;
  const minY = piece.y + piece.pad + dy;
  return {
    minX,
    minY,
    maxX: minX + piece.tileW,
    maxY: minY + piece.tileH,
  };
}

export function shouldIgnoreNeighborJitterOverlap(
  moving: Piece,
  blocking: Piece,
  dx: number,
  dy: number,
): boolean {
  if (moving.inTray || blocking.inTray) return false;
  if (moving.rotation !== 0 || blocking.rotation !== 0) return false;

  const rowDelta = Math.abs(moving.row - blocking.row);
  const colDelta = Math.abs(moving.col - blocking.col);
  if (rowDelta + colDelta !== 1) return false;

  const movingBounds = getCollisionBounds(moving, dx, dy);
  const blockingBounds = getCollisionBounds(blocking);
  const overlapX =
    Math.min(movingBounds.maxX, blockingBounds.maxX) -
    Math.max(movingBounds.minX, blockingBounds.minX);
  const overlapY =
    Math.min(movingBounds.maxY, blockingBounds.maxY) -
    Math.max(movingBounds.minY, blockingBounds.minY);

  const movingTileX = movingBounds.minX;
  const movingTileY = movingBounds.minY;
  const blockingTileX = blockingBounds.minX;
  const blockingTileY = blockingBounds.minY;

  const expectedDx = (blocking.col - moving.col) * moving.tileW;
  const expectedDy = (blocking.row - moving.row) * moving.tileH;
  const relX = blockingTileX - movingTileX;
  const relY = blockingTileY - movingTileY;

  // Allow tiny float/rounding drift so valid edge neighbors don't get collision-blocked.
  const jitterPx = 4;
  const shallowEdgeOverlap =
    (overlapX > 0 && overlapX <= jitterPx) || (overlapY > 0 && overlapY <= jitterPx);
  if (shallowEdgeOverlap) return true;

  return (
    Math.abs(relX - expectedDx) <= jitterPx && Math.abs(relY - expectedDy) <= jitterPx
  );
}

