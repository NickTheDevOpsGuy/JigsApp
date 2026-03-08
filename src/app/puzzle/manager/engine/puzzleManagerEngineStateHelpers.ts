import type { PuzzleState } from "@/puzzle/core/types";

/**
 * Helper for clampAllBoardGroupsInsideBoardInterior. Split out to keep PuzzleManagerEngineState under 300 lines.
 */
export function clampAllBoardGroupsInsideBoardInteriorHelper(
  state: PuzzleState,
  clampGroup: (groupId: string) => void,
): void {
  const boardPieces = state.pieces.filter((p) => !p.inTray);
  const boardGroupIds = new Set(boardPieces.map((p) => p.groupId));
  for (const groupId of boardGroupIds) {
    const groupPieces = boardPieces.filter((p) => p.groupId === groupId);
    const allLocked = groupPieces.length > 0 && groupPieces.every((p) => p.locked);
    if (allLocked) continue;
    clampGroup(groupId);
  }
}
