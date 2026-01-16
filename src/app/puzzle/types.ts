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

  // grid identity (neighbor relationships)
  row: number;
  col: number;

  // current position (top-left) of the PIECE CONTAINER in board space
  x: number;
  y: number;

  // draw order
  z: number;

  // container size INCLUDING pad
  w: number;
  h: number;

  // tile size (the image tile) excluding pad
  tileW: number;
  tileH: number;

  // padding around the tile inside the container
  pad: number;

  // correct TILE position (top-left) in assembled space (no pad)
  targetX: number;
  targetY: number;

  // rotation state
  rotation: number;
  targetRotation: number;

  // placed/locked state (once placed, group is locked)
  isPlaced: boolean;

  // group id for "lock together" clusters
  groupId: string;

  // snap animation trigger
  justSnapped: boolean;

  // SVG path silhouette in viewBox coordinates (0..w,0..h)
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