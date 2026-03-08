import type { Piece } from "./types";
import type { EffectiveToleranceOptions } from "./puzzleManagerUtils";
import { getEffectiveTolerance } from "./puzzleManagerUtils";
import { computeBoardSnapResult, computeMergedGroupBoardSnapResult } from "./puzzleSnap";

type UpdatePieces = (
  predicate: (p: Piece) => boolean,
  updater: (p: Piece) => Partial<Piece>,
) => void;

type LockDebug = (message: string, data?: unknown) => void;

type SnapToBoardParams = {
  activeId: string;
  pieces: Piece[];
  placedCount: number;
  snapToleranceBoardPx: number;
  getToleranceOptions: () => EffectiveToleranceOptions;
  getGroupPieces: (groupId: string) => Piece[];
  setGroupToExactTargetPositions: (groupId: string) => void;
  bumpGroupZ: (groupId: string) => void;
  updatePieces: UpdatePieces;
  pieceLockingEnabled: boolean;
  overlapEpsilonPx: number;
  onWrongRotationHint?: (groupId: string, pieceIds: string[]) => void;
  onPiecePlaced?: (piece: Piece) => void;
  onPieceLocked?: (pieceIds: string[]) => void;
  lockDebug: LockDebug;
};

type SnapMergedToBoardParams = {
  groupId: string;
  pieces: Piece[];
  pieceLockingEnabled: boolean;
  overlapEpsilonPx: number;
  getGroupPieces: (groupId: string) => Piece[];
  setGroupToExactTargetPositions: (groupId: string) => void;
  bumpGroupZ: (groupId: string) => void;
  updatePieces: UpdatePieces;
  onPieceLocked?: (pieceIds: string[]) => void;
  lockDebug: LockDebug;
};

export function trySnapActiveGroupToBoardOp(params: SnapToBoardParams): boolean {
  const {
    activeId,
    pieces,
    placedCount,
    snapToleranceBoardPx,
    getToleranceOptions,
    getGroupPieces,
    setGroupToExactTargetPositions,
    bumpGroupZ,
    updatePieces,
    pieceLockingEnabled,
    overlapEpsilonPx,
    onWrongRotationHint,
    onPiecePlaced,
    onPieceLocked,
    lockDebug,
  } = params;

  const active = pieces.find((p) => p.id === activeId);
  if (!active) return false;

  const firstSnapMult = placedCount === 0 ? 1.15 : 1;
  const tolerance = getEffectiveTolerance(
    snapToleranceBoardPx,
    getToleranceOptions(),
    firstSnapMult,
  );
  const result = computeBoardSnapResult(pieces, activeId, tolerance, overlapEpsilonPx);
  lockDebug("trySnapActiveGroupToBoard:result", {
    activeId,
    tolerance,
    resultKind: result?.kind ?? "none",
    groupId: active?.groupId ?? null,
  });

  if (result?.kind === "wrongRotation") {
    onWrongRotationHint?.(result.groupId, result.pieceIds);
    return false;
  }
  if (result?.kind !== "snap") return false;

  const gid = result.groupId;
  const groupPieces = getGroupPieces(gid);

  // Set directly to exact target positions (no intermediate shift) so the lock lerp
  // animates smoothly from drag-end to final position without a visible half-step.
  setGroupToExactTargetPositions(gid);
  bumpGroupZ(gid);

  const wasLocked = new Set(groupPieces.filter((p) => p.locked).map((p) => p.id));
  updatePieces(
    (p) => p.groupId === gid,
    (p) => ({
      justSnapped: true,
      locked: pieceLockingEnabled || p.locked,
    }),
  );
  onPiecePlaced?.(active);
  if (pieceLockingEnabled) {
    const newlyLocked = groupPieces.filter((p) => !wasLocked.has(p.id)).map((p) => p.id);
    if (newlyLocked.length > 0) onPieceLocked?.(newlyLocked);
    lockDebug("trySnapActiveGroupToBoard:locked", {
      groupId: gid,
      newlyLockedCount: newlyLocked.length,
      newlyLockedIds: newlyLocked.slice(0, 12),
    });
  }
  return true;
}

export function trySnapMergedGroupToBoardOp(params: SnapMergedToBoardParams): void {
  const {
    groupId,
    pieces,
    pieceLockingEnabled,
    overlapEpsilonPx,
    getGroupPieces,
    setGroupToExactTargetPositions,
    bumpGroupZ,
    updatePieces,
    onPieceLocked,
    lockDebug,
  } = params;

  const result = computeMergedGroupBoardSnapResult(
    pieces,
    groupId,
    overlapEpsilonPx,
  );
  lockDebug("trySnapMergedGroupToBoard:result", {
    groupId,
    result: result ? { dx: result.dx, dy: result.dy } : null,
    lockingEnabled: pieceLockingEnabled,
  });
  if (!result) return;

  // Set directly to exact target so lock/place animation doesn't show a half-step.
  setGroupToExactTargetPositions(groupId);
  bumpGroupZ(groupId);
  const groupPieces = getGroupPieces(groupId);
  const wasLocked = new Set(groupPieces.filter((p) => p.locked).map((p) => p.id));
  updatePieces(
    (p) => p.groupId === groupId,
    (p) => ({
      justSnapped: true,
      locked: pieceLockingEnabled || p.locked,
    }),
  );
  if (pieceLockingEnabled) {
    const newlyLocked = groupPieces.filter((p) => !wasLocked.has(p.id)).map((p) => p.id);
    if (newlyLocked.length > 0) onPieceLocked?.(newlyLocked);
    lockDebug("trySnapMergedGroupToBoard:locked", {
      groupId,
      lockedCount: groupPieces.length,
      ids: groupPieces.map((p) => p.id).slice(0, 12),
    });
  }
}
