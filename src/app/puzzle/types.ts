// src/app/puzzle/types.ts

export type PieceId = string;

export type GridSize = {
  rows: number;
  cols: number;
};

export type EdgeType = "flat" | "tab" | "blank";

export type PieceEdges = {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
};

export type Piece = {
  id: PieceId;

  // current position (top-left of the piece container)
  x: number;
  y: number;

  // z-index stacking
  z: number;

  // container size including padding for tabs
  w: number;
  h: number;

  // target position (top-left of the piece container)
  targetX: number;
  targetY: number;

  isPlaced: boolean;

  // grid metadata
  row: number;
  col: number;

  // base tile size (the "real" rectangle before tabs)
  tileW: number;
  tileH: number;

  // padding around tile where tabs can extend
  pad: number;

  // edge definitions
  edges: PieceEdges;

  // svg path for the piece outline (in the piece local coordinates)
  shapePath: string;

  // tiny visual cue after snapping
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
