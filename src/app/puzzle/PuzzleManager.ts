import type { DragState, GridSize, Piece, PieceId, PuzzleState } from '../puzzle/types';

export type PuzzleManagerOptions = {
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;

  // How many pieces you want for MVP
  grid: GridSize;

  // Piece size in px for now (we are not slicing yet)
  pieceWidth: number;
  pieceHeight: number;

  // Where pieces start (simple scatter region)
  scatterPadding?: number;

  // Snapping tolerance (used later, but we include it now)
  snapTolerancePx?: number;
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
    } = options;

    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapTolerancePx = snapTolerancePx;

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
      placedCount: pieces.filter((p) => p.isPlaced).length,
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

    // Clamp all pieces into the new bounds
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => {
        const maxX = Math.max(0, this.boardWidth - p.w);
        const maxY = Math.max(0, this.boardHeight - p.h);
        return {
          ...p,
          x: clamp(p.x, 0, maxX),
          y: clamp(p.y, 0, maxY),
        };
      }),
    };

    this.recomputeDerivedState();
  }

  pointerDown(pieceId: PieceId, pointerX: number, pointerY: number, pieceRect: DOMRect) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;

    if (piece.isPlaced) {
      // For MVP, placed pieces are locked. Later you can add "unsnap" rules.
      return;
    }

    this.drag = {
      activeId: pieceId,
      offsetX: pointerX - pieceRect.left,
      offsetY: pointerY - pieceRect.top,
    };

    this.zCounter += 1;
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => (p.id === pieceId ? { ...p, z: this.zCounter } : p)),
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
      pieces: this.state.pieces.map((p) => (p.id === activeId ? { ...p, x: nextX, y: nextY } : p)),
    };
  }

  pointerUp() {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    // Future: snapping goes here in #6. For now, just drop.
    // We still recompute derived state for safety.
    this.drag = { activeId: null, offsetX: 0, offsetY: 0 };
    this.recomputeDerivedState();
  }

  // This will be used in #6
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
    };

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => (p.id === piece.id ? snapped : p)),
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

    // Target positions: a simple grid layout within the board
    // For MVP we place the targets starting at (16, 16)
    const targetStartX = 16;
    const targetStartY = 16;

    const pieces: Piece[] = [];

    for (let i = 0; i < total; i++) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);

      const targetX = targetStartX + col * pieceWidth;
      const targetY = targetStartY + row * pieceHeight;

      // Scatter start positions near the bottom area (roughly)
      const scatterMinX = scatterPadding;
      const scatterMaxX = Math.max(scatterPadding, this.boardWidth - pieceWidth - scatterPadding);

      const scatterMinY = Math.max(scatterPadding, this.boardHeight * 0.55);
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
      });
    }

    return pieces;
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}