import {
  computeNearSnapNudge,
  computeNeighborSnapResult,
  rotateGroupToZeroPieces,
} from "./puzzleSnap";
import {
  getEffectiveTolerance,
  type EffectiveToleranceOptions,
} from "./puzzleManagerUtils";
import type { Piece, PuzzleState } from "./types";

type TrySnapActiveGroupToNeighborOpArgs = {
  activeId: string;
  state: PuzzleState;
  snapToleranceNeighborPx: number;
  getToleranceOptions: () => EffectiveToleranceOptions;
  autoRotateOnSnap: boolean;
  tileW: number;
  tileH: number;
  overlapEpsilonPx: number;
  findPiece: (id: string) => Piece | null;
  getGroupPieces: (groupId: string) => Piece[];
  replacePieces: (pieces: Piece[]) => void;
  shiftGroupUnclamped: (groupId: string, dx: number, dy: number) => void;
  mergeGroups: (from: string, into: string) => void;
  bumpGroupZ: (groupId: string) => void;
  trySnapMergedGroupToBoard: (groupId: string) => void;
  onPieceSnapped?: (pieceIds: string[], center?: { x: number; y: number }) => void;
};

export function trySnapActiveGroupToNeighborOp({
  activeId,
  state,
  snapToleranceNeighborPx,
  getToleranceOptions,
  autoRotateOnSnap,
  tileW,
  tileH,
  overlapEpsilonPx,
  findPiece,
  getGroupPieces,
  replacePieces,
  shiftGroupUnclamped,
  mergeGroups,
  bumpGroupZ,
  trySnapMergedGroupToBoard,
  onPieceSnapped,
}: TrySnapActiveGroupToNeighborOpArgs): boolean {
  const active = findPiece(activeId);
  if (!active || active.isPlaced) return false;

  const groupId = active.groupId;
  const groupPieces = getGroupPieces(groupId);
  const allAtZero = groupPieces.every((piece) => piece.rotation === 0);
  if (!allAtZero) {
    if (!autoRotateOnSnap) return false;
    replacePieces(rotateGroupToZeroPieces(state.pieces, groupId));
    if (!findPiece(activeId)) return false;
  }

  const firstSnapMult = (state.placedCount ?? 0) === 0 ? 1.15 : 1;
  const tolerance = getEffectiveTolerance(
    snapToleranceNeighborPx,
    getToleranceOptions(),
    firstSnapMult,
  );
  const result = computeNeighborSnapResult(
    state.pieces,
    activeId,
    tolerance,
    tileW,
    tileH,
    overlapEpsilonPx,
  );
  if (!result) return false;

  shiftGroupUnclamped(groupId, result.dx, result.dy);
  mergeGroups(groupId, result.intoGroupId);
  bumpGroupZ(result.intoGroupId);

  trySnapMergedGroupToBoard(result.intoGroupId);
  const mergedPieces = getGroupPieces(result.intoGroupId);
  const mergedIds = mergedPieces.map((piece) => piece.id);
  const center =
    mergedPieces.length > 0
      ? {
          x:
            mergedPieces.reduce((sum, piece) => sum + piece.x + piece.w / 2, 0) /
            mergedPieces.length,
          y:
            mergedPieces.reduce((sum, piece) => sum + piece.y + piece.h / 2, 0) /
            mergedPieces.length,
        }
      : undefined;
  onPieceSnapped?.(mergedIds, center);
  return true;
}

type TryNearSnapNudgeOpArgs = {
  activeId: string;
  state: PuzzleState;
  snapToleranceBoardPx: number;
  getToleranceOptions: () => EffectiveToleranceOptions;
  overlapEpsilonPx: number;
  findPiece: (id: string) => Piece | null;
  shiftGroup: (groupId: string, dx: number, dy: number) => void;
};

export function tryNearSnapNudgeOp({
  activeId,
  state,
  snapToleranceBoardPx,
  getToleranceOptions,
  overlapEpsilonPx,
  findPiece,
  shiftGroup,
}: TryNearSnapNudgeOpArgs): void {
  const firstSnapMult = (state.placedCount ?? 0) === 0 ? 1.15 : 1;
  const tolerance = getEffectiveTolerance(
    snapToleranceBoardPx,
    getToleranceOptions(),
    firstSnapMult,
  );
  const result = computeNearSnapNudge(state.pieces, activeId, tolerance, 0.35, overlapEpsilonPx);
  if (!result) return;

  const active = findPiece(activeId);
  if (!active) return;
  shiftGroup(active.groupId, result.nudgeDx, result.nudgeDy);
}
