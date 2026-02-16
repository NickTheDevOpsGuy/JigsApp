import type { MutableRefObject } from "react";
import type { DragState, GridSize, Piece, PuzzleState } from "./types";
import { createInitialPieces } from "./factories/createInitialPieces";
import type { SavedPiece } from "./puzzleStorage";
import { UndoManager } from "./undoManager";
import {
  getGroupBounds as getGroupBoundsUtil,
  wouldOverlapAnyOtherGroup as wouldOverlapUtil,
  getSolvedNeighbors as getSolvedNeighborsUtil,
  buildRowColMap,
  getSolvedNeighborsFromMap,
} from "./groupUtils";

export type PuzzleManagerOptions = {
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;
  grid: GridSize;
  correctEpsilonPx?: number;

  pieceWidth: number;
  pieceHeight: number;
  pad?: number;

  scatterPadding?: number;
  scatterStartYRatio?: number;
  /** Board snap tolerance (precise placement). Default 34. */
  snapToleranceBoardPx?: number;
  /** Neighbor snap tolerance (connecting pieces, more forgiving). Default 48. */
  snapToleranceNeighborPx?: number;
  /** Ref to viewport scale for zoom-adaptive tolerance. When set, effective = base / scale (capped). */
  snapScaleRef?: MutableRefObject<number>;
  rotationStepDeg?: 90 | 180;
  /** Use tighter scatter pattern for mobile viewports. */
  isMobile?: boolean;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  /** Called when a group snaps to a neighbor (merge). Pass merged group piece IDs and optional center (board space) for particles. */
  onPieceSnapped?: (pieceIds: string[], center?: { x: number; y: number }) => void;
  onPieceLocked?: (pieceIds: string[]) => void;
  onPuzzleComplete?: (state: PuzzleState) => void;
};
function _clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

const UNDO_HISTORY_LIMIT = 30;

export class PuzzleManager {
  private state: PuzzleState;
  private drag: DragState;
  private zCounter: number;
  private events: PuzzleManagerEvents;

  private readonly undoManager = new UndoManager(UNDO_HISTORY_LIMIT);

  private boardWidth: number;
  private boardHeight: number;

  private snapToleranceBoardPx: number;
  private snapToleranceNeighborPx: number;
  private snapScaleRef: MutableRefObject<number> | undefined;
  private isMobile: boolean;
  private scatterStartYRatio: number;
  private rotationStepDeg: 90 | 180;

  /** When true, pieces that snap to correct position become locked (cannot be moved). */
  private pieceLockingEnabled: boolean = false;

  private pad: number;
  private tileW: number;
  private tileH: number;

  private readonly targetStartX: number = 0;
  private readonly targetStartY: number = 0;

  constructor(options: PuzzleManagerOptions, events: PuzzleManagerEvents = {}) {
    const {
      imageUrl,
      boardWidth,
      boardHeight,
      grid,
      pieceWidth,
      pieceHeight,
      scatterPadding = 16,
      pad = 18,
      snapToleranceBoardPx = 34,
      snapToleranceNeighborPx = 48,
      snapScaleRef,
      scatterStartYRatio = 0.3,
      rotationStepDeg = 90,
      isMobile = false,
    } = options;

    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapToleranceBoardPx = snapToleranceBoardPx;
    this.snapToleranceNeighborPx = snapToleranceNeighborPx;
    this.snapScaleRef = snapScaleRef;
    this.isMobile = isMobile;
    this.scatterStartYRatio = scatterStartYRatio;
    this.rotationStepDeg = rotationStepDeg;
    // Tabs extend ~22% beyond tile edge; pad must exceed that or shapes get clipped
    const minPad = Math.ceil(Math.min(pieceWidth, pieceHeight) * 0.22);
    this.pad = Math.max(pad, minPad);
    this.tileW = pieceWidth;
    this.tileH = pieceHeight;

    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.zCounter = 10;

    const pieces = createInitialPieces({
      grid,
      boardWidth,
      boardHeight,
      scatterPadding,
      pad: this.pad,
      tileW: pieceWidth,
      tileH: pieceHeight,
      scatterStartYRatio,
      rotationStepDeg,
      targetStartX: this.targetStartX,
      targetStartY: this.targetStartY,
      isMobile,
    });

    this.state = {
      imageUrl,
      grid,
      pieces,
      placedCount: 0,
      totalCount: pieces.length,
      isComplete: false,
    };

    this.recomputeDerivedState();
  }

  /* ---------------- Correctness / Win condition ---------------- */

  /** Allow 2px tolerance for rounding from snap shifts */
  private static readonly CORRECT_EPSILON_PX = 2;

  private isPieceCorrect(p: Piece) {
    if (p.rotation !== p.targetRotation) return false;
    const tile = this.tilePos(p);
    const dx = Math.abs(tile.x - p.targetX);
    const dy = Math.abs(tile.y - p.targetY);
    return (
      dx <= PuzzleManager.CORRECT_EPSILON_PX && dy <= PuzzleManager.CORRECT_EPSILON_PX
    );
  }

  private recomputeDerivedState() {
    const allPieces = this.state.pieces;
    if (allPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    const boardPieces = allPieces.filter((p) => !p.inTray);

    // Progress = correctly placed pieces (at target position with correct rotation).
    // Do not count pieces sitting loose on the board; only those snapped to correct spot.
    const placedCount = boardPieces.filter((p) => this.isPieceCorrect(p)).length;

    if (boardPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    const noTrayPieces = boardPieces.length === allPieces.length;
    const allCorrectRotation = boardPieces.every((p) => p.rotation === p.targetRotation);

    // Win condition: all pieces must be at their correct board positions with correct rotation.
    const isComplete =
      noTrayPieces &&
      allCorrectRotation &&
      boardPieces.every((p) => this.isPieceCorrect(p));
    const prevComplete = this.state.isComplete;

    this.state = {
      ...this.state,
      placedCount,
      isComplete,
    };

    if (!prevComplete && isComplete) {
      // Snap the completed puzzle to the correct board position (exact target positions)
      const ref = boardPieces[0];
      this.setGroupToExactTargetPositions(ref.groupId);

      this.updatePieces(
        () => true,
        () => ({ isPlaced: true }),
      );
      this.events.onPuzzleComplete?.(this.state);
    }
  }

  /* ---------------- Utilities ---------------- */

  private updatePieces(
    predicate: (p: Piece) => boolean,
    updater: (p: Piece) => Partial<Piece>,
  ) {
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => (predicate(p) ? { ...p, ...updater(p) } : p)),
    };
  }

  private tilePos(p: Piece) {
    return { x: p.x + p.pad, y: p.y + p.pad };
  }

  private getGroupPieces(groupId: string): Piece[] {
    return this.state.pieces.filter((p) => p.groupId === groupId);
  }

  private shiftGroupUnclamped(groupId: string, dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    this.updatePieces(
      (p) => p.groupId === groupId,
      (p) => ({ x: p.x + Math.round(dx), y: p.y + Math.round(dy) }),
    );
  }

  /** Set every piece in the group to its exact target position on the canvas (no rounding drift). */
  private setGroupToExactTargetPositions(groupId: string): void {
    this.updatePieces(
      (p) => p.groupId === groupId,
      (p) => ({
        x: p.targetX - p.pad,
        y: p.targetY - p.pad,
      }),
    );
  }

  private getGroupBounds(groupId: string) {
    return getGroupBoundsUtil(this.state.pieces, groupId);
  }

  private shiftGroup(groupId: string, dx: number, dy: number) {
    const clamped = this.clampGroupDelta(groupId, dx, dy);
    if (clamped.dx === 0 && clamped.dy === 0) return;
    this.updatePieces(
      (p) => p.groupId === groupId,
      (p) => ({ x: p.x + clamped.dx, y: p.y + clamped.dy }),
    );
  }

  private clampGroupDelta(groupId: string, dx: number, dy: number) {
    const b = this.getGroupBounds(groupId);
    if (!b) return { dx: 0, dy: 0 };

    return {
      dx: _clamp(dx, -this.pad - b.minX, this.boardWidth + this.pad - b.maxX),
      dy: _clamp(dy, -this.pad - b.minY, this.boardHeight + this.pad - b.maxY),
    };
  }

  private findPiece(id: string) {
    return this.state.pieces.find((p) => p.id === id) ?? null;
  }

  private wouldOverlapAnyOtherGroup(groupId: string, dx: number, dy: number): boolean {
    return wouldOverlapUtil(this.state.pieces, groupId, dx, dy);
  }

  private getSolvedNeighbors(piece: Piece): Piece[] {
    return getSolvedNeighborsUtil(this.state.pieces, piece);
  }

  private mergeGroups(from: string, into: string) {
    if (from === into) return;
    this.updatePieces(
      (p) => p.groupId === from,
      () => ({ groupId: into }),
    );
  }

  private computeSnapPreview() {
    // This is a simplified version - you may want to implement full snap preview logic
    return null;
  }

  /* ---------------- Public API ---------------- */

  getState(): PuzzleState {
    return this.state;
  }

  /** Save current piece state before a user action (for undo). */
  pushUndoState(): void {
    if (this.state.isComplete) return;
    this.undoManager.push(this.state.pieces);
  }

  /** Restore previous piece state. Returns true if undo was performed. */
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

  /** Re-apply a previously undone state. Returns true if redo was performed. */
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
  }

  getPieceLockingEnabled(): boolean {
    return this.pieceLockingEnabled;
  }

  getDragState(): DragState {
    return this.drag;
  }

  public getPiece(id: string) {
    return this.findPiece(id);
  }

  public nudgeGroup(pieceId: string, dx: number, dy: number) {
    const p = this.findPiece(pieceId);
    if (!p || p.isPlaced || p.locked) return;
    this.pushUndoState();
    this.shiftGroup(p.groupId, dx, dy);
    this.recomputeDerivedState();
  }

  public rotateGroup(pieceId: string) {
    const p = this.findPiece(pieceId);
    if (!p || p.isPlaced || p.locked) return;
    this.rotatePiece(pieceId);
  }

  public rotatePiece(pieceId: string) {
    const piece = this.findPiece(pieceId);
    if (!piece || piece.isPlaced || piece.locked) return;

    this.pushUndoState();

    this.updatePieces(
      (p) => p.groupId === piece.groupId,
      (p) => ({ rotation: (p.rotation + this.rotationStepDeg) % 360 }),
    );
  }

  /** @param skipPush - when true, caller already pushed (e.g. nudgeGroup) */
  public snapGroupNow(pieceId: string, skipPush = false) {
    const p = this.findPiece(pieceId);
    if (!p || p.isPlaced || p.locked) return;

    if (!skipPush) this.pushUndoState();
    this.drag = { ...this.drag, activeId: p.id };
    this.trySnapActiveGroupToNeighbor();
    this.trySnapActiveGroupToBoard();
    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.recomputeDerivedState();
  }

  public sendToTray(pieceId: string) {
    this.movePieceToTray(pieceId);
    this.recomputeDerivedState();
  }

  movePieceToTray(pieceId: string) {
    const piece = this.findPiece(pieceId);
    if (!piece || piece.isPlaced || piece.locked) return;

    this.pushUndoState();

    const groupPieces = this.getGroupPieces(piece.groupId);
    if (groupPieces.length > 1) return;

    this.updatePieces(
      (p) => p.id === pieceId,
      () => ({ inTray: true }),
    );
  }

  movePieceFromTray(pieceId: string) {
    const piece = this.findPiece(pieceId);
    if (!piece || !piece.inTray) return;

    this.pushUndoState();

    // Use effective dimensions for rotated pieces (90°/270° swap w and h in screen space)
    const rot = piece.rotation % 360;
    const effW = rot === 90 || rot === 270 ? piece.h : piece.w;
    const effH = rot === 90 || rot === 270 ? piece.w : piece.h;

    const pad = 16;
    const xMin = pad;
    const xMax = Math.max(pad, this.boardWidth - effW - pad);
    const yMin = pad;
    const yMax = Math.max(pad, this.boardHeight - effH - pad);

    let x = this.rand(xMin, xMax);
    let y = this.rand(yMin, yMax);

    // Clamp to ensure piece stays fully on canvas (handles edge cases)
    x = _clamp(x, 0, Math.max(0, this.boardWidth - effW));
    y = _clamp(y, 0, Math.max(0, this.boardHeight - effH));

    this.zCounter += 1;
    this.updatePieces(
      (p) => p.id === pieceId,
      () => ({
        inTray: false,
        x,
        y,
        z: this.zCounter,
      }),
    );
  }

  setBoardSize(boardWidth: number, boardHeight: number) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;

    const seen = new Set<string>();
    for (const p of this.state.pieces) {
      if (seen.has(p.groupId)) continue;
      seen.add(p.groupId);

      const bounds = this.getGroupBounds(p.groupId);
      if (!bounds) continue;

      const dxMin = -this.pad - bounds.minX;
      const dxMax = this.boardWidth + this.pad - bounds.maxX;
      const dyMin = -this.pad - bounds.minY;
      const dyMax = this.boardHeight + this.pad - bounds.maxY;

      const dx = _clamp(0, dxMin, dxMax);
      const dy = _clamp(0, dyMin, dyMax);

      if (dx !== 0 || dy !== 0) this.shiftGroup(p.groupId, dx, dy);
    }

    this.recomputeDerivedState();
  }

  public pointerDown(
    pieceId: string,
    clientX: number,
    clientY: number,
    pieceRect: DOMRect,
  ) {
    const piece = this.findPiece(pieceId);
    if (!piece || piece.isPlaced || piece.locked) return;

    this.pushUndoState();

    this.zCounter += 1;
    this.updatePieces(
      (p) => p.groupId === piece.groupId,
      () => ({
        z: this.zCounter,
      }),
    );

    // Calculate offset from pointer to piece origin
    const offsetX = clientX - pieceRect.left;
    const offsetY = clientY - pieceRect.top;

    this.drag = {
      activeId: pieceId,
      offsetX,
      offsetY,
      preview: null,
    };
  }

  public pointerMove(clientX: number, clientY: number, boardRect: DOMRect) {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const piece = this.findPiece(activeId);
    if (!piece) return;

    // Calculate new position
    const newX = clientX - boardRect.left - this.drag.offsetX;
    const newY = clientY - boardRect.top - this.drag.offsetY;

    // Calculate delta from current position
    const dx = newX - piece.x;
    const dy = newY - piece.y;

    // Move the group
    this.shiftGroup(piece.groupId, dx, dy);

    // Compute snap preview
    this.drag = {
      ...this.drag,
      preview: this.computeSnapPreview(),
    };
  }

  /** Board-space coords for zoom/pan viewports. */
  public pointerDownBoardSpace(pieceId: string, boardX: number, boardY: number) {
    const piece = this.findPiece(pieceId);
    if (!piece || piece.isPlaced || piece.locked) return;

    this.pushUndoState();

    this.zCounter += 1;
    this.updatePieces(
      (p) => p.groupId === piece.groupId,
      () => ({ z: this.zCounter }),
    );

    this.drag = {
      activeId: pieceId,
      offsetX: boardX - piece.x,
      offsetY: boardY - piece.y,
      preview: null,
    };
  }

  /** Board-space coords for zoom/pan viewports. */
  public pointerMoveBoardSpace(boardX: number, boardY: number) {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const piece = this.findPiece(activeId);
    if (!piece) return;

    const newX = boardX - this.drag.offsetX;
    const newY = boardY - this.drag.offsetY;
    const dx = newX - piece.x;
    const dy = newY - piece.y;

    this.shiftGroup(piece.groupId, dx, dy);
    this.drag = {
      ...this.drag,
      preview: this.computeSnapPreview(),
    };
  }

  public pointerUp() {
    if (!this.drag.activeId) return;

    // Try neighbor snap first (connect pieces), then board snap (align to grid).
    // Order matters: board-then-neighbor could undo the board snap by aligning to a floating neighbor.
    performance.mark("snap-neighbor-start");
    this.trySnapActiveGroupToNeighbor();
    performance.mark("snap-neighbor-end");
    performance.measure("snap-neighbor", "snap-neighbor-start", "snap-neighbor-end");

    performance.mark("snap-board-start");
    this.trySnapActiveGroupToBoard();
    performance.mark("snap-board-end");
    performance.measure("snap-board", "snap-board-start", "snap-board-end");

    // Clear drag state
    this.drag = {
      activeId: null,
      offsetX: 0,
      offsetY: 0,
      preview: null,
    };

    this.recomputeDerivedState();
  }

  public restoreFromSaved(savedPieces: SavedPiece[]) {
    const currentPieces = this.state.pieces;
    if (savedPieces.length !== currentPieces.length) {
      throw new Error(
        `Saved piece count (${savedPieces.length}) does not match grid (${currentPieces.length})`,
      );
    }
    const pieceMap = new Map(savedPieces.map((p) => [p.id, p]));
    const currentIds = new Set(currentPieces.map((p) => p.id));
    for (const sp of savedPieces) {
      if (!currentIds.has(sp.id)) {
        throw new Error(`Saved piece id ${sp.id} not found in current puzzle`);
      }
    }

    this.state = {
      ...this.state,
      pieces: currentPieces.map((p) => {
        const saved = pieceMap.get(p.id);
        if (saved) {
          return {
            ...p,
            x: saved.x,
            y: saved.y,
            z: saved.z,
            rotation: saved.rotation,
            groupId: saved.groupId,
            isPlaced: saved.isPlaced,
            locked: saved.locked ?? false,
            inTray: saved.inTray,
          };
        }
        return p;
      }),
    };

    this.recomputeDerivedState();
  }

  /* ---------------- Snapping ---------------- */

  /**
   * Zoom-adaptive tolerance: keeps snap zone roughly constant in screen pixels.
   * effective = base / scale, clamped to avoid accidental long-distance snaps.
   * Mobile gets a small bump (~8%) for touch imprecision.
   */
  private getEffectiveTolerance(basePx: number): number {
    const mobileBump = this.isMobile ? 1.08 : 1;
    const adjusted = basePx * mobileBump;
    const scale = this.snapScaleRef?.current ?? 1;
    const clampedScale = Math.max(0.25, Math.min(4, scale));
    const effective = adjusted / clampedScale;
    return Math.min(effective, adjusted * 2);
  }

  private trySnapActiveGroupToBoard(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active) return false;

    const gid = active.groupId;
    const groupPieces = this.getGroupPieces(gid);

    if (!groupPieces.every((p) => p.rotation === 0)) return false;

    const activeTile = this.tilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;

    const tolerance = this.getEffectiveTolerance(this.snapToleranceBoardPx);
    if (Math.hypot(dx, dy) > tolerance) return false;
    if (this.wouldOverlapAnyOtherGroup(gid, dx, dy)) return false;

    this.shiftGroupUnclamped(gid, Math.round(dx), Math.round(dy));
    this.setGroupToExactTargetPositions(gid);

    const wasLocked = new Set(groupPieces.filter((p) => p.locked).map((p) => p.id));
    this.updatePieces(
      (p) => p.groupId === gid,
      (p) => ({
        justSnapped: true,
        locked: this.pieceLockingEnabled || p.locked,
      }),
    );
    this.events.onPiecePlaced?.(active);
    if (this.pieceLockingEnabled) {
      const newlyLocked = groupPieces
        .filter((p) => !wasLocked.has(p.id))
        .map((p) => p.id);
      if (newlyLocked.length > 0) this.events.onPieceLocked?.(newlyLocked);
    }
    return true;
  }

  private trySnapActiveGroupToNeighbor(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active || active.isPlaced) return false;

    const gid = active.groupId;
    const groupPieces = this.getGroupPieces(gid);
    if (!groupPieces.every((p) => p.rotation === 0)) return false;

    const groupIdSet = new Set(groupPieces.map((p) => p.id));
    const rowColMap = buildRowColMap(this.state.pieces);

    // Only check boundary pieces: those with a neighbor outside this group (possible snap target).
    const boundaryPieces = groupPieces.filter((gp) => {
      const neighbors = getSolvedNeighborsFromMap(gp, rowColMap);
      return neighbors.some((n) => !groupIdSet.has(n.id) && n.rotation === 0);
    });

    let best: null | { dx: number; dy: number; dist: number; into: string } = null;

    for (const gp of boundaryPieces) {
      for (const n of getSolvedNeighborsFromMap(gp, rowColMap)) {
        if (n.groupId === gid || n.rotation !== 0) continue;

        const gpTile = this.tilePos(gp);
        const nTile = this.tilePos(n);

        const expectedDx = (n.col - gp.col) * this.tileW;
        const expectedDy = (n.row - gp.row) * this.tileH;

        const dx = nTile.x - expectedDx - gpTile.x;
        const dy = nTile.y - expectedDy - gpTile.y;
        const d = Math.hypot(dx, dy);

        const neighborTolerance = this.getEffectiveTolerance(
          this.snapToleranceNeighborPx,
        );
        if (d <= neighborTolerance && (!best || d < best.dist)) {
          best = { dx, dy, dist: d, into: n.groupId };
        }
      }
    }

    if (!best) return false;

    this.shiftGroupUnclamped(gid, Math.round(best.dx), Math.round(best.dy));
    this.mergeGroups(gid, best.into);

    // Don't lock on neighbor snap - the neighbor group may not be at correct positions.
    // Locking only happens in trySnapActiveGroupToBoard when snapping to the correct board spot.

    this.trySnapMergedGroupToBoard(best.into);
    const mergedPieces = this.getGroupPieces(best.into);
    const mergedIds = mergedPieces.map((p) => p.id);
    const center =
      mergedPieces.length > 0
        ? {
            x: mergedPieces.reduce((s, p) => s + p.x + p.w / 2, 0) / mergedPieces.length,
            y: mergedPieces.reduce((s, p) => s + p.y + p.h / 2, 0) / mergedPieces.length,
          }
        : undefined;
    this.events.onPieceSnapped?.(mergedIds, center);

    return true;
  }

  private trySnapMergedGroupToBoard(groupId: string): void {
    const groupPieces = this.getGroupPieces(groupId);
    if (!groupPieces.every((p) => p.rotation === 0)) return;

    const ref = groupPieces[0];
    const tile = this.tilePos(ref);

    const dx = ref.targetX - tile.x;
    const dy = ref.targetY - tile.y;

    if (this.wouldOverlapAnyOtherGroup(groupId, dx, dy)) return;

    this.shiftGroupUnclamped(groupId, Math.round(dx), Math.round(dy));
    this.setGroupToExactTargetPositions(groupId);
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
