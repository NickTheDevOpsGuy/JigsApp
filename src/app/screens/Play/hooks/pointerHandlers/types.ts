/**
 * Pointer handler types: CanvasWithTouch, ScreenToBoard, thresholds.
 */
import type React from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "../useHaptics";

export type CanvasWithTouch = HTMLCanvasElement & {
  touchStartX?: number;
  touchStartY?: number;
  touchStartTime?: number;
  touchDragStarted?: boolean;
  pendingPieceId?: PieceId | null;
  pendingPieceRect?: DOMRect | null;
};

/** Max movement (px) before touch is treated as drag instead of tap. */
export const TAP_DRAG_THRESHOLD_PX = 8;

/** Larger threshold for touch (coarse pointer) – fingers less precise than mouse. */
export const TAP_DRAG_THRESHOLD_TOUCH_PX = 14;

/** Max duration (ms) for touch down→up to count as a tap (avoids slow-tap/hesitation). */
export const TAP_MAX_MS = 350;

export type DragPreviewState = {
  clientX: number;
  clientY: number;
  pieceId: PieceId;
} | null;

export type ScreenToBoard = (
  clientX: number,
  clientY: number,
  boardRect: DOMRect,
) => { x: number; y: number };

export type PointerHandlersContext = {
  /** Pointer that started the current piece drag; only its move/up events are processed. */
  activePointerIdRef: React.MutableRefObject<number | null>;
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
  onPieceInteraction?: () => void;
  /** Called when a piece drag starts (mouse down or touch move past threshold). */
  onDragStarted?: () => void;
  /** Called when drag ends (pointer up). */
  onDragEnded?: () => void;
  /** When set, use board-space API for zoom/pan viewport */
  screenToBoard?: ScreenToBoard;
  /** Tap-vs-drag threshold in px (touch uses larger value for finger imprecision). */
  tapDragThresholdPx?: number;
  /** When true, expand tray hit area for easier drop-to-tray. */
  isCoarsePointer?: boolean;
  /** Timestamp of last tap-rotate; used to avoid click+touch double fire. */
  lastTapRotateTimeRef?: React.MutableRefObject<number>;
  /** When set, rotation easing anim runs; animation loop reads this. */
  rotationAnimRef?: React.MutableRefObject<{
    pieceIds: string[];
    from: number;
    to: number;
    startMs: number;
  } | null>;
};
