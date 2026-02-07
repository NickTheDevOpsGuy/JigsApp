import type { DragState, GridSize, Piece, PuzzleState } from "./types";
import { createInitialPieces } from "./factories/createInitialPieces";
import type { SavedPiece } from "./puzzleStorage";
import { UndoManager } from "./undoManager";
import {
  getGroupBounds as getGroupBoundsUtil,
  wouldOverlapAnyOtherGroup as wouldOverlapUtil,
  getSolvedNeighbors as getSolvedNeighborsUtil,
} from "./groupUtils";

export type PuzzleManagerOptions = {
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;
  grid: GridSize;

  pieceWidth: number;
  pieceHeight: number;

  pad?: number;
  scatterPadding?: number;
  scatterStartYRatio?: number;
  snapTolerancePx?: number;
  rotationStepDeg?: 90 | 180;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  onPieceSnapped?: () => void;
  onPuzzleComplete?: (state: PuzzleState) => void;
};

const UNDO_HISTORY_LIMIT = 30;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

export class PuzzleManager {
  private state: PuzzleState;
  private drag: DragState;
  private zCounter = 10;
  private readonly undoManager = new UndoManager(UNDO_HISTORY_LIMIT);
  private readonly events: PuzzleManagerEvents;

  private boardWidth: number;
  private boardHeight: number;
  private snapTolerancePx: number;
  private rotationStepDeg: 90 | 180;
  private scatterStartYRatio: number;

  private pieceLockingEnabled = false;

  private pad: number;
  private tileW: number;
  private tileH: number;

  private readonly targetStartX = 0;
  private readonly targetStartY = 0;

  constructor(options: PuzzleManagerOptions, events: PuzzleManagerEvents = {}) {
    const {
      imageUrl,
      boardWidth,
      boardHeight,
      grid,
      pieceWidth,
      pieceHeight,
      pad = 18,
      scatterPadding = 24,
      scatterStartYRatio = 0.3,
      snapTolerancePx = 80,
      rotationStepDeg = 90,
    } = options;

    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapTolerancePx = snapTolerancePx;
    this.scatterStartYRatio = scatterStartYRatio;
    this.rotationStepDeg = rotationStepDeg;

    const minPad = Math.ceil(Math.min(pieceWidth, pieceHeight) * 0.22);
    this.pad = Math.max(pad, minPad);
    this.tileW = pieceWidth;
    this.tileH = pieceHeight;

    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };

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
    }).map((p) => ({
      ...p,
      locked: p.locked ?? false, // ✅ normalize
    }));

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

  /* ---------- helpers ---------- */

  private isLocked(p: Piece) {
    return p.locked === true;
  }

  private findPiece(id: string) {
    return this.state.pieces.find((p) => p.id === id) ?? null;
  }

  private getGroupPieces(groupId: string) {
    return this.state.pieces.filter((p) => p.groupId === groupId);
  }

  private tilePos(p: Piece) {
    return { x: p.x + p.pad, y: p.y + p.pad };
  }

  private updatePieces(
    pred: (p: Piece) => boolean,
    fn: (p: Piece) => Partial<Piece>,
  ) {
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        pred(p) ? { ...p, ...fn(p) } : p,
      ),
    };
  }

  /* ---------- public API ---------- */

  getState(): PuzzleState {
    return this.state;
  }

  getDragState(): DragState {
    return this.drag;
  }

  setPieceLockingEnabled(enabled: boolean) {
    this.pieceLockingEnabled = enabled;
  }

  canUndo() {
    return this.undoManager.canUndo() && !this.state.isComplete;
  }

  undo() {
    if (!this.canUndo()) return false;
    const snapshot = this.undoManager.pop();
    if (!snapshot) return false;
    this.restoreFromSaved(snapshot);
    return true;
  }

  pushUndoState() {
    if (!this.state.isComplete) {
      this.undoManager.push(this.state.pieces);
    }
  }

  /* ---------- movement ---------- */

  pointerDown(pieceId: string, clientX: number, clientY: number, rect: DOMRect) {
    const piece = this.findPiece(pieceId);
    if (!piece || piece.isPlaced || this.isLocked(piece)) return;

    this.pushUndoState();

    this.zCounter++;
    this.updatePieces(
      (p) => p.groupId === piece.groupId,
      () => ({ z: this.zCounter }),
    );

    this.drag = {
      activeId: pieceId,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      preview: null,
    };
  }

  pointerMove(clientX: number, clientY: number, boardRect: DOMRect) {
    if (!this.drag.activeId) return;

    const piece = this.findPiece(this.drag.activeId);
    if (!piece) return;

    const dx = clientX - boardRect.left - this.drag.offsetX - piece.x;
    const dy = clientY - boardRect.top - this.drag.offsetY - piece.y;

    this.shiftGroup(piece.groupId, dx, dy);
  }

  pointerUp() {
    if (!this.drag.activeId) return;

    this.trySnapActiveGroupToNeighbor();
    this.trySnapActiveGroupToBoard();

    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.recomputeDerivedState();
  }

  /* ---------- snapping ---------- */

  private trySnapActiveGroupToBoard() {
    const id = this.drag.activeId;
    if (!id) return false;

    const p = this.findPiece(id);
    if (!p || this.isLocked(p)) return false;

    const tile = this.tilePos(p);
    const dx = p.targetX - tile.x;
    const dy = p.targetY - tile.y;

    if (Math.hypot(dx, dy) > this.snapTolerancePx) return false;

    this.shiftGroupUnclamped(p.groupId, Math.round(dx), Math.round(dy));

    this.updatePieces(
      (x) => x.groupId === p.groupId,
      (x) => ({
        locked: this.pieceLockingEnabled || x.locked,
        justSnapped: true,
      }),
    );

    this.events.onPiecePlaced?.(p);
    return true;
  }

  private trySnapActiveGroupToNeighbor() {
    const id = this.drag.activeId;
    if (!id) return false;

    const active = this.findPiece(id);
    if (!active || active.isPlaced) return false;

    let best:
      | { dx: number; dy: number; dist: number; into: string }
      | null = null;

    for (const p of this.getGroupPieces(active.groupId)) {
      for (const n of getSolvedNeighborsUtil(this.state.pieces, p)) {
        if (n.groupId === p.groupId) continue;

        const gp = this.tilePos(p);
        const nt = this.tilePos(n);

        const dx = nt.x - gp.x - (n.col - p.col) * this.tileW;
        const dy = nt.y - gp.y - (n.row - p.row) * this.tileH;
        const d = Math.hypot(dx, dy);

        if (d <= this.snapTolerancePx && (!best || d < best.dist)) {
          best = { dx, dy, dist: d, into: n.groupId };
        }
      }
    }

    if (!best) return false;

    this.shiftGroupUnclamped(active.groupId, Math.round(best.dx), Math.round(best.dy));
    this.mergeGroups(active.groupId, best.into);
    this.events.onPieceSnapped?.();
    return true;
  }

  /* ---------- misc ---------- */

  private mergeGroups(from: string, into: string) {
    if (from === into) return;
    this.updatePieces((p) => p.groupId === from, () => ({ groupId: into }));
  }

  private shiftGroup(groupId: string, dx: number, dy: number) {
    const b = getGroupBoundsUtil(this.state.pieces, groupId);
    if (!b) return;

    this.updatePieces(
      (p) => p.groupId === groupId,
      (p) => ({
        x: p.x + clamp(dx, -this.pad - b.minX, this.boardWidth + this.pad - b.maxX),
        y: p.y + clamp(dy, -this.pad - b.minY, this.boardHeight + this.pad - b.maxY),
      }),
    );
  }

  private shiftGroupUnclamped(groupId: string, dx: number, dy: number) {
    this.updatePieces(
      (p) => p.groupId === groupId,
      (p) => ({ x: p.x + dx, y: p.y + dy }),
    );
  }

  restoreFromSaved(saved: SavedPiece[]) {
    const map = new Map(saved.map((p) => [p.id, p]));

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => {
        const s = map.get(p.id);
        return s
          ? { ...p, ...s, locked: s.locked ?? false }
          : p;
      }),
    };

    this.recomputeDerivedState();
  }

  private recomputeDerivedState() {
    const pieces = this.state.pieces.filter((p) => !p.inTray);
    const placedCount = Math.max(
      ...pieces.map((p) => this.getGroupPieces(p.groupId).length),
      0,
    );

    const isComplete =
      pieces.length > 0 &&
      pieces.every((p) => p.groupId === pieces[0].groupId) &&
      pieces.every((p) => p.rotation === p.targetRotation);

    this.state = { ...this.state, placedCount, isComplete };

    if (isComplete) this.events.onPuzzleComplete?.(this.state);
  }
}