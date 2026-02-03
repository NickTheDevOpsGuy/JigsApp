import type { Piece } from "./types";

export type GroupBounds = { minX: number; minY: number; maxX: number; maxY: number };

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

export function wouldOverlapAnyOtherGroup(
  pieces: Piece[],
  groupId: string,
  dx: number,
  dy: number,
): boolean {
  const groupPieces = pieces.filter((p) => p.groupId === groupId);
  const otherPieces = pieces.filter((p) => p.groupId !== groupId && !p.inTray);

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
