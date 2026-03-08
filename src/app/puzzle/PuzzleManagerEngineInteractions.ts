import type { SavedPiece } from "./puzzleStorage";
import {
  pointerDownBoardSpaceOp,
  pointerDownOp,
  pointerMoveBoardSpaceOp,
  pointerMoveOp,
  pointerUpOp,
} from "./puzzleManagerPointerOps";
import {
  tryNearSnapNudgeOp,
  trySnapActiveGroupToNeighborOp,
} from "./puzzleManagerNeighborSnapOps";
import {
  trySnapActiveGroupToBoardOp,
  trySnapMergedGroupToBoardOp,
} from "./puzzleManagerSnapOps";
import { lockDebug } from "./puzzleLockDebug";
import { PuzzleManagerActions } from "./PuzzleManagerEngineActions";

export class PuzzleManagerInteractions extends PuzzleManagerActions {
  private getSnapOverlapEpsilonPx(): number {
    return this.isMobile ? 3 : 0;
  }

  pointerDown(pieceId: string, clientX: number, clientY: number, pieceRect: DOMRect) {
    const result = pointerDownOp({
      pieceId,
      clientX,
      clientY,
      pieceRect,
      findPiece: this.findPiece.bind(this),
      isGroupLocked: this.isGroupLocked.bind(this),
      pushUndoState: this.pushUndoState.bind(this),
      updatePieces: this.updatePieces.bind(this),
      zCounter: this.zCounter,
    });
    if (result.drag) this.drag = result.drag;
    this.zCounter = result.zCounter;
  }

  pointerMove(clientX: number, clientY: number, boardRect: DOMRect) {
    this.drag = pointerMoveOp({
      clientX,
      clientY,
      boardRect,
      drag: this.drag,
      findPiece: this.findPiece.bind(this),
      shiftGroup: this.shiftGroup.bind(this),
      computeSnapPreview: this.computeSnapPreview.bind(this),
    });
  }

  pointerDownBoardSpace(pieceId: string, boardX: number, boardY: number) {
    const result = pointerDownBoardSpaceOp({
      pieceId,
      boardX,
      boardY,
      findPiece: this.findPiece.bind(this),
      isGroupLocked: this.isGroupLocked.bind(this),
      pushUndoState: this.pushUndoState.bind(this),
      updatePieces: this.updatePieces.bind(this),
      zCounter: this.zCounter,
    });
    if (result.drag) this.drag = result.drag;
    this.zCounter = result.zCounter;
  }

  pointerMoveBoardSpace(boardX: number, boardY: number) {
    this.drag = pointerMoveBoardSpaceOp({
      boardX,
      boardY,
      drag: this.drag,
      findPiece: this.findPiece.bind(this),
      shiftGroup: this.shiftGroup.bind(this),
      computeSnapPreview: this.computeSnapPreview.bind(this),
    });
  }

  pointerUp() {
    this.drag = pointerUpOp({
      drag: this.drag,
      trySnapActiveGroupToNeighbor: this.trySnapActiveGroupToNeighbor.bind(this),
      trySnapActiveGroupToBoard: this.trySnapActiveGroupToBoard.bind(this),
      tryNearSnapNudge: this.tryNearSnapNudge.bind(this),
      clampAllBoardGroupsInsideBoardInterior: this.clampAllBoardGroupsInsideBoardInterior.bind(this),
      recomputeDerivedState: this.recomputeDerivedState.bind(this),
    });
  }

  protected override trySnapActiveGroupToBoard(): boolean {
    this.events.onSnapCheck?.();
    const activeId = this.drag.activeId;
    if (!activeId) return false;
    return trySnapActiveGroupToBoardOp({
      activeId,
      pieces: this.state.pieces,
      placedCount: this.state.placedCount ?? 0,
      snapToleranceBoardPx: this.snapToleranceBoardPx,
      getToleranceOptions: this.getToleranceOptions.bind(this),
      getGroupPieces: this.getGroupPieces.bind(this),
      setGroupToExactTargetPositions: this.setGroupToExactTargetPositions.bind(this),
      bumpGroupZ: this.bumpGroupZ.bind(this),
      updatePieces: this.updatePieces.bind(this),
      pieceLockingEnabled: this.pieceLockingEnabled,
      overlapEpsilonPx: this.getSnapOverlapEpsilonPx(),
      onWrongRotationHint: this.events.onWrongRotationHint,
      onPiecePlaced: this.events.onPiecePlaced,
      onPieceLocked: this.events.onPieceLocked,
      lockDebug,
    });
  }

  protected override trySnapActiveGroupToNeighbor(): boolean {
    this.events.onSnapCheck?.();
    const activeId = this.drag.activeId;
    if (!activeId) return false;
    return trySnapActiveGroupToNeighborOp({
      activeId,
      state: this.state,
      snapToleranceNeighborPx: this.snapToleranceNeighborPx,
      getToleranceOptions: this.getToleranceOptions.bind(this),
      autoRotateOnSnap: this.autoRotateOnSnap,
      tileW: this.tileW,
      tileH: this.tileH,
      overlapEpsilonPx: this.getSnapOverlapEpsilonPx(),
      findPiece: this.findPiece.bind(this),
      getGroupPieces: this.getGroupPieces.bind(this),
      replacePieces: this.replacePieces.bind(this),
      shiftGroupUnclamped: this.shiftGroupUnclamped.bind(this),
      mergeGroups: this.mergeGroups.bind(this),
      bumpGroupZ: this.bumpGroupZ.bind(this),
      trySnapMergedGroupToBoard: this.trySnapMergedGroupToBoard.bind(this),
      onPieceSnapped: this.events.onPieceSnapped,
    });
  }

  private tryNearSnapNudge(): void {
    const activeId = this.drag.activeId;
    if (!activeId) return;
    tryNearSnapNudgeOp({
      activeId,
      state: this.state,
      snapToleranceBoardPx: this.snapToleranceBoardPx,
      getToleranceOptions: this.getToleranceOptions.bind(this),
      overlapEpsilonPx: this.getSnapOverlapEpsilonPx(),
      findPiece: this.findPiece.bind(this),
      shiftGroup: this.shiftGroup.bind(this),
    });
  }

  private trySnapMergedGroupToBoard(groupId: string): void {
    this.events.onSnapCheck?.();
    trySnapMergedGroupToBoardOp({
      groupId,
      pieces: this.state.pieces,
      pieceLockingEnabled: this.pieceLockingEnabled,
      overlapEpsilonPx: this.getSnapOverlapEpsilonPx(),
      getGroupPieces: this.getGroupPieces.bind(this),
      setGroupToExactTargetPositions: this.setGroupToExactTargetPositions.bind(this),
      bumpGroupZ: this.bumpGroupZ.bind(this),
      updatePieces: this.updatePieces.bind(this),
      onPieceLocked: this.events.onPieceLocked,
      lockDebug,
    });
  }

  driftUnplacedPieces(): void {
    if (this.state.isComplete) return;
    const seen = new Set<string>();
    for (const p of this.state.pieces) {
      if (p.isPlaced || p.locked || seen.has(p.groupId)) continue;
      seen.add(p.groupId);
      const dx = this.rand(-8, 8);
      const dy = this.rand(-8, 8);
      if (dx !== 0 || dy !== 0) this.shiftGroup(p.groupId, dx, dy);
    }
  }

  // keep public signature compatibility
  override restoreFromSaved(savedPieces: SavedPiece[]) {
    super.restoreFromSaved(savedPieces);
  }
}
