// Snap logic utilities for PuzzleManager
import type { Piece } from "./types";

export type SnapContext = {
  snapTolerancePx: number;
  tileW: number;
  tileH: number;
};

export type TilePos = { x: number; y: number };

export function getTilePos(piece: Piece, pad: number): TilePos {
  return {
    x: piece.x + pad,
    y: piece.y + pad,
  };
}

export function computeSnapDelta(piece: Piece, pad: number): { dx: number; dy: number } {
  const tile = getTilePos(piece, pad);
  return {
    dx: piece.targetX - tile.x,
    dy: piece.targetY - tile.y,
  };
}

export function isWithinSnapTolerance(
  dx: number,
  dy: number,
  tolerance: number,
): boolean {
  return Math.hypot(dx, dy) <= tolerance;
}

export function computeNeighborSnapDelta(
  groupPiece: Piece,
  neighbor: Piece,
  tileW: number,
  tileH: number,
  pad: number,
): { dx: number; dy: number; dist: number } {
  const gpTile = getTilePos(groupPiece, pad);
  const nTile = getTilePos(neighbor, pad);

  const expectedDx = (neighbor.col - groupPiece.col) * tileW;
  const expectedDy = (neighbor.row - groupPiece.row) * tileH;

  const dx = nTile.x - expectedDx - gpTile.x;
  const dy = nTile.y - expectedDy - gpTile.y;
  const dist = Math.hypot(dx, dy);

  return { dx, dy, dist };
}

export function allPiecesRotationZero(pieces: Piece[]): boolean {
  return pieces.every((p) => p.rotation === 0);
}
