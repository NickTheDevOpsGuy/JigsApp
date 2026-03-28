/**
 * Pointer handler types: CanvasWithTouch, ScreenToBoard, thresholds.
 */
import type React from "react";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/core/types";
import type { HapticKind } from "@/screens/Play/hooks/system/useHaptics";

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

/**
 * Dynamic tap/drag threshold for touch devices.
 * Slightly higher threshold on high-DPI/coarse pointers to reduce accidental drags.
 */
export function getTapDragThresholdPx(): number {
  if (typeof window === "undefined") return TAP_DRAG_THRESHOLD_PX;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  let threshold = TAP_DRAG_THRESHOLD_PX;
  if (isCoarse) threshold += 2;
  if (dpr >= 2.5) threshold += 1;
  return threshold;
}

/** Max duration (ms) for touch down→up to count as a tap (avoids slow-tap/hesitation). */
export const TAP_MAX_MS = 350;
/** Guard window after a touch drag ends; suppress tap-rotate to avoid accidental rotates. */
export const TOUCH_ROTATE_AFTER_DRAG_GUARD_MS = 180;

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
  /** Board hover + tray hover — faint target preview on canvas (desktop); coarse devices use selection instead. */
  hoverPreviewPieceIdRef: React.MutableRefObject<PieceId | null>;
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
  /** Called when user rotates a piece (for completion stats). */
  onRotate?: () => void;
  /** When set, use board-space API for zoom/pan viewport */
  screenToBoard?: ScreenToBoard;
  /** Timestamp of last tap-rotate; used to avoid click+touch double fire. */
  lastTapRotateTimeRef?: React.MutableRefObject<number>;
  /** Timestamp of last completed touch drag; used to suppress immediate accidental tap-rotate. */
  lastTouchDragEndTimeRef?: React.MutableRefObject<number>;
};

/** Dependencies passed to createPointerHandlers (pointerHandlersFactory). */
export type PointerHandlerFactoryDeps = {
  ctx: PointerHandlersContext & {
    viewport?: {
      startPan: (x: number, y: number) => void;
      handlePanMove: (x: number, y: number) => void;
      endPan: () => void;
      isPanning: () => boolean;
      isZoomedOrPanned?: () => boolean;
      startPinch: (
        p1: { clientX: number; clientY: number },
        p2: { clientX: number; clientY: number },
      ) => void;
      handlePinchMove: (
        p1: { clientX: number; clientY: number },
        p2: { clientX: number; clientY: number },
        boardRect: DOMRect,
      ) => void;
      endPinch: () => void;
      isPinching: () => boolean;
    };
  };
  canRotatePiece: (pid: PieceId) => boolean;
  isPointerOverTray: (clientX: number, clientY: number) => boolean;
  pruneStaleTouchPointers: () => void;
  activePointersRef: React.MutableRefObject<
    Map<
      number,
      { clientX: number; clientY: number; pointerType: string; updatedAtMs: number }
    >
  >;
  screenToBoard?: ScreenToBoard;
  onDragPreview?: (state: DragPreviewState) => void;
  setState: (st: PuzzleState) => void;
};
