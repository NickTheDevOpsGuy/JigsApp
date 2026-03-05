/**
 * usePointerHandlers – wires pointer/touch events on canvas, board, tray to PuzzleManager.
 *
 * Builds context and callbacks, then uses createPointerHandlers (pointerHandlersFactory)
 * to produce handler functions. Keeps effect cleanup and window/touch listeners here.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import type React from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type {
  CanvasWithTouch,
  DragPreviewState,
  ScreenToBoard,
} from "./pointerHandlers/types";
import { resetTouchState } from "./pointerHandlers/touchHandlers";
import { createPointerHandlers } from "./pointerHandlers/pointerHandlersFactory";

export function canRotateBoardPieceInState(st: PuzzleState, pid: PieceId): boolean {
  const piece = st.pieces.find((p) => p.id === pid);
  if (!piece) return false;
  if (piece.isPlaced || piece.locked || piece.inTray) return false;
  const boardGroupPieces = st.pieces.filter(
    (p) => p.groupId === piece.groupId && !p.inTray,
  );
  if (boardGroupPieces.length === 0) return false;
  return !boardGroupPieces.some((p) => p.locked);
}

export function usePointerHandlers(args: {
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
  onDragStarted?: () => void;
  onDragEnded?: () => void;
  screenToBoard?: ScreenToBoard;
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
}) {
  const {
    manager,
    boardRef,
    canvasRef,
    trayRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    didDragRef,
    selectCycle,
    setState,
    haptic,
    onDragPreview,
    onPieceInteraction,
    onDragStarted,
    onDragEnded,
    screenToBoard,
    viewport,
  } = args;

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;
      const st = manager.getState();
      return canRotateBoardPieceInState(st, pid);
    },
    [manager],
  );

  const isPointerOverTray = useCallback(
    (clientX: number, clientY: number) => {
      const el = trayRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    },
    [trayRef],
  );

  const activePointerIdRef = useRef<number | null>(null);
  const lastTapRotateTimeRef = useRef<number>(0);

  const ctx = {
    manager,
    boardRef,
    canvasRef,
    trayRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    didDragRef,
    selectCycle,
    setState,
    haptic,
    onDragPreview,
    onPieceInteraction,
    onDragStarted,
    onDragEnded,
    screenToBoard,
    viewport,
    activePointerIdRef,
    lastTapRotateTimeRef,
  };

  const activePointersRef = useRef<
    Map<
      number,
      { clientX: number; clientY: number; pointerType: string; updatedAtMs: number }
    >
  >(new Map());
  const TOUCH_POINTER_STALE_MS = 1500;
  const pruneStaleTouchPointers = useCallback(() => {
    const now = performance.now();
    for (const [id, p] of activePointersRef.current.entries()) {
      if (p.pointerType === "touch" && now - p.updatedAtMs > TOUCH_POINTER_STALE_MS) {
        activePointersRef.current.delete(id);
      }
    }
  }, []);

  const handlers = useMemo(
    () =>
      createPointerHandlers({
        ctx: { ...ctx, viewport },
        canRotatePiece,
        isPointerOverTray,
        pruneStaleTouchPointers,
        activePointersRef,
        screenToBoard,
        onDragPreview,
        setState,
      }),
    [
      manager,
      boardRef,
      canvasRef,
      trayRef,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      didDragRef,
      selectCycle,
      setState,
      haptic,
      onDragPreview,
      onPieceInteraction,
      onDragStarted,
      onDragEnded,
      screenToBoard,
      viewport,
      activePointerIdRef,
      lastTapRotateTimeRef,
      canRotatePiece,
      isPointerOverTray,
      pruneStaleTouchPointers,
    ],
  );

  // Safety net: if pointerup happens off the canvas, still end the drag.
  useEffect(() => {
    const onWinUp = (_ev: PointerEvent) => {
      if (!manager) return;
      const activeId = manager.getDragState().activeId;
      if (!activeId) return;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
    };

    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    return () => {
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
    };
  }, [manager, onDragPreview, setState]);

  // Touch-event-based pinch zoom for iOS Safari.
  // Pointer events are unreliable for multi-touch on iOS (second finger often doesn't fire).
  // Native touch events work reliably.
  useEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board || !viewport) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const canvasWithTouch = canvas as CanvasWithTouch;
        const hasActivePieceDrag =
          activePointerIdRef.current != null &&
          (canvasWithTouch.pendingPieceId != null ||
            (manager?.getDragState?.().activeId ?? null) != null);
        if (hasActivePieceDrag) {
          e.preventDefault();
          return;
        }
        const p1 = e.touches[0];
        const p2 = e.touches[1];
        activePointerIdRef.current = null;
        resetTouchState(canvasWithTouch);
        onDragPreview?.(null);
        selectedIdRef.current = null;
        setSelectedPieceId(null);
        manager?.pointerUp();
        if (manager) setState(manager.getState());
        viewport.endPan();
        viewport.startPinch(
          { clientX: p1.clientX, clientY: p1.clientY },
          { clientX: p2.clientX, clientY: p2.clientY },
        );
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (viewport.isPinching() && e.touches.length >= 2 && board) {
        const p1 = e.touches[0];
        const p2 = e.touches[1];
        const boardRect = board.getBoundingClientRect();
        viewport.handlePinchMove(
          { clientX: p1.clientX, clientY: p1.clientY },
          { clientX: p2.clientX, clientY: p2.clientY },
          boardRect,
        );
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (viewport.isPinching() && e.touches.length < 2) {
        viewport.endPinch();
      }
    };

    const onTouchCancel = (e: TouchEvent) => {
      if (viewport.isPinching() && e.touches.length < 2) {
        viewport.endPinch();
      }
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [
    canvasRef,
    boardRef,
    viewport,
    manager,
    onDragPreview,
    setState,
    setSelectedPieceId,
    selectedIdRef,
    pruneStaleTouchPointers,
  ]);

  return handlers;
}
