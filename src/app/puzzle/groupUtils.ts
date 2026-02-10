import type { Piece } from "./types";

export type GroupBounds = { minX: number; minY: number; maxX: number; maxY: number };

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
  const ps = pieces.filter((p) => p.groupId === groupId);
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
): boolean {
  const groupPieces = pieces.filter((p) => p.groupId === groupId);
  if (groupPieces.length === 0) return false;

  const movedBounds = getGroupBounds(
    groupPieces.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
    groupId,
  );
  if (!movedBounds) return false;

  const otherGroupIds = new Set<string>();
  for (const p of pieces) {
    if (p.groupId !== groupId && !p.inTray) otherGroupIds.add(p.groupId);
  }

  for (const otherGid of otherGroupIds) {
    const otherBounds = getGroupBounds(pieces, otherGid);
    if (!otherBounds || !boundsIntersect(movedBounds, otherBounds)) continue;

    const otherPieces = pieces.filter((p) => p.groupId === otherGid);
    for (const gp of groupPieces) {
      const gpX = gp.x + dx;
      const gpY = gp.y + dy;
      const gpRight = gpX + gp.w;
      const gpBottom = gpY + gp.h;
      for (const op of otherPieces) {
        const opRight = op.x + op.w;
        const opBottom = op.y + op.h;
        if (!(gpRight <= op.x || gpX >= opRight || gpBottom <= op.y || gpY >= opBottom)) {
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
