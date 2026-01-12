// src/app/puzzle/types.ts

export type PieceId = string;

export type GridSize = {
  rows: number;
  cols: number;
};

export type Piece = {
  id: PieceId;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  targetX: number;
  targetY: number;
  isPlaced: boolean;
  justSnapped?: boolean;
};

export type DragState = {
  activeId: PieceId | null;
  offsetX: number;
  offsetY: number;
};

export type PuzzleState = {
  imageUrl: string;
  grid: GridSize;
  pieces: Piece[];
  placedCount: number;
  totalCount: number;
  isComplete: boolean;
};