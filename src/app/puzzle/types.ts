// src/app/puzzle/types.ts

export type EdgeType = "flat" | "tab" | "blank";

export type PieceId = string;

export type GridSize = {
  rows: number;
  cols: number;
};

export type Piece = {
  id: PieceId;

  // current position (top-left) in board space
  x: number;
  y: number;

  // draw order
  z: number;

  // piece size (px)
  w: number;
  h: number;

  // correct position (top-left) in board space
  targetX: number;
  targetY: number;

  // rotation state
  rotation: number;
  targetRotation: number;

  // placed (locked) state
  isPlaced: boolean;

  // small visual cue trigger
  justSnapped?: boolean;

  // SVG path for the jigsaw silhouette (in the piece's own viewBox space: 0..w, 0..h)
  shapePath: string;
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

export type PieceEdges = {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
};
