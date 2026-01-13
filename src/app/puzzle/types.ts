// src/app/puzzle/types.ts

export type PieceId = string;

export type GridSize = {
  rows: number;
  cols: number;
};

export type Piece = {
  id: PieceId;

  // current position on board
  x: number;
  y: number;

  // draw order
  z: number;

  // size
  w: number;
  h: number;

  // where it belongs when solved
  targetX: number;
  targetY: number;

  // rotation in degrees (0, 90, 180, 270)
  rotation: number;

  // required rotation to be considered correct (for now 0)
  targetRotation: number;

  isPlaced: boolean;

  // used for tiny snap animation
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