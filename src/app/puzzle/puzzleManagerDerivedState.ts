import type { Piece, PuzzleState } from "./types";

export const CORRECT_EPSILON_PX = 3;

export function isPieceCorrect(
  p: Piece,
  tilePos: { x: number; y: number },
  epsilonPx: number = CORRECT_EPSILON_PX,
): boolean {
  if (p.rotation !== p.targetRotation) return false;
  const dx = Math.abs(tilePos.x - p.targetX);
  const dy = Math.abs(tilePos.y - p.targetY);
  return dx <= epsilonPx && dy <= epsilonPx;
}

export function derivePlacedAndComplete(
  state: PuzzleState,
  pieceLockingEnabled: boolean,
  isPieceCorrectFn: (piece: Piece) => boolean,
): { placedCount: number; isComplete: boolean; boardPieces: Piece[] } {
  const allPieces = state.pieces;
  const boardPieces = allPieces.filter((p) => !p.inTray);
  const placedCount = pieceLockingEnabled
    ? boardPieces.filter((p) => p.locked || p.isPlaced).length
    : boardPieces.filter((p) => isPieceCorrectFn(p)).length;

  const noTrayPieces = boardPieces.length === allPieces.length;
  const allCorrectRotation = boardPieces.every((p) => p.rotation === p.targetRotation);
  const isComplete =
    boardPieces.length > 0 &&
    noTrayPieces &&
    allCorrectRotation &&
    boardPieces.every((p) => isPieceCorrectFn(p));

  return { placedCount, isComplete, boardPieces };
}
