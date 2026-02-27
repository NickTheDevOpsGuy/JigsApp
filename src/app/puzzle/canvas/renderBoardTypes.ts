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
  snapPreview?: { nearSnap: boolean; inSnapRange: boolean; proximity: number } | null;
  showAlignmentGrid?: boolean;
};

export type PieceCache = Map<string, HTMLCanvasElement>;
