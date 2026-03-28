import { useCallback, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import posthog from "posthog-js";
import { usePointerHandlers } from "@/screens/Play/hooks/input/usePointerHandlers";
import type { Piece, PuzzleState } from "@/puzzle/core/types";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { UndoSnapBackFrom } from "@/screens/Play/core/utils/playUtils";
import type { HapticKind } from "@/screens/Play/hooks/system/useHaptics";
import { useViewport } from "@/screens/Play/hooks/viewport/useViewport";

type UsePlayScreenBoardInteractionsArgs = {
  manager: PuzzleManager | null;
  state: PuzzleState | null;
  setState: (state: PuzzleState) => void;
  boardRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  trayRef: RefObject<HTMLDivElement | null>;
  selectedIdRef: MutableRefObject<string | null>;
  hoverPreviewPieceIdRef: MutableRefObject<string | null>;
  setSelectedPieceId: (id: string | null) => void;
  bump: () => void;
  clearHighlight: () => void;
  hapticsVibrate: ((kind: HapticKind) => void) | undefined;
  moveCountRef: MutableRefObject<number>;
  dragStartTimeRef: MutableRefObject<number | null>;
  rotationCountRef: MutableRefObject<number>;
  stateRef: MutableRefObject<PuzzleState | null>;
  isCoarsePointer: boolean;
  viewport: ReturnType<typeof useViewport>;
  selectCycle: (dir: 1 | -1) => void;
  lastInteractionRef: MutableRefObject<number>;
  popMapRef: MutableRefObject<Map<string, number>>;
};

export function usePlayScreenBoardInteractions({
  manager,
  state,
  setState,
  boardRef,
  canvasRef,
  trayRef,
  selectedIdRef,
  hoverPreviewPieceIdRef,
  setSelectedPieceId,
  bump,
  clearHighlight,
  hapticsVibrate,
  moveCountRef,
  dragStartTimeRef,
  rotationCountRef,
  stateRef,
  isCoarsePointer,
  viewport,
  selectCycle,
  lastInteractionRef,
  popMapRef,
}: UsePlayScreenBoardInteractionsArgs) {
  const didDragRef = useRef(false);
  const [dragPreview, setDragPreview] = useState<{
    clientX: number;
    clientY: number;
    pieceId: string;
  } | null>(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const dragPreviewPieceIdRef = useRef<string | null>(null);
  dragPreviewPieceIdRef.current = dragPreview?.pieceId ?? null;

  const undoSnapBackRef = useRef<{
    fromPositions: UndoSnapBackFrom;
    startMs: number;
  } | null>(null);

  const screenToBoard = useCallback(
    (clientX: number, clientY: number, boardRect: DOMRect) => {
      const cssX = clientX - boardRect.left;
      const cssY = clientY - boardRect.top;
      const cssW = boardRect.width;
      const cssH = boardRect.height;
      const first = state?.pieces?.[0];
      const assembledW = first && state?.grid ? state.grid.cols * first.tileW : 0;
      const assembledH = first && state?.grid ? state.grid.rows * first.tileH : 0;
      const piece00 = state?.pieces?.find((p) => p.row === 0 && p.col === 0);
      const pad = piece00?.pad ?? 18;
      const boardOffsetX = piece00 ? piece00.pad - piece00.targetX : 0;
      const boardOffsetY = piece00 ? piece00.pad - piece00.targetY : 0;
      const contentW = assembledW + 2 * pad;
      const contentH = assembledH + 2 * pad;
      const fitScale =
        contentW > 0 && contentH > 0 ? Math.min(1, cssW / contentW, cssH / contentH) : 1;
      const drawW = contentW * fitScale;
      const drawH = contentH * fitScale;
      const fitOffsetX = (cssW - drawW) / 2;
      const fitOffsetY = (cssH - drawH) / 2;
      let vx = (cssX - fitOffsetX) / fitScale;
      let vy = (cssY - fitOffsetY) / fitScale;
      vx = (vx - viewport.viewport.panX) / viewport.viewport.scale;
      vy = (vy - viewport.viewport.panY) / viewport.viewport.scale;
      return {
        x: vx - boardOffsetX,
        y: vy - boardOffsetY,
      };
    },
    [
      state?.pieces,
      state?.grid,
      viewport.viewport.panX,
      viewport.viewport.panY,
      viewport.viewport.scale,
    ],
  );

  const pointerHandlers = usePointerHandlers({
    manager,
    canvasRef,
    boardRef,
    trayRef,
    setState,
    selectCycle,
    setSelectedPieceId,
    selectedIdRef,
    hoverPreviewPieceIdRef,
    bump,
    didDragRef,
    haptic: hapticsVibrate,
    onDragPreview: setDragPreview,
    onPieceInteraction: () => {
      lastInteractionRef.current = performance.now();
      clearHighlight();
    },
    onDragStarted: () => {
      setIsDraggingBoard(true);
      // Do NOT count move here — only count if the piece was actually dragged (not just tapped)
      const now = performance.now();
      dragStartTimeRef.current = now;
      const grid = stateRef.current?.grid;
      const gridSize = grid ? `${grid.rows}x${grid.cols}` : "unknown";
      posthog.capture("drag_started", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
      });
    },
    onDragEnded: () => {
      setIsDraggingBoard(false);
      // Only count as a move if the piece was actually dragged, not just tapped
      if (didDragRef.current) {
        moveCountRef.current += 1;
      }
      dragStartTimeRef.current = null;
    },
    onRotate: () => {
      rotationCountRef.current += 1;
    },
    screenToBoard,
    viewport,
  });

  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      lastInteractionRef.current = performance.now();
      moveCountRef.current += 1;
      manager.movePieceFromTray(pieceId);
      popMapRef.current.set(pieceId, performance.now());
      setState(manager.getState());
      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
    },
    [
      manager,
      lastInteractionRef,
      moveCountRef,
      popMapRef,
      setState,
      selectedIdRef,
      setSelectedPieceId,
      bump,
    ],
  );

  const dragPreviewPiece: Piece | null =
    dragPreview && state
      ? (state.pieces.find((piece) => piece.id === dragPreview.pieceId) ?? null)
      : null;

  return {
    didDragRef,
    dragPreview,
    dragPreviewPiece,
    dragPreviewPieceIdRef,
    undoSnapBackRef,
    isDraggingBoard,
    handleTrayPieceClick,
    ...pointerHandlers,
  };
}
