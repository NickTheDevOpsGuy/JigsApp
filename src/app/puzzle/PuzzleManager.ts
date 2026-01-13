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

  // where to start scattering pieces vertically (0..1 of board height)
  scatterStartYRatio?: number;

  // rotation step (90 = classic)
  rotationStepDeg?: number;
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

  private scatterStartYRatio: number;
  private rotationStepDeg: number;

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
      rotationStepDeg = 90,
    } = options;

    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapTolerancePx = snapTolerancePx;

    this.scatterStartYRatio = scatterStartYRatio;
    this.rotationStepDeg = rotationStepDeg;

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
        p.id === pieceId ? { ...p, z: this.zCounter } : p,
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
        p.id === activeId ? { ...p, x: nextX, y: nextY } : p,
      ),
    };
  }

  pointerUp() {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    // Snap attempt must happen before clearing drag (snap uses drag.activeId)
    const snapped = this.trySnapActivePiece();

    // release drag
    this.drag = { activeId: null, offsetX: 0, offsetY: 0 };

    // If we didn't snap, still recompute derived state
    if (!snapped) {
      this.recomputeDerivedState();
    }
  }

  rotateActivePiece() {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const piece = this.findPiece(activeId);
    if (!piece || piece.isPlaced) return;

    const next = (piece.rotation + this.rotationStepDeg) % 360;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === piece.id ? { ...p, rotation: next } : p,
      ),
    };
  }

  rotatePiece(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece || piece.isPlaced) return;

    const next = (piece.rotation + this.rotationStepDeg) % 360;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === piece.id ? { ...p, rotation: next } : p,
      ),
    };
  }

  clearJustSnapped(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;

    if (!piece.justSnapped) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, justSnapped: false } : p,
      ),
    };
  }

  trySnapActivePiece(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const piece = this.findPiece(activeId);
    if (!piece || piece.isPlaced) return false;

    // Must match rotation too
    const rotOk =
      ((piece.rotation % 360) + 360) % 360 === ((piece.targetRotation % 360) + 360) % 360;
    if (!rotOk) return false;

    const dx = piece.x - piece.targetX;
    const dy = piece.y - piece.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.snapTolerancePx) return false;

    const snapped: Piece = {
      ...piece,
      x: piece.targetX,
      y: piece.targetY,
      isPlaced: true,
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

    const targetStartX = 16;
    const targetStartY = 16;

    const pieces: Piece[] = [];

    const shapePath = this.buildShapePath(pieceWidth, pieceHeight);

    for (let i = 0; i < total; i++) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);

      const targetX = targetStartX + col * pieceWidth;
      const targetY = targetStartY + row * pieceHeight;

      const scatterMinX = scatterPadding;
      const scatterMaxX = Math.max(
        scatterPadding,
        this.boardWidth - pieceWidth - scatterPadding,
      );

      const scatterMinY = Math.max(
        scatterPadding,
        Math.floor(this.boardHeight * this.scatterStartYRatio),
      );
      const scatterMaxY = Math.max(
        scatterMinY,
        this.boardHeight - pieceHeight - scatterPadding,
      );

      const x = this.rand(scatterMinX, scatterMaxX);
      const y = this.rand(scatterMinY, scatterMaxY);

      // rotation: start randomized; target is 0 for now (you can later randomize per-piece target)
      const startRotation =
        this.rand(0, 360 / this.rotationStepDeg - 1) * this.rotationStepDeg;

      pieces.push({
        id: `p${i + 1}`,
        x,
        y,
        z: 1,
        w: pieceWidth,
        h: pieceHeight,
        targetX,
        targetY,
        rotation: startRotation,
        targetRotation: 0,
        isPlaced: false,
        justSnapped: false,
        shapePath,
      });
    }

    return pieces;
  }

  private buildShapePath(w: number, h: number) {
    // MVP jigsaw-ish silhouette kept inside the piece bounds (no protrusions outside the SVG viewBox).
    // Later you can vary tabs per-edge based on piece neighbors (top/bottom/left/right).
    const k = Math.min(w, h) * 0.22; // tab size
    const midX = w / 2;
    const midY = h / 2;
    const a = k * 0.55; // curve amount
    const b = k * 0.35; // neck amount

    return [
      `M 0 ${k}`,
      `Q 0 0 ${k} 0`,

      `L ${midX - k} 0`,
      `C ${midX - b} 0 ${midX - a} ${k * 0.35} ${midX} ${k * 0.35}`,
      `C ${midX + a} ${k * 0.35} ${midX + b} 0 ${midX + k} 0`,
      `L ${w - k} 0`,

      `Q ${w} 0 ${w} ${k}`,

      `L ${w} ${midY - k}`,
      `C ${w} ${midY - b} ${w - k * 0.35} ${midY - a} ${w - k * 0.35} ${midY}`,
      `C ${w - k * 0.35} ${midY + a} ${w} ${midY + b} ${w} ${midY + k}`,
      `L ${w} ${h - k}`,

      `Q ${w} ${h} ${w - k} ${h}`,

      `L ${midX + k} ${h}`,
      `C ${midX + b} ${h} ${midX + a} ${h - k * 0.35} ${midX} ${h - k * 0.35}`,
      `C ${midX - a} ${h - k * 0.35} ${midX - b} ${h} ${midX - k} ${h}`,
      `L ${k} ${h}`,

      `Q 0 ${h} 0 ${h - k}`,

      `L 0 ${midY + k}`,
      `C 0 ${midY + b} ${k * 0.35} ${midY + a} ${k * 0.35} ${midY}`,
      `C ${k * 0.35} ${midY - a} 0 ${midY - b} 0 ${midY - k}`,

      `Z`,
    ].join(" ");
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
