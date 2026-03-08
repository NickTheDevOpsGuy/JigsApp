import { clamp } from "./puzzleManagerUtils";
import type { Piece } from "./types";

type SetBoardSizeOpArgs = {
  pieces: Piece[];
  boardWidth: number;
  boardHeight: number;
  pad: number;
  getGroupBounds: (groupId: string) => {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null;
  shiftGroup: (groupId: string, dx: number, dy: number) => void;
  clampAllBoardGroupsInsideBoardInterior: () => void;
};

export function setBoardSizeOp({
  pieces,
  boardWidth,
  boardHeight,
  pad,
  getGroupBounds,
  shiftGroup,
  clampAllBoardGroupsInsideBoardInterior,
}: SetBoardSizeOpArgs): void {
  const seen = new Set<string>();
  for (const piece of pieces) {
    if (seen.has(piece.groupId)) continue;
    seen.add(piece.groupId);

    const bounds = getGroupBounds(piece.groupId);
    if (!bounds) continue;

    const dxMin = -pad - bounds.minX;
    const dxMax = boardWidth + pad - bounds.maxX;
    const dyMin = -pad - bounds.minY;
    const dyMax = boardHeight + pad - bounds.maxY;

    const dx = clamp(0, dxMin, dxMax);
    const dy = clamp(0, dyMin, dyMax);
    if (dx !== 0 || dy !== 0) shiftGroup(piece.groupId, dx, dy);
  }

  clampAllBoardGroupsInsideBoardInterior();
}
