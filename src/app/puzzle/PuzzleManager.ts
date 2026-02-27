/**
 * PuzzleManager – core puzzle logic: pieces, snapping, groups, undo.
 *
 * Sections: options/types; 80–200 init/restore; 200–400 drag/snap/place;
 * 400–550 groups/merge; 550–650 undo; 650–773 events/helpers.
 *
 * Handles drag state, board/neighbor snap tolerances, piece locking, events.
 */
import type { MutableRefObject } from "react";
import type { DragState, GridSize, Piece, PieceCutType, PuzzleState } from "./types";
import { createInitialPieces } from "./factories/createInitialPieces";
import type { SavedPiece } from "./puzzleStorage";
import { UndoManager } from "./undoManager";
import {
  clamp,
  getEffectiveTolerance as getEffectiveToleranceUtil,
  getUndoLimit,
  findPlacementFromTray as findPlacementFromTrayUtil,
} from "./puzzleManagerUtils";
import type { EffectiveToleranceOptions } from "./puzzleManagerUtils";
import {
  getGroupBounds as getGroupBoundsUtil,
  wouldOverlapAnyOtherGroup as wouldOverlapUtil,
  getSolvedNeighbors as getSolvedNeighborsUtil,
} from "./groupUtils";
import {
  computeBoardSnapResult,
  computeNeighborSnapResult,
  computeNearSnapNudge,
  computeMergedGroupBoardSnapResult,
  rotateGroupToZeroPieces,
} from "./puzzleSnap";

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
  /** Ref to user override multiplier from settings slider. */
  snapToleranceOverrideRef?: MutableRefObject<number>;
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
  private snapToleranceOverrideRef: MutableRefObject<number> | undefined;
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
      snapToleranceOverrideRef,
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
    this.snapToleranceOverrideRef = snapToleranceOverrideRef;
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

  private replacePieces(newPieces: Piece[]) {
    this.state = { ...this.state, pieces: newPieces };
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
        x: Math.round(p.targetX - p.pad),
        y: Math.round(p.targetY - p.pad),
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

  /**
   * Soft overflow (px) beyond board edge before hard clamping.
   * Keep this small so pieces remain reachable on touch devices.
   */
  private static readonly SOFT_CLAMP_OVERFLOW = 24;

  private clampGroupDelta(groupId: string, dx: number, dy: number) {
    const b = this.getGroupBounds(groupId);
    if (!b) return { dx: 0, dy: 0 };

    const overflow = PuzzleManager.SOFT_CLAMP_OVERFLOW;
    const minDx = -this.pad - b.minX - overflow;
    const maxDx = this.boardWidth + this.pad - b.maxX + overflow;
    const minDy = -this.pad - b.minY - overflow;
    const maxDy = this.boardHeight + this.pad - b.maxY + overflow;

    return {
      dx: clamp(dx, minDx, maxDx),
      dy: clamp(dy, minDy, maxDy),
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
    const groupPieces = this.getGroupPieces(piece.groupId);
    if (groupPieces.some((p) => p.locked)) return;

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

    const boardPieces = this.state.pieces.filter((p) => !p.inTray);
    const { x, y } = findPlacementFromTrayUtil(
      this.boardWidth,
      this.boardHeight,
      piece,
      boardPieces,
      this.rand.bind(this),
    );

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

      const dx = clamp(0, dxMin, dxMax);
      const dy = clamp(0, dyMin, dyMax);

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

    const newX = clientX - boardRect.left - this.drag.offsetX;
    const newY = clientY - boardRect.top - this.drag.offsetY;
    const dx = newX - piece.x;
    const dy = newY - piece.y;

    this.shiftGroup(piece.groupId, dx, dy);

    // Try snap during drag so fast drags still snap when passing through the target
    const snappedNeighbor = this.trySnapActiveGroupToNeighbor();
    if (snappedNeighbor) {
      this.drag = { ...this.drag, preview: this.computeSnapPreview() };
      return;
    }
    const snappedBoard = this.trySnapActiveGroupToBoard();
    if (snappedBoard) {
      this.recomputeDerivedState();
      this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
      return;
    }

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

    // Try snap during drag so fast drags still snap when passing through the target
    const snappedNeighbor = this.trySnapActiveGroupToNeighbor();
    if (snappedNeighbor) {
      this.drag = { ...this.drag, preview: this.computeSnapPreview() };
      return;
    }
    const snappedBoard = this.trySnapActiveGroupToBoard();
    if (snappedBoard) {
      this.recomputeDerivedState();
      this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
      return;
    }

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

  private getToleranceOptions(): EffectiveToleranceOptions {
    return {
      snapScaleRef: this.snapScaleRef,
      relaxedToleranceMultiplierRef: this.relaxedToleranceMultiplierRef,
      snapToleranceOverrideRef: this.snapToleranceOverrideRef,
      isMobile: this.isMobile,
    };
  }

  private getEffectiveTolerance(basePx: number): number {
    return getEffectiveToleranceUtil(basePx, this.getToleranceOptions());
  }

  private trySnapActiveGroupToBoard(): boolean {
    this.events.onSnapCheck?.();
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const tolerance = this.getEffectiveTolerance(this.snapToleranceBoardPx);
    const result = computeBoardSnapResult(this.state.pieces, activeId, tolerance);

    if (result?.kind === "wrongRotation") {
      this.events.onWrongRotationHint?.(result.groupId, result.pieceIds);
      return false;
    }
    if (result?.kind !== "snap") return false;

    const active = this.findPiece(activeId)!;
    const groupPieces = this.getGroupPieces(result.groupId);

    this.shiftGroupUnclamped(result.groupId, result.dx, result.dy);
    this.setGroupToExactTargetPositions(result.groupId);

    const wasLocked = new Set(groupPieces.filter((p) => p.locked).map((p) => p.id));
    this.updatePieces(
      (p) => p.groupId === result.groupId,
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
    if (!groupPieces.every((p) => p.rotation === 0)) {
      this.replacePieces(rotateGroupToZeroPieces(this.state.pieces, gid));
    }

    const tolerance = this.getEffectiveTolerance(this.snapToleranceNeighborPx);
    const result = computeNeighborSnapResult(
      this.state.pieces,
      activeId,
      tolerance,
      this.tileW,
      this.tileH,
    );

    if (result?.kind !== "snap") return false;

    this.shiftGroupUnclamped(gid, result.dx, result.dy);
    this.mergeGroups(gid, result.intoGroupId);

    this.trySnapMergedGroupToBoard(result.intoGroupId);
    const mergedPieces = this.getGroupPieces(result.intoGroupId);
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

  private tryNearSnapNudge(): void {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const tolerance = this.getEffectiveTolerance(this.snapToleranceBoardPx);
    const result = computeNearSnapNudge(this.state.pieces, activeId, tolerance);
    if (!result) return;

    const active = this.findPiece(activeId)!;
    this.shiftGroup(active.groupId, result.nudgeDx, result.nudgeDy);
  }

  private trySnapMergedGroupToBoard(groupId: string): void {
    this.events.onSnapCheck?.();
    const result = computeMergedGroupBoardSnapResult(this.state.pieces, groupId);
    if (!result) return;

    this.shiftGroupUnclamped(groupId, result.dx, result.dy);
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
