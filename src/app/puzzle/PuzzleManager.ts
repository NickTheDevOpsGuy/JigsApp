/**
 * PuzzleManager – core puzzle logic: pieces, snapping, groups, undo.
 * Handles drag state, board/neighbor snap tolerances, piece locking, events.
 */
import type { MutableRefObject } from "react";
import type { DragState, GridSize, Piece, PieceCutType, PuzzleState } from "./types";
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
  /** Ref to relaxed-mode multiplier (1 = normal, 1.5 = increased tolerance when idle). */
  relaxedToleranceMultiplierRef?: MutableRefObject<number>;
  rotationStepDeg?: 90 | 180;
  /** Use tighter scatter pattern for mobile viewports. */
  isMobile?: boolean;
  /** Piece cut style (classic, irregular, hard). */
  cutType?: PieceCutType;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  /** Called when a group snaps to a neighbor (merge). Pass merged group piece IDs and optional center (board space) for particles. */
  onPieceSnapped?: (pieceIds: string[], center?: { x: number; y: number }) => void;
  onPieceLocked?: (pieceIds: string[]) => void;
  onPuzzleComplete?: (state: PuzzleState) => void;
  /** Called each time snap logic is evaluated (for perf overlay profiling). */
  onSnapCheck?: () => void;
  /** Called when a group would snap to board but rotation blocks it (position correct, rotation wrong). */
  onWrongRotationHint?: (groupId: string, pieceIds: string[]) => void;
};
function _clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

/** Undo limit: 50 for ≤64 pieces, 25 for 81+ to reduce memory on large puzzles. */
function getUndoLimit(pieceCount: number): number {
  return pieceCount <= 64 ? 50 : 25;
}

export class PuzzleManager {
  private state: PuzzleState;
  private drag: DragState;
  private zCounter: number;
  private events: PuzzleManagerEvents;

  private readonly undoManager: UndoManager;

  private boardWidth: number;
  private boardHeight: number;

  private snapToleranceBoardPx: number;
  private snapToleranceNeighborPx: number;
  private snapScaleRef: MutableRefObject<number> | undefined;
  private relaxedToleranceMultiplierRef: MutableRefObject<number> | undefined;
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
      relaxedToleranceMultiplierRef,
      scatterStartYRatio = 0.3,
      rotationStepDeg = 90,
      isMobile = false,
    } = options;

    this.relaxedToleranceMultiplierRef = relaxedToleranceMultiplierRef;
    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapToleranceBoardPx = snapToleranceBoardPx;
    this.snapToleranceNeighborPx = snapToleranceNeighborPx;
    this.snapScaleRef = snapScaleRef;
    this.isMobile = isMobile;
    this.scatterStartYRatio = scatterStartYRatio;
    this.rotationStepDeg = rotationStepDeg;
    const cutType = options.cutType ?? "classic";
    const depthPct = cutType === "irregular" ? 0.26 : cutType === "hard" ? 0.14 : 0.22;
    const minPad = Math.ceil(Math.min(pieceWidth, pieceHeight) * depthPct);
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
      cutType,
    });

    this.state = {
      imageUrl,
      grid,
      pieces,
      placedCount: 0,
      totalCount: pieces.length,
      isComplete: false,
    };

    this.undoManager = new UndoManager(getUndoLimit(pieces.length));

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

  /** Soft overflow (px) beyond board edge before hard clamping. Avoids lost pieces. */
  private static readonly SOFT_CLAMP_OVERFLOW = 80;

  private clampGroupDelta(groupId: string, dx: number, dy: number) {
    const b = this.getGroupBounds(groupId);
    if (!b) return { dx: 0, dy: 0 };

    const overflow = PuzzleManager.SOFT_CLAMP_OVERFLOW;
    const minDx = -this.pad - b.minX - overflow;
    const maxDx = this.boardWidth + this.pad - b.maxX + overflow;
    const minDy = -this.pad - b.minY - overflow;
    const maxDy = this.boardHeight + this.pad - b.maxY + overflow;

    return {
      dx: _clamp(dx, minDx, maxDx),
      dy: _clamp(dy, minDy, maxDy),
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

  /**
   * Merge two groups atomically. All pieces in `from` get `groupId: into`.
   * Undo/redo: we push once at pointerDown; pointerUp runs merge without pushing.
   * One undo reverts the full merge (and the drag that led to it).
   */
  private mergeGroups(from: string, into: string) {
    if (from === into) return;
    this.updatePieces(
      (p) => p.groupId === from,
      () => ({ groupId: into }),
    );
  }

  private computeSnapPreview() {
    return null;
  }

  /**
   * Preview state for snap glow during drag. Only when rotation is correct.
   * nearSnap = within 1.5x tolerance (soft outline). inSnapRange = within tolerance, will snap on release.
   * proximity = 0–1, stronger when closer to snap point (for intensity-based visual feedback).
   */
  public getSnapPreviewState(): {
    nearSnap: boolean;
    inSnapRange: boolean;
    proximity: number;
  } | null {
    const activeId = this.drag.activeId;
    if (!activeId) return null;

    const active = this.findPiece(activeId);
    if (!active || active.isPlaced) return null;

    const gid = active.groupId;
    const groupPieces = this.getGroupPieces(gid);
    if (!groupPieces.every((p) => p.rotation === 0)) return null;

    const activeTile = this.tilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;
    const distance = Math.hypot(dx, dy);
    const tolerance = this.getEffectiveTolerance(this.snapToleranceBoardPx);
    const nearThreshold = tolerance * 1.5;
    const wouldOverlap = this.wouldOverlapAnyOtherGroup(gid, dx, dy);

    const inSnapRange = distance <= tolerance && !wouldOverlap;
    const nearSnap = distance <= nearThreshold && !wouldOverlap;

    // Proximity: 1 = at snap point, 0 = at edge of nearSnap zone. Smooth gradient for visual feedback.
    const proximity = nearSnap ? Math.max(0, 1 - distance / nearThreshold) : 0;

    return { nearSnap: nearSnap || inSnapRange, inSnapRange, proximity };
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

    // Piece (x,y) is container top-left; rotated bbox is centered at (x+w/2, y+h/2) with size effW×effH
    // Bbox top-left = (x + piece.w/2 - effW/2, y + piece.h/2 - effH/2)
    const offsetX = (piece.w - effW) / 2;
    const offsetY = (piece.h - effH) / 2;

    const pad = 16;
    const xMin = pad - offsetX;
    const xMax = Math.max(xMin, this.boardWidth - effW - pad - offsetX);
    const yMin = pad - offsetY;
    const yMax = Math.max(yMin, this.boardHeight - effH - pad - offsetY);

    const boardPieces = this.state.pieces.filter((p) => !p.inTray);
    const MOVE_FROM_TRAY_RETRY_MAX = 24;

    let x = this.rand(xMin, xMax);
    let y = this.rand(yMin, yMax);
    for (let retry = 0; retry < MOVE_FROM_TRAY_RETRY_MAX; retry++) {
      x = _clamp(
        this.rand(xMin, xMax),
        pad - offsetX,
        Math.max(pad - offsetX, this.boardWidth - effW - pad - offsetX),
      );
      y = _clamp(
        this.rand(yMin, yMax),
        pad - offsetY,
        Math.max(pad - offsetY, this.boardHeight - effH - pad - offsetY),
      );

      // Overlap: our bbox is (x+offsetX, y+offsetY, effW, effH)
      const ourLeft = x + offsetX;
      const ourTop = y + offsetY;
      let overlaps = false;
      for (const p of boardPieces) {
        const pr = p.rotation % 360;
        const pw = pr === 90 || pr === 270 ? p.h : p.w;
        const ph = pr === 90 || pr === 270 ? p.w : p.h;
        const pOffX = (p.w - pw) / 2;
        const pOffY = (p.h - ph) / 2;
        const pLeft = p.x + pOffX;
        const pTop = p.y + pOffY;
        if (
          !(
            ourLeft + effW <= pLeft ||
            pLeft + pw <= ourLeft ||
            ourTop + effH <= pTop ||
            pTop + ph <= ourTop
          )
        ) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) break;
    }

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

    // Push once at drag start so entire drag+snap+merge is one undo step
    this.pushUndoState();

    this.zCounter += 1;
    this.updatePieces(
      (p) => p.groupId === piece.groupId,
      (p) => ({
        z: this.zCounter,
        dragCount: (p.dragCount ?? 0) + 1,
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

    // No push here: merge is part of the same atomic action as the drag (pushed at pointerDown).
    // Try neighbor snap first (connect pieces), then board snap (align to grid).
    // Order matters: board-then-neighbor could undo the board snap by aligning to a floating neighbor.
    performance.mark("snap-neighbor-start");
    const snappedNeighbor = this.trySnapActiveGroupToNeighbor();
    performance.mark("snap-neighbor-end");
    performance.measure("snap-neighbor", "snap-neighbor-start", "snap-neighbor-end");

    performance.mark("snap-board-start");
    const snappedBoard = this.trySnapActiveGroupToBoard();
    performance.mark("snap-board-end");
    performance.measure("snap-board", "snap-board-start", "snap-board-end");

    if (!snappedNeighbor && !snappedBoard) {
      this.tryNearSnapNudge();
    }

    // Clear drag state
    this.drag = {
      activeId: null,
      offsetX: 0,
      offsetY: 0,
      preview: null,
    };

    this.recomputeDerivedState();
  }

  /**
   * Restore full piece state from a snapshot (undo/redo).
   * Applies atomically: no partial states, no orphaned pieces.
   * Every piece gets its saved groupId, so groups are consistent after restore.
   */
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
            dragCount: saved.dragCount ?? p.dragCount ?? 0,
          };
        }
        return p;
      }),
    };

    this.assertGroupConsistency();
    this.recomputeDerivedState();
  }

  /** Dev-only: ensure no piece has empty groupId after restore (would indicate corruption). */
  private assertGroupConsistency(): void {
    if (import.meta.env?.DEV !== true) return;
    for (const p of this.state.pieces) {
      if (!p.groupId || typeof p.groupId !== "string") {
        console.warn("[PuzzleManager] Piece has invalid groupId after restore:", p.id);
      }
    }
  }

  /* ---------------- Snapping ---------------- */

  /**
   * Zoom-adaptive tolerance:
   * - Zoomed out (scale < 1): larger tolerance to reduce frustration
   * - Zoomed in (scale > 1): more precise to avoid accidental long-distance snaps
   * - Floor when very zoomed in to keep consistent feel across devices
   * Mobile gets a small bump (~8%) for touch imprecision.
   */
  private getEffectiveTolerance(basePx: number): number {
    const mobileBump = this.isMobile ? 1.08 : 1;
    const relaxedMult = this.relaxedToleranceMultiplierRef?.current ?? 1;
    const adjusted = basePx * mobileBump * relaxedMult;
    const scale = this.snapScaleRef?.current ?? 1;
    const clampedScale = Math.max(0.25, Math.min(4, scale));
    let effective = adjusted / clampedScale;
    if (scale < 1) {
      const maxMultiplier = scale <= 0.5 ? 2.5 : 2 + (1 - scale);
      effective = Math.min(effective, adjusted * maxMultiplier);
    } else {
      effective = Math.max(effective, adjusted * 0.35);
    }
    return effective;
  }

  private trySnapActiveGroupToBoard(): boolean {
    this.events.onSnapCheck?.();
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active) return false;

    const gid = active.groupId;
    const groupPieces = this.getGroupPieces(gid);

    if (!groupPieces.every((p) => p.rotation === 0)) {
      const activeTile = this.tilePos(active);
      const dx = active.targetX - activeTile.x;
      const dy = active.targetY - activeTile.y;
      const tolerance = this.getEffectiveTolerance(this.snapToleranceBoardPx);
      if (
        Math.hypot(dx, dy) <= tolerance &&
        !this.wouldOverlapAnyOtherGroup(gid, dx, dy)
      ) {
        this.events.onWrongRotationHint?.(
          gid,
          groupPieces.map((p) => p.id),
        );
      }
      return false;
    }

    const activeTile = this.tilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;

    const tolerance = this.getEffectiveTolerance(this.snapToleranceBoardPx);
    if (Math.hypot(dx, dy) > tolerance) return false;
    if (this.wouldOverlapAnyOtherGroup(gid, dx, dy)) return false;

    // Only allow snap when ALL pieces in the group would land at their targets (prevents locking wrong groups)
    for (const p of groupPieces) {
      const t = this.tilePos(p);
      const offX = Math.abs(p.targetX - t.x - dx);
      const offY = Math.abs(p.targetY - t.y - dy);
      if (offX > 2 || offY > 2) return false;
    }

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
    this.events.onSnapCheck?.();
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
    // Exclude tray pieces – they use different coordinates and must not be snap targets.
    const boundaryPieces = groupPieces.filter((gp) => {
      const neighbors = getSolvedNeighborsFromMap(gp, rowColMap);
      return neighbors.some(
        (n) => !n.inTray && !groupIdSet.has(n.id) && n.rotation === 0,
      );
    });

    let best: null | { dx: number; dy: number; dist: number; into: string } = null;

    for (const gp of boundaryPieces) {
      for (const n of getSolvedNeighborsFromMap(gp, rowColMap)) {
        if (n.groupId === gid || n.rotation !== 0 || n.inTray) continue;

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

  /** Gentle nudge when group is very close to board snap but didn't snap (e.g. just outside tolerance). */
  private tryNearSnapNudge(): void {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const active = this.findPiece(activeId);
    if (!active || active.isPlaced || active.locked) return;

    const gid = active.groupId;
    if (!this.getGroupPieces(gid).every((p) => p.rotation === 0)) return;

    const activeTile = this.tilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;
    const distance = Math.hypot(dx, dy);
    const tolerance = this.getEffectiveTolerance(this.snapToleranceBoardPx);
    const nearThreshold = tolerance * 0.7;
    const farThreshold = tolerance * 1.15;

    if (distance <= nearThreshold || distance > farThreshold) return;
    if (this.wouldOverlapAnyOtherGroup(gid, dx, dy)) return;

    const nudgeFactor = 0.35;
    const nudgeDx = dx * nudgeFactor;
    const nudgeDy = dy * nudgeFactor;
    this.shiftGroup(gid, nudgeDx, nudgeDy);
  }

  private trySnapMergedGroupToBoard(groupId: string): void {
    this.events.onSnapCheck?.();
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

  /**
   * Drift mode: apply small random nudge to unplaced pieces (groups).
   * Called every ~10s when experimental drift is enabled.
   */
  public driftUnplacedPieces(): void {
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
}
