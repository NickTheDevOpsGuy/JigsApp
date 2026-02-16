/**
 * types – Piece, GridSize, PieceEdges, PuzzleState, DragState, etc.
 */
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

  // Grid identity (used for solved-neighbor relationships)
  row: number;
  col: number;

  /**
   * Current position of the PIECE CONTAINER in board space.
   * The container includes pad around the tile.
   */
  x: number;
  y: number;

  // draw order
  z: number;

  /**
   * Container size INCLUDING pad.
   * This is also the SVG viewBox size (0..w, 0..h).
   */
  w: number;
  h: number;

  // Tile size (image content) excluding pad
  tileW: number;
  tileH: number;

  /**
   * Padding around the tile inside the container.
   * The tile top-left in board space is (x + pad, y + pad).
   */
  pad: number;

  /**
   * Correct TILE position (top-left) in assembled space (NO pad).
   * The container is correct when:
   *   x + pad === targetX
   *   y + pad === targetY
   */
  targetX: number;
  targetY: number;

  // rotation state
  rotation: number;
  targetRotation: number;

  /**
   * Once a group is placed (board solved snap), we lock it.
   * Option A still treats ALL groups as "solid" for collisions while dragging,
   * but placed groups also cannot be dragged at all.
   */
  isPlaced: boolean;

  /**
   * When piece locking is enabled, pieces that snap to correct position are locked.
   * Locked pieces cannot be dragged, rotated, or sent to tray.
   */
  locked: boolean;

  /**
   * Group id for clusters. Pieces in same group move together.
   * Neighbor snap merges groups.
   */
  groupId: string;

  // Visual snap cue trigger (pop animation)
  justSnapped: boolean;

  // SVG path for jigsaw silhouette in viewBox coordinates (0..w, 0..h)
  shapePath: string;

  // Tray management
  inTray: boolean;
  edges: PieceEdges; // Store edge configuration for tray sorting
};

// "Magnet" preview for the currently dragged group.
// Computed during dragging to show where the group would snap if released now.
export type DragPreview = null | {
  kind: "board" | "neighbor";
  groupId: string;
  dx: number;
  dy: number;
  intoGroupId?: string;
};

export type DragState = {
  activeId: PieceId | null;
  offsetX: number;
  offsetY: number;
  preview: DragPreview;
};

export type PuzzleState = {
  imageUrl: string;
  grid: GridSize;
  pieces: Piece[];
  placedCount: number;
  totalCount: number;
  isComplete: boolean;
};
