/**
 * Types shared by renderBoard and renderBoardDraw.
 */

export type PopMap = Map<string, number>;
export type LockMap = Map<string, number>;

export type ViewportTransform = { scale: number; panX: number; panY: number };

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
  showPerfOverlay?: boolean;
  /** When true, render pieces as solid color + black outline only (no image). Confirms silhouettes, no seams. */
  showSilhouette?: boolean;
};

export type AnimationState = {
  draggedGroupId: string | null;
  hoveredPieceId: string | null;
  selectedPieceId: string | null;
  isComplete: boolean;
  completedAtMs: number | null;
  showGhostHint?: boolean;
  ghostAlpha?: number;
  showEdgeHighlight?: boolean;
  showClusterOutline?: boolean;
  dragPreviewPieceId?: string | null;
  dragDisplayOverrides?: Map<string, { x: number; y: number }>;
  lockLerpOverrides?: Map<string, { x: number; y: number }>;
  undoSnapBackOverrides?: Map<string, { x: number; y: number }>;
  wrongRotationHint?: { groupId: string; pieceIds: string[]; triggeredAt: number };
  snapPreview?: {
    kind?: "board" | "neighbor";
    nearSnap: boolean;
    inSnapRange: boolean;
    proximity: number;
  } | null;
  /** Wrong rotation near home (board context); pairs with soft reject glow. */
  snapRejectPreview?: { proximity: number } | null;
  snapGlowEnabled?: boolean;
  reducedQuality?: boolean;
  showAlignmentGrid?: boolean;
  /** Fog modifier: alpha for unplaced pieces (0 = clear, 0.5 = foggy). Placed pieces stay clear. */
  fogAlphaForUnplaced?: number;
  /** When hovering a piece: empty (row,col) slots adjacent to placed pieces – potential snap targets. */
  hoverSnapTargetSlots?: { row: number; col: number }[];
  /** After idle: soft pulse on this piece id (must be drawn in piece-local path space). */
  idleCorrectPulsePieceId?: string | null;
  /** Hovered/selected piece id: draw faint ghosts at target for that group (when global ghost hint off). */
  placementPreviewPieceId?: string | null;
  placementPreviewAlpha?: number;
};

export type PieceCache = Map<string, HTMLCanvasElement>;

/** Cache Path2D per piece.id so we create each shape once and reuse (avoids pause on load). */
export type PathCache = Map<string, Path2D>;
