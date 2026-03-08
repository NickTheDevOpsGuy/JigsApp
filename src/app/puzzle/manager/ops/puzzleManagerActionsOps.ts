import type { Piece } from "@/puzzle/core/types";
import type { SavedPiece } from "@/puzzle/storage/puzzleStorage";
import { findPlacementFromTray } from "@/puzzle/manager/state/puzzleManagerUtils";

type UpdatePieces = (
  predicate: (p: Piece) => boolean,
  updater: (p: Piece) => Partial<Piece>,
) => void;

type FindPiece = (id: string) => Piece | null;

export function setPieceLockingEnabledOp(params: {
  enabled: boolean;
  pieces: Piece[];
  isPieceCorrect: (p: Piece) => boolean;
  updatePieces: UpdatePieces;
  onPieceLocked?: (pieceIds: string[]) => void;
  lockDebug: (message: string, data?: unknown) => void;
}): void {
  const { enabled, pieces, isPieceCorrect, updatePieces, onPieceLocked, lockDebug } =
    params;
  lockDebug("setPieceLockingEnabled", {
    enabled,
    totalPieces: pieces.length,
    lockedBefore: pieces.filter((p) => p.locked).length,
    inTray: pieces.filter((p) => p.inTray).length,
  });
  if (enabled) {
    const newlyLockedIds = pieces
      .filter((p) => !p.inTray && !p.locked && isPieceCorrect(p))
      .map((p) => p.id);
    lockDebug("lock-on-enable candidates", {
      candidateCount: newlyLockedIds.length,
      candidateIds: newlyLockedIds.slice(0, 12),
    });
    if (newlyLockedIds.length > 0) {
      const toLock = new Set(newlyLockedIds);
      updatePieces(
        (p) => toLock.has(p.id),
        () => ({ locked: true }),
      );
      onPieceLocked?.(newlyLockedIds);
      lockDebug("lock-on-enable applied", {
        lockedCount: newlyLockedIds.length,
        ids: newlyLockedIds.slice(0, 12),
      });
    }
    return;
  }

  updatePieces(
    (p) => p.locked && !p.isPlaced,
    () => ({ locked: false }),
  );
  lockDebug("unlock-on-disable applied", {
    lockedAfter: pieces.filter((p) => p.locked).length,
  });
}

export function rotatePieceOp(params: {
  pieceId: string;
  findPiece: FindPiece;
  pieces: Piece[];
  rotationStepDeg: 90 | 180;
  pushUndoState: () => void;
  updatePieces: UpdatePieces;
  setPieces: (pieces: Piece[]) => void;
}): boolean {
  const piece = params.findPiece(params.pieceId);
  if (!piece) return false;
  if (piece.isPlaced) return false;
  if (piece.locked) return false;

  const groupPieces = params.pieces.filter((p) => p.groupId === piece.groupId);
  if (groupPieces.some((p) => p.locked)) return false;

  params.pushUndoState();

  if (piece.inTray) {
    params.updatePieces(
      (p) => p.id === params.pieceId,
      (p) => ({ rotation: (p.rotation + params.rotationStepDeg) % 360 }),
    );
    return true;
  }

  const step = params.rotationStepDeg;
  const gid = piece.groupId;
  const newPieces = params.pieces.map((p) => {
    if (p.inTray) return p;
    if (p.groupId !== gid) return p;
    const newRotation = (p.rotation + step) % 360;
    return { ...p, rotation: newRotation };
  });
  params.setPieces(newPieces);
  return true;
}

export function movePieceToTrayOp(params: {
  pieceId: string;
  findPiece: FindPiece;
  getGroupPieces: (groupId: string) => Piece[];
  pushUndoState: () => void;
  updatePieces: UpdatePieces;
}): boolean {
  const piece = params.findPiece(params.pieceId);
  if (!piece || piece.isPlaced || piece.locked) return false;
  params.pushUndoState();
  const groupPieces = params.getGroupPieces(piece.groupId);
  if (groupPieces.length > 1) return false;
  params.updatePieces(
    (p) => p.id === params.pieceId,
    () => ({ inTray: true }),
  );
  return true;
}

export function movePieceFromTrayOp(params: {
  pieceId: string;
  findPiece: FindPiece;
  pieces: Piece[];
  boardWidth: number;
  boardHeight: number;
  boardInset: number;
  rand: (min: number, max: number) => number;
  pushUndoState: () => void;
  updatePieces: UpdatePieces;
  zCounter: number;
  clampGroupInsideBoardInterior: (groupId: string) => void;
}): { moved: boolean; zCounter: number } {
  const piece = params.findPiece(params.pieceId);
  if (!piece || !piece.inTray) return { moved: false, zCounter: params.zCounter };
  params.pushUndoState();
  const boardPieces = params.pieces.filter((p) => !p.inTray);
  const { x, y } = findPlacementFromTray(
    params.boardWidth,
    params.boardHeight,
    piece,
    boardPieces,
    params.rand,
    params.boardInset,
  );
  const nextZ = params.zCounter + 1;
  params.updatePieces(
    (p) => p.id === params.pieceId,
    () => ({
      inTray: false,
      x,
      y,
      z: nextZ,
    }),
  );
  params.clampGroupInsideBoardInterior(piece.groupId);
  return { moved: true, zCounter: nextZ };
}

export function restoreFromSavedOp(params: {
  savedPieces: SavedPiece[];
  pieces: Piece[];
  pieceLockingEnabled: boolean;
  applySavedPieces: (current: Piece[], saved: SavedPiece[]) => Piece[];
  setPieces: (pieces: Piece[]) => void;
  clampAllBoardGroupsInsideBoardInterior: () => void;
  syncZCounterFromPieces: () => void;
  assertGroupConsistency: (pieces: Piece[]) => void;
  recomputeDerivedState: () => void;
  lockDebug: (message: string, data?: unknown) => void;
}): void {
  params.lockDebug("restoreFromSaved:start", {
    incomingCount: params.savedPieces.length,
    incomingLocked: params.savedPieces.filter((p) => p.locked).length,
    incomingInTray: params.savedPieces.filter((p) => p.inTray).length,
    lockingEnabled: params.pieceLockingEnabled,
  });
  const pieces = params.applySavedPieces(params.pieces, params.savedPieces);
  params.setPieces(pieces);
  params.clampAllBoardGroupsInsideBoardInterior();
  params.syncZCounterFromPieces();
  params.assertGroupConsistency(pieces);
  params.recomputeDerivedState();
  params.lockDebug("restoreFromSaved:done", {
    lockedAfter: pieces.filter((p) => p.locked).length,
    inTrayAfter: pieces.filter((p) => p.inTray).length,
  });
}
