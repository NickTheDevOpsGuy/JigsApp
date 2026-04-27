import type { DragState, Piece } from "@/puzzle/core/types";
import type { SavedPiece } from "@/puzzle/storage/puzzleStorage";
import { getEffectiveTolerance } from "@/puzzle/manager/state/puzzleManagerUtils";
import { setBoardSizeOp } from "@/puzzle/manager/ops/puzzleManagerBoardOps";
import {
  movePieceFromTrayOp,
  movePieceToTrayOp,
  restoreFromSavedOp,
  rotatePieceOp,
  setPieceLockingEnabledOp,
} from "@/puzzle/manager/ops/puzzleManagerActionsOps";
import {
  applySavedPieces,
  assertGroupConsistency,
} from "@/puzzle/manager/ops/puzzleManagerRestore";
import { lockDebug } from "@/puzzle/debug/puzzleLockDebug";
import { PuzzleManagerState } from "@/puzzle/manager/engine/PuzzleManagerEngineState";
import { computeBoardWrongRotationProximity } from "@/puzzle/snap/puzzleSnap";

export class PuzzleManagerActions extends PuzzleManagerState {
  protected shiftGroup(groupId: string, dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    this.shiftGroupUnclamped(groupId, dx, dy);
    this.clampGroupInsideBoardInterior(groupId);
  }

  raiseGroupToFront(pieceId: string): void {
    const p = this.findPiece(pieceId);
    if (!p || p.isPlaced) return;
    this.bumpGroupZ(p.groupId);
  }

  getSnapPreviewState(): {
    kind?: "board" | "neighbor";
    nearSnap: boolean;
    inSnapRange: boolean;
    proximity: number;
  } | null {
    const preview = this.drag.preview ?? this.computeSnapPreview();
    if (!preview) return null;
    return {
      kind: preview.kind,
      nearSnap: preview.nearSnap,
      inSnapRange: preview.inSnapRange,
      proximity: preview.proximity,
    };
  }

  /** Near home translation but not snap-valid (e.g. wrong rotation); soft rejection halo. */
  getSnapRejectPreviewState(): { proximity: number } | null {
    const activeId = this.drag.activeId;
    if (!activeId) return null;
    const preview = this.drag.preview ?? this.computeSnapPreview();
    if (preview?.inSnapRange) return null;
    /* Neighbor magnet uses snap preview only — avoid stacking two reject cues. */
    if (preview?.kind === "neighbor") return null;

    const overlapEpsilonPx = this.isMobile ? 5 : 2;
    return computeBoardWrongRotationProximity(
      this.state.pieces,
      activeId,
      overlapEpsilonPx,
    );
  }

  protected getEffectiveBoardSnapTolerance(multiplier = 1): number {
    return getEffectiveTolerance(
      this.snapToleranceBoardPx,
      this.getToleranceOptions(),
      multiplier,
    );
  }

  pushUndoState(): void {
    if (this.state.isComplete) return;
    this.undoManager.push(this.state.pieces);
  }

  undo(): boolean {
    if (!this.undoManager.canUndo() || this.state.isComplete) return false;
    const snapshot = this.undoManager.pop();
    if (!snapshot) return false;
    this.undoManager.pushRedo(this.state.pieces);
    this.restoreFromSaved(snapshot);
    return true;
  }

  canUndo(): boolean {
    return this.undoManager.canUndo() && !this.state.isComplete;
  }

  redo(): boolean {
    if (!this.undoManager.canRedo() || this.state.isComplete) return false;
    const snapshot = this.undoManager.popRedo();
    if (!snapshot) return false;
    this.undoManager.push(this.state.pieces);
    this.restoreFromSaved(snapshot);
    return true;
  }

  canRedo(): boolean {
    return this.undoManager.canRedo() && !this.state.isComplete;
  }

  setPieceLockingEnabled(enabled: boolean): void {
    this.pieceLockingEnabled = enabled;
    setPieceLockingEnabledOp({
      enabled,
      pieces: this.state.pieces,
      isPieceCorrect: this.isPieceCorrect.bind(this),
      updatePieces: this.updatePieces.bind(this),
      onPieceLocked: this.events.onPieceLocked,
      lockDebug,
    });
    this.recomputeDerivedState();
  }

  getPieceLockingEnabled(): boolean {
    return this.pieceLockingEnabled;
  }

  setAutoRotateOnSnap(enabled: boolean): void {
    this.autoRotateOnSnap = enabled;
  }

  getAutoRotateOnSnap(): boolean {
    return this.autoRotateOnSnap;
  }

  setMagneticSnapEnabled(enabled: boolean): void {
    this.magneticSnapEnabled = enabled;
    if (!enabled) this.drag = { ...this.drag, preview: null };
  }

  getMagneticSnapEnabled(): boolean {
    return this.magneticSnapEnabled;
  }

  getDragState(): DragState {
    return this.drag;
  }

  getPiece(id: string) {
    return this.findPiece(id);
  }

  nudgeGroup(pieceId: string, dx: number, dy: number) {
    const p = this.findPiece(pieceId);
    if (!p || p.isPlaced || p.locked) return;
    this.pushUndoState();
    this.shiftGroup(p.groupId, dx, dy);
    this.recomputeDerivedState();
  }

  rotateGroup(pieceId: string) {
    const p = this.findPiece(pieceId);
    if (!p || p.isPlaced || p.locked) return;
    this.rotatePiece(pieceId);
  }

  rotatePiece(pieceId: string) {
    rotatePieceOp({
      pieceId,
      findPiece: this.findPiece.bind(this),
      pieces: this.state.pieces,
      rotationStepDeg: this.rotationStepDeg,
      pushUndoState: this.pushUndoState.bind(this),
      updatePieces: this.updatePieces.bind(this),
      setPieces: (pieces) => {
        this.state = { ...this.state, pieces };
      },
    });
  }

  snapGroupNow(pieceId: string, skipPush = false) {
    const p = this.findPiece(pieceId);
    if (!p || p.isPlaced || p.locked) return;

    if (!skipPush) this.pushUndoState();
    this.drag = { ...this.drag, activeId: p.id };
    this.trySnapActiveGroupToNeighbor();
    this.trySnapActiveGroupToBoard();
    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.recomputeDerivedState();
  }

  sendToTray(pieceId: string) {
    this.movePieceToTray(pieceId);
    this.recomputeDerivedState();
  }

  movePieceToTray(pieceId: string) {
    movePieceToTrayOp({
      pieceId,
      findPiece: this.findPiece.bind(this),
      getGroupPieces: this.getGroupPieces.bind(this),
      pushUndoState: this.pushUndoState.bind(this),
      updatePieces: this.updatePieces.bind(this),
    });
  }

  movePieceFromTray(pieceId: string) {
    const result = movePieceFromTrayOp({
      pieceId,
      findPiece: this.findPiece.bind(this),
      pieces: this.state.pieces,
      boardWidth: this.boardWidth,
      boardHeight: this.boardHeight,
      boardInset: this.boardInset,
      rand: this.rand.bind(this),
      pushUndoState: this.pushUndoState.bind(this),
      updatePieces: this.updatePieces.bind(this),
      zCounter: this.zCounter,
      clampGroupInsideBoardInterior: this.clampGroupInsideBoardInterior.bind(this),
    });
    this.zCounter = result.zCounter;
  }

  setBoardSize(boardWidth: number, boardHeight: number) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    setBoardSizeOp({
      pieces: this.state.pieces,
      boardWidth: this.boardWidth,
      boardHeight: this.boardHeight,
      pad: this.pad,
      getGroupBounds: this.getGroupBounds.bind(this),
      shiftGroup: this.shiftGroup.bind(this),
      clampAllBoardGroupsInsideBoardInterior:
        this.clampAllBoardGroupsInsideBoardInterior.bind(this),
    });
    this.recomputeDerivedState();
  }

  restoreFromSaved(savedPieces: SavedPiece[]) {
    restoreFromSavedOp({
      savedPieces,
      pieces: this.state.pieces,
      pieceLockingEnabled: this.pieceLockingEnabled,
      applySavedPieces,
      setPieces: (pieces: Piece[]) => {
        this.state = { ...this.state, pieces };
      },
      clampAllBoardGroupsInsideBoardInterior:
        this.clampAllBoardGroupsInsideBoardInterior.bind(this),
      syncZCounterFromPieces: this.syncZCounterFromPieces.bind(this),
      assertGroupConsistency,
      recomputeDerivedState: this.recomputeDerivedState.bind(this),
      lockDebug,
    });
  }

  protected trySnapActiveGroupToBoard(): boolean {
    return false;
  }

  protected trySnapActiveGroupToNeighbor(): boolean {
    return false;
  }

  protected rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
