// src/app/puzzle/PuzzleManager.ts
import type {
  DragState,
  EdgeType,
  GridSize,
  Piece,
  PieceEdges,
  PieceId,
  PuzzleState,
} from "./types";
import { buildPiecePath } from "./shape";

export type PuzzleManagerOptions = {
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;

  grid: GridSize;

  // Base tile size (not including tabs)
  tileWidth: number;
  tileHeight: number;

  scatterPadding?: number;
  snapTolerancePx?: number;

  // Where pieces should start vertically (0..1). 0.3 means above mid, 0.6 means lower.
  scatterStartYRatio?: number;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  onPuzzleComplete?: (state: PuzzleState) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function invertEdge(edge: EdgeType): EdgeType {
  if (edge === "tab") return "blank";
  if (edge === "blank") return "tab";
  return "flat";
}

function randomTabBlank(): EdgeType {
  return Math.random() < 0.5 ? "tab" : "blank";
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

  constructor(options: PuzzleManagerOptions, events: PuzzleManagerEvents = {}) {
    const {
      imageUrl,
      boardWidth,
      boardHeight,
      grid,
      tileWidth,
      tileHeight,
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
      tileWidth,
      tileHeight,
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

  clearJustSnapped(pieceId: PieceId) {
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, justSnapped: false } : p
      ),
    };
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

    // Try snapping before clearing drag
    const snapped = this.trySnapActivePiece();

    // Always release drag
    this.drag = { activeId: null, offsetX: 0, offsetY: 0 };

    if (!snapped) {
      this.recomputeDerivedState();
    }
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

  private createEdges(grid: GridSize): PieceEdges[][] {
    const edges: PieceEdges[][] = Array.from({ length: grid.rows }, () =>
      Array.from({ length: grid.cols }, () => ({
        top: "flat" as EdgeType,
        right: "flat" as EdgeType,
        bottom: "flat" as EdgeType,
        left: "flat" as EdgeType,
      }))
    );

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const e = edges[r][c];

        // Top
        if (r === 0) e.top = "flat";
        else e.top = invertEdge(edges[r - 1][c].bottom);

        // Left
        if (c === 0) e.left = "flat";
        else e.left = invertEdge(edges[r][c - 1].right);

        // Right
        if (c === grid.cols - 1) e.right = "flat";
        else e.right = randomTabBlank();

        // Bottom
        if (r === grid.rows - 1) e.bottom = "flat";
        else e.bottom = randomTabBlank();
      }
    }

    return edges;
  }

  private createPieces(args: {
    grid: GridSize;
    tileWidth: number;
    tileHeight: number;
    scatterPadding: number;
  }): Piece[] {
    const { grid, tileWidth, tileHeight, scatterPadding } = args;

    const edgesGrid = this.createEdges(grid);

    // Pad lets tabs extend outside the tile
    const pad = Math.round(Math.min(tileWidth, tileHeight) * 0.22);
    const pieceW = tileWidth + pad * 2;
    const pieceH = tileHeight + pad * 2;

    // Targets start at 16,16 like your current system
    const targetStartX = 16;
    const targetStartY = 16;

    const total = grid.cols * grid.rows;
    const pieces: Piece[] = [];

    for (let i = 0; i < total; i++) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);

      const edges = edgesGrid[row][col];
      const shapePath = buildPiecePath({
        tileW: tileWidth,
        tileH: tileHeight,
        pad,
        edges,
      });

      // target position for the piece container
      const targetX = targetStartX + col * tileWidth;
      const targetY = targetStartY + row * tileHeight;

      // Scatter region
      const scatterMinX = scatterPadding;
      const scatterMaxX = Math.max(
        scatterPadding,
        this.boardWidth - pieceW - scatterPadding
      );

      const scatterMinY = Math.max(
        scatterPadding,
        Math.floor(this.boardHeight * this.scatterStartYRatio)
      );
      const scatterMaxY = Math.max(
        scatterMinY,
        this.boardHeight - pieceH - scatterPadding
      );

      const x = this.rand(scatterMinX, scatterMaxX);
      const y = this.rand(scatterMinY, scatterMaxY);

      pieces.push({
        id: `p${i + 1}`,
        x,
        y,
        z: 1,
        w: pieceW,
        h: pieceH,
        targetX,
        targetY,
        isPlaced: false,
        row,
        col,
        tileW: tileWidth,
        tileH: tileHeight,
        pad,
        edges,
        shapePath,
        justSnapped: false,
      });
    }

    return pieces;
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}