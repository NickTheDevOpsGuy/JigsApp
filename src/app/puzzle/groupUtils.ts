/**
 * groupUtils – group bounds, row/col map, neighbor lookups for snap logic.
 */
import type { Piece } from "./types";
import { lockDebug } from "./puzzleLockDebug";
import {
  getCollisionBounds,
  shouldIgnoreNeighborJitterOverlap,
  type GroupBounds,
} from "./groupCollision";
export type { GroupBounds } from "./groupCollision";

/** Key for (row, col) lookup. Use for O(1) neighbor checks in snap logic. */
export function rowColKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Build a map from (row,col) to piece for O(1) neighbor lookups. One pass over pieces. */
export function buildRowColMap(pieces: Piece[]): Map<string, Piece> {
  const map = new Map<string, Piece>();
  for (const p of pieces) {
    map.set(rowColKey(p.row, p.col), p);
  }
  return map;
}

/** Get the 4 grid neighbors of a piece using a prebuilt map. O(1) per call. */
export function getSolvedNeighborsFromMap(
  piece: Piece,
  rowColMap: Map<string, Piece>,
): Piece[] {
  const result: Piece[] = [];
  for (const [dr, dc] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const) {
    const n = rowColMap.get(rowColKey(piece.row + dr, piece.col + dc));
    if (n) result.push(n);
  }
  return result;
}

export function getGroupBounds(pieces: Piece[], groupId: string): GroupBounds | null {
  const ps = pieces.filter((p) => !p.inTray && p.groupId === groupId);
  if (!ps.length) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of ps) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + p.w);
    maxY = Math.max(maxY, p.y + p.h);
  }
  return { minX, minY, maxX, maxY };
}

/** Check if two axis-aligned bounds intersect. */
function boundsIntersect(a: GroupBounds, b: GroupBounds): boolean {
  return !(a.maxX <= b.minX || a.minX >= b.maxX || a.maxY <= b.minY || a.minY >= b.maxY);
}

export function wouldOverlapAnyOtherGroup(
  pieces: Piece[],
  groupId: string,
  dx: number,
  dy: number,
  overlapEpsilonPx: number = 0,
  ignoreGroupIds: ReadonlySet<string> = new Set<string>(),
): boolean {
  // Sub-pixel canvas math and fractional DPR often produce ~0.1-0.9px phantom overlaps.
  // Treat tiny overlaps as non-blocking so edge-adjacent groups can still snap/lock.
  const effectiveOverlapEpsilonPx = Math.max(1, overlapEpsilonPx);
  const groupPieces = pieces.filter((p) => !p.inTray && p.groupId === groupId);
  if (groupPieces.length === 0) return false;

  const movedTileBounds = groupPieces.map((p) => getCollisionBounds(p, dx, dy));
  const movedBounds: GroupBounds | null = movedTileBounds.length
    ? {
        minX: Math.min(...movedTileBounds.map((b) => b.minX)),
        minY: Math.min(...movedTileBounds.map((b) => b.minY)),
        maxX: Math.max(...movedTileBounds.map((b) => b.maxX)),
        maxY: Math.max(...movedTileBounds.map((b) => b.maxY)),
      }
    : null;
  if (!movedBounds) return false;

  const otherGroupIds = new Set<string>();
  for (const p of pieces) {
    if (p.groupId !== groupId && !p.inTray) otherGroupIds.add(p.groupId);
  }

  for (const otherGid of otherGroupIds) {
    if (ignoreGroupIds.has(otherGid)) continue;
    const otherPieces = pieces.filter((p) => p.groupId === otherGid && !p.inTray);
    const otherTileBounds = otherPieces.map((p) => getCollisionBounds(p));
    const otherBounds: GroupBounds | null = otherTileBounds.length
      ? {
          minX: Math.min(...otherTileBounds.map((b) => b.minX)),
          minY: Math.min(...otherTileBounds.map((b) => b.minY)),
          maxX: Math.max(...otherTileBounds.map((b) => b.maxX)),
          maxY: Math.max(...otherTileBounds.map((b) => b.maxY)),
        }
      : null;
    if (!otherBounds || !boundsIntersect(movedBounds, otherBounds)) continue;
    for (const gp of groupPieces) {
      const gpBounds = getCollisionBounds(gp, dx, dy);
      for (const op of otherPieces) {
        const opBounds = getCollisionBounds(op);
        if (
          !(
            gpBounds.maxX <= opBounds.minX + effectiveOverlapEpsilonPx ||
            gpBounds.minX >= opBounds.maxX - effectiveOverlapEpsilonPx ||
            gpBounds.maxY <= opBounds.minY + effectiveOverlapEpsilonPx ||
            gpBounds.minY >= opBounds.maxY - effectiveOverlapEpsilonPx
          )
        ) {
          if (shouldIgnoreNeighborJitterOverlap(gp, op, dx, dy)) {
            continue;
          }
          lockDebug("overlap-block", {
            movingGroupId: groupId,
            blockingGroupId: otherGid,
            movingPieceId: gp.id,
            blockingPieceId: op.id,
            dx,
            dy,
            movingBounds: gpBounds,
            blockingBounds: opBounds,
          });
          return true;
        }
      }
    }
  }
  return false;
}

export function getSolvedNeighbors(pieces: Piece[], piece: Piece): Piece[] {
  const byRC = (r: number, c: number) =>
    pieces.find((p) => p.row === r && p.col === c) ?? null;

  return [
    byRC(piece.row - 1, piece.col),
    byRC(piece.row + 1, piece.col),
    byRC(piece.row, piece.col - 1),
    byRC(piece.row, piece.col + 1),
  ].filter(Boolean) as Piece[];
}
