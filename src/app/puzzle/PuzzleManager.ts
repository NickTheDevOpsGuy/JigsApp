// src/app/puzzle/PuzzleManager.ts

import type { DragState, GridSize, Piece, PieceId, PuzzleState } from "./types";

export type PuzzleManagerOptions = {
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;
  grid: GridSize;
  pieceWidth: number;
  pieceHeight: number;
  scatterPadding?: number;
  snapTolerancePx?: number;

  // Optional: where scatter starts as ratio of board height (0.0 top → 1.0 bottom)
  scatterStartYRatio?: number;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  onPuzzleComplete?: (state: PuzzleState) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export class PuzzleManager {
  private state: PuzzleState;
  private drag: DragState;
  private zCounter: number;
  private events: PuzzleManagerEvents;

  private boardWidth: number;
  private boardHeight: number;
  private snapTolerancePx: number;

  // Scatter tuning
  private scatterStartYRatio: number;

  constructor(options: PuzzleManagerOptions, events: PuzzleManagerEvents = {}) {
    const {
      imageUrl,
      boardWidth,
      boardHeight,
      grid,
      pieceWidth,
      pieceHeight,
      scatterPadding = 16,
      snapTolerancePx = 18,
      scatterStartYRatio = 0.3,
    } = options;

    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapTolerancePx = snapTolerancePx;

    this.scatterStartYRatio = scatterStartYRatio;

    this.drag = { activeId: null, offsetX: 0, offsetY: 0 };
    this.zCounter = 10;

    const pieces = this.createPieces({
      grid,
      pieceWidth,
      pieceHeight,
      scatterPadding,
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

  getState(): PuzzleState {
    return this.state;
  }

  getDragState(): DragState {
    return this.drag;
  }

  setBoardSize(boardWidth: number, boardHeight: number) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((piece) => {
        const maxX = Math.max(0, this.boardWidth - piece.w);
        const maxY = Math.max(0, this.boardHeight - piece.h);
        return {
          ...piece,
          x: clamp(piece.x, 0, maxX),
          y: clamp(piece.y, 0, maxY),
        };
      }),
    };

    this.recomputeDerivedState();
  }

  pointerDown(pieceId: PieceId, pointerX: number, pointerY: number, pieceRect: DOMRect) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;

    if (piece.isPlaced) return;

    this.drag = {
      activeId: pieceId,
      offsetX: pointerX - pieceRect.left,
      offsetY: pointerY - pieceRect.top,
    };

    this.zCounter += 1;
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, z: this.zCounter } : p
      ),
    };
  }

  pointerMove(pointerX: number, pointerY: number, boardRect: DOMRect) {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const piece = this.findPiece(activeId);
    if (!piece) return;

    const rawX = pointerX - boardRect.left - this.drag.offsetX;
    const rawY = pointerY - boardRect.top - this.drag.offsetY;

    const maxX = Math.max(0, this.boardWidth - piece.w);
    const maxY = Math.max(0, this.boardHeight - piece.h);

    const nextX = clamp(rawX, 0, maxX);
    const nextY = clamp(rawY, 0, maxY);

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === activeId ? { ...p, x: nextX, y: nextY } : p
      ),
    };
  }

  pointerUp() {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    // Attempt snap BEFORE clearing drag (trySnapActivePiece reads drag.activeId)
    const snapped = this.trySnapActivePiece();

    // Always release drag
    this.drag = { activeId: null, offsetX: 0, offsetY: 0 };

    // If we didn't snap, still recompute derived state
    // (trySnapActivePiece already recomputes when it snaps)
    if (!snapped) {
      this.recomputeDerivedState();
    }
  }

  // Called by UI after the snap-pop animation ends
  clearJustSnapped(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;

    if (!piece.justSnapped) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, justSnapped: false } : p
      ),
    };
  }

  trySnapActivePiece(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const piece = this.findPiece(activeId);
    if (!piece || piece.isPlaced) return false;

    const dx = piece.x - piece.targetX;
    const dy = piece.y - piece.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.snapTolerancePx) return false;

    const snapped: Piece = {
      ...piece,
      x: piece.targetX,
      y: piece.targetY,
      isPlaced: true,

      // Visual cue trigger
      justSnapped: true,
    };

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => (p.id === snapped.id ? snapped : p)),
    };

    this.events.onPiecePlaced?.(snapped);
    this.recomputeDerivedState();
    return true;
  }

  private recomputeDerivedState() {
    const placedCount = this.state.pieces.filter((p) => p.isPlaced).length;
    const isComplete = placedCount === this.state.totalCount;

    const prevComplete = this.state.isComplete;

    this.state = {
      ...this.state,
      placedCount,
      isComplete,
    };

    if (!prevComplete && isComplete) {
      this.events.onPuzzleComplete?.(this.state);
    }
  }

  private findPiece(id: PieceId) {
    return this.state.pieces.find((p) => p.id === id) ?? null;
  }

  private createPieces(args: {
    grid: GridSize;
    pieceWidth: number;
    pieceHeight: number;
    scatterPadding: number;
  }): Piece[] {
    const { grid, pieceWidth, pieceHeight, scatterPadding } = args;

    const total = grid.cols * grid.rows;

    // Targets start at (16,16) for now (matches your slice math in PlayScreen)
    const targetStartX = 16;
    const targetStartY = 16;

    const pieces: Piece[] = [];

    for (let i = 0; i < total; i++) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);

      const targetX = targetStartX + col * pieceWidth;
      const targetY = targetStartY + row * pieceHeight;

      const scatterMinX = scatterPadding;
      const scatterMaxX = Math.max(scatterPadding, this.boardWidth - pieceWidth - scatterPadding);

      const scatterMinY = Math.max(
        scatterPadding,
        Math.floor(this.boardHeight * this.scatterStartYRatio)
      );
      const scatterMaxY = Math.max(scatterMinY, this.boardHeight - pieceHeight - scatterPadding);

      const x = this.rand(scatterMinX, scatterMaxX);
      const y = this.rand(scatterMinY, scatterMaxY);

      pieces.push({
        id: `p${i + 1}`,
        x,
        y,
        z: 1,
        w: pieceWidth,
        h: pieceHeight,
        targetX,
        targetY,
        isPlaced: false,
        justSnapped: false,
      });
    }

    return pieces;
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}