import type React from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "../useHaptics";

export type CanvasWithTouch = HTMLCanvasElement & {
  touchStartX?: number;
  touchStartY?: number;
  touchDragStarted?: boolean;
  pendingPieceId?: PieceId | null;
  pendingPieceRect?: DOMRect | null;
};

export const TAP_DRAG_THRESHOLD_PX = 6;

export type DragPreviewState = {
  clientX: number;
  clientY: number;
  pieceId: PieceId;
} | null;

export type PointerHandlersContext = {
  manager: PuzzleManager | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  trayRef: React.RefObject<HTMLDivElement | null>;
  selectedIdRef: React.MutableRefObject<PieceId | null>;
  setSelectedPieceId: (id: PieceId | null) => void;
  bump: () => void;
  didDragRef: React.MutableRefObject<boolean>;
  selectCycle: (dir: 1 | -1) => void;
  setState: (st: PuzzleState) => void;
  haptic?: (kind: HapticKind) => void;
  onDragPreview?: (state: DragPreviewState) => void;
};
