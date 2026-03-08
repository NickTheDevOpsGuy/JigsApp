import type { Piece } from "@/puzzle/core/types";
import {
  clampGroupDeltaToBoardExtents,
  clampInsideBoardInterior,
  clampInsideDragBounds,
} from "@/puzzle/manager/ops/puzzleManagerClamp";
import type { GroupBounds } from "@/puzzle/groups/groupUtils";

export function shiftGroupUnclamped(
  updatePieces: (
    predicate: (p: Piece) => boolean,
    updater: (p: Piece) => Partial<Piece>,
  ) => void,
  groupId: string,
  dx: number,
  dy: number,
) {
  if (dx === 0 && dy === 0) return;
  updatePieces(
    (p) => p.groupId === groupId,
    (p) => ({ x: p.x + dx, y: p.y + dy }),
  );
}

export function setGroupToExactTargetPositions(
  updatePieces: (
    predicate: (p: Piece) => boolean,
    updater: (p: Piece) => Partial<Piece>,
  ) => void,
  groupId: string,
) {
  updatePieces(
    (p) => p.groupId === groupId,
    (p) => ({
      x: Math.round(p.targetX - p.pad),
      y: Math.round(p.targetY - p.pad),
    }),
  );
}

export function bumpGroupZ(
  pieces: Piece[],
  zCounter: number,
  updatePieces: (
    predicate: (p: Piece) => boolean,
    updater: (p: Piece) => Partial<Piece>,
  ) => void,
  groupId: string,
): number {
  const maxZ = pieces.reduce((max, p) => Math.max(max, p.z), 0);
  const nextZ = Math.max(zCounter, maxZ) + 1;
  updatePieces(
    (p) => p.groupId === groupId,
    () => ({ z: nextZ }),
  );
  return nextZ;
}

export function clampGroupDelta(
  bounds: GroupBounds | null,
  dx: number,
  dy: number,
  boardWidth: number,
  boardHeight: number,
  pad: number,
  softClampOverflow: number,
) {
  if (!bounds) return { dx: 0, dy: 0 };
  return clampGroupDeltaToBoardExtents(
    bounds,
    dx,
    dy,
    boardWidth,
    boardHeight,
    pad,
    softClampOverflow,
  );
}

export function clampGroupInsideBoardInterior(
  bounds: GroupBounds | null,
  boardWidth: number,
  boardHeight: number,
  boardInset: number,
) {
  if (!bounds) return { dx: 0, dy: 0 };
  return clampInsideBoardInterior(bounds, boardWidth, boardHeight, boardInset);
}

export function clampGroupInsideDragBounds(
  bounds: GroupBounds | null,
  boardWidth: number,
  boardHeight: number,
  pad: number,
  softClampOverflow: number,
) {
  if (!bounds) return { dx: 0, dy: 0 };
  return clampInsideDragBounds(bounds, boardWidth, boardHeight, pad, softClampOverflow);
}
