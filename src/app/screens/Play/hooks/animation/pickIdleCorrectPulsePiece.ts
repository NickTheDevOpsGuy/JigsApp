import type { Piece } from "@/puzzle/core/types";
import { isPieceCorrectOnBoard } from "@/puzzle/manager/state/borderFrame";

/** Stable “anchor” piece for idle hint: top-leftmost among board pieces already snapped correctly. */
export function pickIdleCorrectPulsePieceId(pieces: Piece[]): string | null {
  const board = pieces.filter((p) => !p.inTray);
  const correct = board.filter((p) => isPieceCorrectOnBoard(p));
  if (correct.length === 0) return null;
  correct.sort((a, b) => a.row - b.row || a.col - b.col || a.id.localeCompare(b.id));
  return correct[0]!.id;
}
