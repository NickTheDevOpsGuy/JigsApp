import type { SavedPiece } from "@/puzzle/storage/puzzleStorage";
import {
  pointerDownBoardSpaceOp,
  pointerDownOp,
  pointerMoveBoardSpaceOp,
  pointerMoveOp,
  pointerUpOp,
} from "@/puzzle/manager/ops/puzzleManagerPointerOps";
import {
  tryNearSnapNudgeOp,
  trySnapActiveGroupToNeighborOp,
} from "@/puzzle/manager/ops/puzzleManagerNeighborSnapOps";
import {
  trySnapActiveGroupToBoardOp,
  trySnapMergedGroupToBoardOp,
} from "@/puzzle/manager/ops/puzzleManagerSnapOps";
import { lockDebug } from "@/puzzle/debug/puzzleLockDebug";
import { PuzzleManagerActions } from "@/puzzle/manager/engine/PuzzleManagerEngineActions";

export class PuzzleManagerInteractions extends PuzzleManagerActions {
  private getSnapOverlapEpsilonPx(): number {
    return this.isMobile ? 5 : 2;
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

  /** Min position delta (px) before recomputing snap preview; reduces collision checks on large puzzles. */
  private static readonly SNAP_PREVIEW_THROTTLE_PX = 2.5;

  pointerMove(clientX: number, clientY: number, boardRect: DOMRect) {
    const prevPreview = this.drag.preview;
    const newDrag = pointerMoveOp({
      clientX,
      clientY,
      boardRect,
      drag: this.drag,
      findPiece: this.findPiece.bind(this),
      shiftGroup: this.shiftGroup.bind(this),
      computeSnapPreview: this.computeSnapPreview.bind(this),
    });
    const active = this.findPiece(newDrag.activeId ?? "");
    if (
      active &&
      this.lastSnapPreviewPiecePosition &&
      Math.hypot(
        active.x - this.lastSnapPreviewPiecePosition.x,
        active.y - this.lastSnapPreviewPiecePosition.y,
      ) < PuzzleManagerInteractions.SNAP_PREVIEW_THROTTLE_PX
    ) {
      this.drag = { ...newDrag, preview: prevPreview ?? newDrag.preview };
    } else {
      if (active) this.lastSnapPreviewPiecePosition = { x: active.x, y: active.y };
      this.drag = newDrag;
    }
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
    const prevPreview = this.drag.preview;
    const newDrag = pointerMoveBoardSpaceOp({
      boardX,
      boardY,
      drag: this.drag,
      findPiece: this.findPiece.bind(this),
      shiftGroup: this.shiftGroup.bind(this),
      computeSnapPreview: this.computeSnapPreview.bind(this),
    });
    const active = this.findPiece(newDrag.activeId ?? "");
    if (
      active &&
      this.lastSnapPreviewPiecePosition &&
      Math.hypot(
        active.x - this.lastSnapPreviewPiecePosition.x,
        active.y - this.lastSnapPreviewPiecePosition.y,
      ) < PuzzleManagerInteractions.SNAP_PREVIEW_THROTTLE_PX
    ) {
      this.drag = { ...newDrag, preview: prevPreview ?? newDrag.preview };
    } else {
      if (active) this.lastSnapPreviewPiecePosition = { x: active.x, y: active.y };
      this.drag = newDrag;
    }
  }

  pointerUp() {
    this.drag = pointerUpOp({
      drag: this.drag,
      trySnapActiveGroupToNeighbor: this.trySnapActiveGroupToNeighbor.bind(this),
      trySnapActiveGroupToBoard: this.trySnapActiveGroupToBoard.bind(this),
      tryNearSnapNudge: this.tryNearSnapNudge.bind(this),
      clampAllBoardGroupsInsideBoardInterior:
        this.clampAllBoardGroupsInsideBoardInterior.bind(this),
      recomputeDerivedState: this.recomputeDerivedState.bind(this),
    });
    this.lastSnapPreviewPiecePosition = null;
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
