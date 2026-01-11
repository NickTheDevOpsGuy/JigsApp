export type GridSize = {
  cols: number;
  rows: number;
};

export type PieceId = string;

export type Piece = {
  id: PieceId;

  // Current position on the board (px)
  x: number;
  y: number;

  // Render order
  z: number;

  // Dimensions (px)
  w: number;
  h: number;

  // Snap target (px)
  targetX: number;
  targetY: number;

  // Gameplay
  isPlaced: boolean;
};

export type PuzzleState = {
  imageUrl: string;
  grid: GridSize;
  pieces: Piece[];
  placedCount: number;
  totalCount: number;
  isComplete: boolean;
};

export type DragState = {
  activeId: PieceId | null;
  offsetX: number;
  offsetY: number;
};