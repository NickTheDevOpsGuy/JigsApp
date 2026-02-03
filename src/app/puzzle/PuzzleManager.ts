import type { DragState, GridSize, Piece, PuzzleState } from "./types";
import { createInitialPieces } from "./factories/createInitialPieces";
import type { SavedPiece } from "./puzzleStorage";
import { UndoManager } from "./undoManager";

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
  snapTolerancePx?: number;
  rotationStepDeg?: 90 | 180;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  onPieceSnapped?: () => void;
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

  private snapTolerancePx: number;
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
      snapTolerancePx = 40,
      scatterStartYRatio = 0.3,
      rotationStepDeg = 90,
    } = options;

    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapTolerancePx = snapTolerancePx;
    this.scatterStartYRatio = scatterStartYRatio;
    this.rotationStepDeg = rotationStepDeg;
    this.pad = pad;
    this.tileW = pieceWidth;
    this.tileH = pieceHeight;

    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.zCounter = 10;

    const pieces = createInitialPieces({
      grid,
      boardWidth,
      boardHeight,
      scatterPadding,
      pad,
      tileW: pieceWidth,
      tileH: pieceHeight,
      scatterStartYRatio,
      rotationStepDeg,
      targetStartX: this.targetStartX,
      targetStartY: this.targetStartY,
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

  private isPieceCorrect(p: Piece) {
    if (p.rotation !== p.targetRotation) return false;
    const tile = this.tilePos(p);
    return p.targetX === Math.round(tile.x) && p.targetY === Math.round(tile.y);
  }

  private recomputeDerivedState() {
    const allPieces = this.state.pieces;
    if (allPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    const boardPieces = allPieces.filter((p) => !p.inTray);

    const groupCounts = new Map<string, number>();
    for (const p of boardPieces) {
      groupCounts.set(p.groupId, (groupCounts.get(p.groupId) || 0) + 1);
    }

    const largestGroupSize = Math.max(...groupCounts.values(), 0);

    if (boardPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    const firstPiece = boardPieces[0];
    const allSameGroup = boardPieces.every((p) => p.groupId === firstPiece.groupId);
    const allCorrectRotation = boardPieces.every((p) => p.rotation === p.targetRotation);
    const noTrayPieces = boardPieces.length === allPieces.length;

    // Win condition: all pieces snapped together in one group with correct rotation
    // No need to check exact board position - if they're all connected correctly, puzzle is solved
    const isComplete = allSameGroup && allCorrectRotation && noTrayPieces;
    const prevComplete = this.state.isComplete;

    this.state = {
      ...this.state,
      placedCount: largestGroupSize,
      isComplete,
    };

    if (!prevComplete && isComplete) {
      // Snap the completed puzzle to the correct board position
      const ref = boardPieces[0];
      const tile = this.tilePos(ref);
      const dx = ref.targetX - tile.x;
      const dy = ref.targetY - tile.y;
      if (dx !== 0 || dy !== 0) {
        this.shiftGroupUnclamped(ref.groupId, Math.round(dx), Math.round(dy));
      }

      this.state = {
        ...this.state,
        pieces: this.state.pieces.map((p) => ({ ...p, isPlaced: true })),
      };
      this.events.onPuzzleComplete?.(this.state);
    }
  }

  /* ---------------- Utilities ---------------- */

  private tilePos(p: Piece) {
    return { x: p.x + p.pad, y: p.y + p.pad };
  }

  private getGroupPieces(groupId: string): Piece[] {
    return this.state.pieces.filter((p) => p.groupId === groupId);
  }

  private shiftGroupUnclamped(groupId: string, dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === groupId
          ? { ...p, x: p.x + Math.round(dx), y: p.y + Math.round(dy) }
          : p,
      ),
    };
  }

  private getGroupBounds(groupId: string) {
    const ps = this.getGroupPieces(groupId);
    if (!ps.length) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const p of ps) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    }

    return { minX, minY, maxX, maxY };
  }

  private shiftGroup(groupId: string, dx: number, dy: number) {
    const clamped = this.clampGroupDelta(groupId, dx, dy);
    if (clamped.dx === 0 && clamped.dy === 0) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === groupId ? { ...p, x: p.x + clamped.dx, y: p.y + clamped.dy } : p,
      ),
    };
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
    const groupPieces = this.getGroupPieces(groupId);
    const otherPieces = this.state.pieces.filter(
      (p) => p.groupId !== groupId && !p.inTray,
    );

    for (const gp of groupPieces) {
      const gpX = gp.x + dx;
      const gpY = gp.y + dy;
      const gpRight = gpX + gp.w;
      const gpBottom = gpY + gp.h;

      for (const op of otherPieces) {
        const opRight = op.x + op.w;
        const opBottom = op.y + op.h;

        // Check for overlap
        if (!(gpRight <= op.x || gpX >= opRight || gpBottom <= op.y || gpY >= opBottom)) {
          return true;
        }
      }
    }

    return false;
  }

  private getSolvedNeighbors(piece: Piece): Piece[] {
    const byRC = (r: number, c: number) =>
      this.state.pieces.find((p) => p.row === r && p.col === c) ?? null;

    return [
      byRC(piece.row - 1, piece.col),
      byRC(piece.row + 1, piece.col),
      byRC(piece.row, piece.col - 1),
      byRC(piece.row, piece.col + 1),
    ].filter(Boolean) as Piece[];
  }

  private mergeGroups(from: string, into: string) {
    if (from === into) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === from ? { ...p, groupId: into } : p,
      ),
    };
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
    this.restoreFromSaved(snapshot);
    return true;
  }

  canUndo(): boolean {
    return this.undoManager.canUndo() && !this.state.isComplete;
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

    // Rotate all pieces in the group
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => {
        if (p.groupId === piece.groupId) {
          const newRotation = (p.rotation + this.rotationStepDeg) % 360;
          return { ...p, rotation: newRotation };
        }
        return p;
      }),
    };
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

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, inTray: true } : p,
      ),
    };
  }

  movePieceFromTray(pieceId: string) {
    const piece = this.findPiece(pieceId);
    if (!piece || !piece.inTray) return;

    this.pushUndoState();

    const x = this.rand(16, Math.max(16, this.boardWidth - piece.w - 16));
    const y = this.rand(16, Math.max(16, this.boardHeight - piece.h - 16));

    this.zCounter += 1;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, inTray: false, x, y, z: this.zCounter } : p,
      ),
    };
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

    // Bring group to front
    this.zCounter += 1;
    const newZ = this.zCounter;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === piece.groupId ? { ...p, z: newZ } : p,
      ),
    };

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

  public pointerUp() {
    if (!this.drag.activeId) return;

    // Try neighbor snap first (connect pieces), then board snap (align to grid).
    // Order matters: board-then-neighbor could undo the board snap by aligning to a floating neighbor.
    this.trySnapActiveGroupToNeighbor();
    this.trySnapActiveGroupToBoard();

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
    // Restore piece positions from saved state
    const pieceMap = new Map(savedPieces.map((p) => [p.id, p]));

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => {
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

    if (Math.hypot(dx, dy) > this.snapTolerancePx) return false;
    if (this.wouldOverlapAnyOtherGroup(gid, dx, dy)) return false;

    this.shiftGroupUnclamped(gid, Math.round(dx), Math.round(dy));

    // Mark as snapped for visual feedback, but don't set isPlaced
    // (isPlaced is only set when entire puzzle is complete)
    // When piece locking is enabled, lock all pieces in the snapped group
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === gid
          ? { ...p, justSnapped: true, locked: this.pieceLockingEnabled || p.locked }
          : p,
      ),
    };
    this.events.onPiecePlaced?.(active);

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

    let best: null | { dx: number; dy: number; dist: number; into: string } = null;

    for (const gp of groupPieces) {
      for (const n of this.getSolvedNeighbors(gp)) {
        if (n.groupId === gid || n.rotation !== 0) continue;

        const gpTile = this.tilePos(gp);
        const nTile = this.tilePos(n);

        const expectedDx = (n.col - gp.col) * this.tileW;
        const expectedDy = (n.row - gp.row) * this.tileH;

        const dx = nTile.x - expectedDx - gpTile.x;
        const dy = nTile.y - expectedDy - gpTile.y;
        const d = Math.hypot(dx, dy);

        if (d <= this.snapTolerancePx && (!best || d < best.dist)) {
          best = { dx, dy, dist: d, into: n.groupId };
        }
      }
    }

    if (!best) return false;

    this.shiftGroupUnclamped(gid, Math.round(best.dx), Math.round(best.dy));
    this.mergeGroups(gid, best.into);

    // When piece locking is enabled, lock all pieces in the merged group
    if (this.pieceLockingEnabled) {
      this.state = {
        ...this.state,
        pieces: this.state.pieces.map((p) =>
          p.groupId === best.into ? { ...p, locked: true } : p,
        ),
      };
    }

    this.trySnapMergedGroupToBoard(best.into);
    this.events.onPieceSnapped?.();

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
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
