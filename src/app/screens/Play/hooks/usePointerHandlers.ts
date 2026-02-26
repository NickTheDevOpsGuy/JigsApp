/**
 * usePointerHandlers – wires pointer/touch events on canvas, board, tray to PuzzleManager.
 * Delegates to touchHandlers (touch) and mouseHandlers (mouse); handles pinch zoom and pan.
 */
import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type {
  CanvasWithTouch,
  DragPreviewState,
  ScreenToBoard,
} from "./pointerHandlers/types";
import {
  handleTouchDown,
  handleTouchMove,
  handleTouchUp,
  resetTouchState,
} from "./pointerHandlers/touchHandlers";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "./pointerHandlers/mouseHandlers";

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
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece) return false;
      if (piece.isPlaced || piece.locked || piece.inTray) return false;
      const groupPieces = st.pieces.filter((p) => p.groupId === piece.groupId);
      if (groupPieces.some((p) => p.locked)) return false;
      return groupPieces.length === 1;
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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      activePointersRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
        pointerType: e.pointerType,
        updatedAtMs: performance.now(),
      });
      pruneStaleTouchPointers();

      const touchPointers = [...activePointersRef.current.entries()]
        .filter(([, p]) => p.pointerType === "touch")
        .map(([id, p]) => ({ id, ...p }));
      const canvas = canvasRef.current as CanvasWithTouch;
      const hasActivePieceDrag =
        activePointerIdRef.current != null &&
        (canvas?.pendingPieceId != null || manager.getDragState().activeId != null);
      if (viewport && touchPointers.length >= 2 && e.pointerType === "touch") {
        if (hasActivePieceDrag) {
          e.preventDefault();
          return;
        }
        const [p1, p2] = touchPointers;
        activePointerIdRef.current = null;
        resetTouchState(canvas);
        onDragPreview?.(null);
        selectedIdRef.current = null;
        setSelectedPieceId(null);
        manager.pointerUp();
        setState(manager.getState());
        viewport.endPan();
        try {
          canvas.releasePointerCapture(p1.id);
          canvas.releasePointerCapture(p2.id);
        } catch {
          /* ignore */
        }
        viewport.startPinch(
          { clientX: p1.clientX, clientY: p1.clientY },
          { clientX: p2.clientX, clientY: p2.clientY },
        );
        e.preventDefault();
        return;
      }

      // Middle mouse: start pan
      if (e.button === 1 && viewport) {
        e.preventDefault();
        viewport.startPan(e.clientX, e.clientY);
        try {
          (canvasRef.current as CanvasWithTouch).setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const { x: pickX, y: pickY } = screenToBoard
        ? screenToBoard(e.clientX, e.clientY, boardRect)
        : { x: e.clientX - boardRect.left, y: e.clientY - boardRect.top };

      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      // Reject hits outside assembled board (e.g. letterbox / empty area) to avoid blue outline on empty click
      const first = st.pieces[0];
      const assembledW = first ? st.grid.cols * first.tileW : 0;
      const assembledH = first ? st.grid.rows * first.tileH : 0;
      const inBounds =
        assembledW > 0 &&
        assembledH > 0 &&
        pickX >= -2 &&
        pickY >= -2 &&
        pickX <= assembledW + 2 &&
        pickY <= assembledH + 2;
      const pieceId = inBounds ? pickPieceId(ctx2d, boardPieces, pickX, pickY) : null;
      if (!pieceId) {
        selectedIdRef.current = null;
        setSelectedPieceId(null);
        // Empty space — single-finger pan when zoomed (touch only)
        if (viewport && e.pointerType === "touch" && viewport.isZoomedOrPanned?.()) {
          e.preventDefault();
          viewport.startPan(e.clientX, e.clientY);
          try {
            (canvasRef.current as CanvasWithTouch).setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }
        return;
      }

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (piece?.locked) return;

      // Ignore new touch on piece when another pointer is already dragging (prevents multi-touch dragging)
      if (
        e.pointerType === "touch" &&
        activePointerIdRef.current != null &&
        activePointerIdRef.current !== e.pointerId
      ) {
        return;
      }

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      const isTouch = e.pointerType === "touch";
      const isLeftClick = e.button === 0;

      if (isTouch && piece) {
        handleTouchDown(e, ctx, pieceId, boardRect, piece, screenToBoard);
        return;
      }

      if (isLeftClick || e.button === 2) {
        if (piece) {
          const handled = handleMouseDown(
            e,
            ctx,
            pieceId,
            boardRect,
            piece,
            canRotatePiece,
            screenToBoard,
          );
          if (handled) return;
        }
      }
    },
    [
      manager,
      boardRef,
      canvasRef,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      canRotatePiece,
      screenToBoard,
      viewport,
      onDragPreview,
      setState,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      activePointersRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
        pointerType: e.pointerType,
        updatedAtMs: performance.now(),
      });
      pruneStaleTouchPointers();

      if (viewport?.isPinching?.()) {
        const touchPointers = [...activePointersRef.current.entries()]
          .filter(([, p]) => p.pointerType === "touch")
          .map(([, p]) => p);
        if (touchPointers.length < 2) {
          viewport.endPinch();
          e.preventDefault();
          return;
        }
        if (boardRef.current) {
          const boardRect = boardRef.current.getBoundingClientRect();
          viewport.handlePinchMove(touchPointers[0], touchPointers[1], boardRect);
        }
        e.preventDefault();
        return;
      }
      if (viewport?.isPanning?.()) {
        viewport.handlePanMove(e.clientX, e.clientY);
        return;
      }
      if (!manager || !boardRef.current) return;

      const isTouch = e.pointerType === "touch";
      if (isTouch) {
        if (
          activePointerIdRef.current != null &&
          e.pointerId !== activePointerIdRef.current
        ) {
          return;
        }
        const handled = handleTouchMove(e, ctx, screenToBoard);
        if (handled) return;
        return;
      }

      handleMouseMove(e, ctx, screenToBoard);
    },
    [manager, boardRef, screenToBoard, viewport],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      activePointersRef.current.delete(e.pointerId);
      if (viewport?.isPinching?.()) {
        if (activePointersRef.current.size < 2) {
          viewport.endPinch();
        }
        return;
      }
      if (viewport?.isPanning?.()) {
        viewport.endPan();
        try {
          (canvasRef.current as CanvasWithTouch)?.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
      if (!manager || !canvasRef.current) return;

      const isTouch = e.pointerType === "touch";

      if (isTouch) {
        if (
          activePointerIdRef.current != null &&
          e.pointerId !== activePointerIdRef.current
        ) {
          return;
        }
        handleTouchUp(e, ctx, canRotatePiece, isPointerOverTray, screenToBoard);
        return;
      }

      handleMouseUp(e, ctx, isPointerOverTray, screenToBoard);
    },
    [manager, canvasRef, canRotatePiece, isPointerOverTray, screenToBoard, viewport],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      activePointersRef.current.delete(e.pointerId);
      if (viewport?.isPinching?.()) {
        if (activePointersRef.current.size < 2) {
          viewport.endPinch();
        }
        return;
      }
      if (viewport?.isPanning?.()) {
        viewport.endPan();
        return;
      }
      if (!manager || !canvasRef.current) return;
      activePointerIdRef.current = null;
      const canvas = canvasRef.current as CanvasWithTouch;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
      if (e.pointerType === "touch") {
        canvas.touchStartX = undefined;
        canvas.touchStartY = undefined;
        canvas.touchDragStarted = false;
        canvas.pendingPieceId = null;
        canvas.pendingPieceRect = null;
      }
    },
    [manager, canvasRef, onDragPreview, setState, viewport],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // treat as cancel
      handlePointerCancel(e);
    },
    [handlePointerCancel],
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

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  };
}
