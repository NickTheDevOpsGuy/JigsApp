import type { GridSize, Piece } from "@/puzzle/core/types";
import {
  CORRECT_EPSILON_PX,
  isPieceCorrect as isPieceCorrectDerived,
} from "@/puzzle/manager/state/puzzleManagerDerivedState";

export function isBorderGridCell(row: number, col: number, grid: GridSize): boolean {
  const { rows, cols } = grid;
  if (rows < 1 || cols < 1) return false;
  return row === 0 || col === 0 || row === rows - 1 || col === cols - 1;
}

function pieceTileTopLeft(p: Piece): { x: number; y: number } {
  return { x: p.x + p.pad, y: p.y + p.pad };
}

/** Same correctness rule as the puzzle engine (position + rotation). */
export function isPieceCorrectOnBoard(
  p: Piece,
  epsilonPx: number = CORRECT_EPSILON_PX,
): boolean {
  if (p.inTray) return false;
  return isPieceCorrectDerived(p, pieceTileTopLeft(p), epsilonPx);
}

/** True when every perimeter cell’s piece is on the board and snapped correctly. */
export function areAllBorderPiecesCorrect(pieces: Piece[], grid: GridSize): boolean {
  const borderPieces = pieces.filter((p) => isBorderGridCell(p.row, p.col, grid));
  if (borderPieces.length === 0) return false;
  return borderPieces.every((p) => isPieceCorrectOnBoard(p));
}
