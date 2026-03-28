import type { Piece } from "@/puzzle/core/types";
import { getQuadrant } from "@/screens/Play/core/time/timeMode";
import { isPieceCorrectOnBoard } from "@/puzzle/manager/state/borderFrame";

/** Quadrants whose pieces are all on the board and snapped correctly. */
export function getFullyCompletedQuadrants(
  pieces: Piece[],
  grid: { rows: number; cols: number },
): Set<0 | 1 | 2 | 3> {
  const done = new Set<0 | 1 | 2 | 3>();
  for (const q of [0, 1, 2, 3] as const) {
    const inQ = pieces.filter(
      (p) => getQuadrant(p.row, p.col, grid.rows, grid.cols) === q,
    );
    if (inQ.length === 0) continue;
    if (inQ.every((p) => isPieceCorrectOnBoard(p))) {
      done.add(q);
    }
  }
  return done;
}
