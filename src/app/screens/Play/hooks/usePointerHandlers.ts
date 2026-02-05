// src/app/screens/Play/hooks/usePointerHandlers.ts

import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { CanvasWithTouch, DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";
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
  onDragPreview?: (state: DragPreviewState | null) => void;
  onPieceInteraction?: () => void;
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
  } = args;

  const managerRef = useRef<PuzzleManager | null>(null);
  managerRef.current = manager;

  const touchPendingRef = useRef(false);
  const clearTouchPending = useCallback(() => {
    touchPendingRef.current = false;
  }, []);

  const ctx = {
    manager: managerRef.current,
    managerRef,
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
    clearTouchPending,
  };

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;
      const st = manager.getState();
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece) return false;
      if (piece.isPlaced || piece.locked || piece.inTray) return false;
      const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
      return groupSize === 1;
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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, cssX, cssY);
      if (!pieceId) return;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (piece?.locked) return;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      if (e.button === 0 || e.button === 2) {
        if (!piece) return;

        // Touch pointer events (iOS / modern browsers): route through touch handlers.
        // This is a robust fallback if native touch events are inconsistent.
        if (e.pointerType === "touch") {
          e.preventDefault();
          touchPendingRef.current = true;
          handleTouchDown(e, ctx, pieceId, boardRect, piece);
          return;
        }

        const handled = handleMouseDown(
          e,
          ctx,
          pieceId,
          boardRect,
          piece,
          canRotatePiece,
        );
        if (handled) return;
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
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !boardRef.current) return;

      if (e.pointerType === "touch") {
        const canvas = canvasRef.current as CanvasWithTouch | null;
        if (!canvas) return;
        const moved = handleTouchMove(e, ctx, canvas);
        if (moved && canvas.touchDragStarted) e.preventDefault();
        return;
      }

      handleMouseMove(e, ctx);
    },
    [manager, boardRef, canvasRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current) return;

      if (e.pointerType === "touch") {
        // End touch drag or tap-rotate
        handleTouchUp(e, ctx, canRotatePiece, isPointerOverTray);
        return;
      }

      handleMouseUp(e, ctx, isPointerOverTray);
    },
    [manager, canvasRef, isPointerOverTray, canRotatePiece],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager) return;
      const canvas = canvasRef.current as CanvasWithTouch | null;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
      if (e.pointerType === "touch" && canvas) {
        resetTouchState(canvas);
        clearTouchPending();
      }
    },
    [manager, canvasRef, onDragPreview, setState, clearTouchPending],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      handlePointerCancel(e);
    },
    [handlePointerCancel],
  );

  // iOS Safari: touch events can be more reliable than pointer events in some cases.
  // Keep native touch listeners, but avoid double-processing if pointer-touch is active.
  useEffect(() => {
    if (!manager || !boardRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current as CanvasWithTouch;
    const board = boardRef.current;

    const makeTouchLike = (touch: Touch, preventDefault: () => void) => ({
      clientX: touch.clientX,
      clientY: touch.clientY,
      pointerId: touch.identifier,
      preventDefault,
      currentTarget: board,
    });

    const onTouchStart = (ev: TouchEvent) => {
      // If we're already handling this interaction via Pointer Events (common on modern iOS),
      // ignore the native touch event to avoid double-processing.
      if (touchPendingRef.current) return;

      if (!board.contains(ev.target as Node) || ev.touches.length === 0) return;
      ev.preventDefault();

      const touch = ev.touches[0];
      const boardRect = board.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cssX = touch.clientX - boardRect.left;
      const cssY = touch.clientY - boardRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, cssX, cssY);
      if (!pieceId) return;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.locked) return;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      touchPendingRef.current = true;
      handleTouchDown(
        makeTouchLike(touch, () =>
          ev.preventDefault(),
        ) as unknown as React.PointerEvent<Element>,
        ctx,
        pieceId,
        boardRect,
        piece,
      );
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!canvas.pendingPieceId || ev.touches.length === 0) return;
      if (canvas.touchDragStarted) ev.preventDefault();

      const touch = ev.touches[0];
      handleTouchMove(
        makeTouchLike(touch, () =>
          ev.preventDefault(),
        ) as unknown as React.PointerEvent<Element>,
        ctx,
        canvas,
      );
    };

    const onTouchEnd = (ev: TouchEvent) => {
      if (!canvas.pendingPieceId && !manager.getDragState().activeId) return;
      if (ev.changedTouches.length === 0) return;
      ev.preventDefault();

      const touch = ev.changedTouches[0];
      handleTouchUp(
        makeTouchLike(touch, () =>
          ev.preventDefault(),
        ) as unknown as React.PointerEvent<Element>,
        ctx,
        canRotatePiece,
        isPointerOverTray,
      );
    };

    const opts: AddEventListenerOptions = { passive: false, capture: true };
    document.addEventListener("touchstart", onTouchStart, opts);
    document.addEventListener("touchmove", onTouchMove, opts);
    document.addEventListener("touchend", onTouchEnd, opts);
    document.addEventListener("touchcancel", onTouchEnd, opts);

    return () => {
      document.removeEventListener("touchstart", onTouchStart, opts);
      document.removeEventListener("touchmove", onTouchMove, opts);
      document.removeEventListener("touchend", onTouchEnd, opts);
      document.removeEventListener("touchcancel", onTouchEnd, opts);
    };
  }, [
    manager,
    boardRef,
    canvasRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    onPieceInteraction,
    canRotatePiece,
    isPointerOverTray,
  ]);

  // Document-level pointer listeners for touch fallback
  useEffect(() => {
    if (!manager) return;

    const onDocMove = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch") return;
      const canvas = canvasRef.current as CanvasWithTouch | null;
      if (!canvas?.pendingPieceId) return;

      const moved = handleTouchMove(
        ev as unknown as React.PointerEvent<Element>,
        ctx,
        canvas,
      );
      if (moved && canvas.touchDragStarted) {
        try {
          ev.preventDefault();
        } catch {
          // ignore
        }
      }
    };

    const onDocUp = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch") return;
      const canvas = canvasRef.current as CanvasWithTouch | null;
      if (!canvas) return;
      if (!canvas.pendingPieceId && !manager.getDragState().activeId) return;

      handleTouchUp(
        ev as unknown as React.PointerEvent<Element>,
        ctx,
        canRotatePiece,
        isPointerOverTray,
      );
    };

    document.addEventListener("pointermove", onDocMove, { capture: true });
    document.addEventListener("pointerup", onDocUp, { capture: true });
    document.addEventListener("pointercancel", onDocUp, { capture: true });

    return () => {
      document.removeEventListener("pointermove", onDocMove, { capture: true });
      document.removeEventListener("pointerup", onDocUp, { capture: true });
      document.removeEventListener("pointercancel", onDocUp, { capture: true });
    };
  }, [manager, canvasRef, canRotatePiece, isPointerOverTray]);

  // Safety: if the window blurs, stop dragging
  useEffect(() => {
    if (!manager) return;

    const onWinUp = () => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      if (!canvas) return;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
      resetTouchState(canvas);
      clearTouchPending();
      soundManager.stop?.("pickup");
    };

    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);

    return () => {
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
    };
  }, [manager, canvasRef, onDragPreview, setState, clearTouchPending]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  };
}
