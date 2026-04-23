/**
 * Factory that creates pointer handler functions for the play canvas.
 * Used by usePointerHandlers to keep the hook file smaller.
 */
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/utils/pickPiece";
import type { CanvasWithTouch, PointerHandlerFactoryDeps } from "./types";
import { handleTouchDown, handleTouchMove, resetTouchState } from "./touchHandlers";
import {
  handleMouseDown,
  handleMouseMove,
  type HoverProbeState,
} from "./mouseHandlers";
import { createPointerEndHandlers } from "./pointerHandlersEnd";
import { createPointerMoveRafQueue } from "./pointerMoveRafQueue";

export type { PointerHandlerFactoryDeps } from "./types";

export function createPointerHandlers(deps: PointerHandlerFactoryDeps) {
  const {
    ctx,
    canRotatePiece,
    isPointerOverTray,
    pruneStaleTouchPointers,
    activePointersRef,
    screenToBoard,
    onDragPreview,
    setState,
  } = deps;
  const {
    manager,
    boardRef,
    canvasRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    viewport,
  } = ctx;
  let lastTouchMoveAtMs = 0;
  const touchMoveThrottleMs = (() => {
    if (typeof window === "undefined") return 8;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const dpr = window.devicePixelRatio || 1;
    if (isCoarse && dpr >= 2.5) return 12;
    if (isCoarse) return 10;
    return 8;
  })();
  const hoverProbeState: HoverProbeState = {
    lastAtMs: 0,
    lastClientX: Number.NaN,
    lastClientY: Number.NaN,
  };
  const mouseMoveQueue = createPointerMoveRafQueue(
    (clientX, clientY, pointerType) => {
      if (!manager) return;
      handleMouseMove(
        {
          clientX,
          clientY,
          pointerType,
        } as React.PointerEvent<HTMLCanvasElement>,
        ctx,
        screenToBoard,
        hoverProbeState,
      );
    },
  );

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>): void {
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
      ctx.activePointerIdRef.current != null &&
      (canvas?.pendingPieceId != null || manager.getDragState().activeId != null);
    if (viewport && touchPointers.length >= 2 && e.pointerType === "touch") {
      if (hasActivePieceDrag) {
        e.preventDefault();
        return;
      }
      const [p1, p2] = touchPointers;
      ctx.activePointerIdRef.current = null;
      resetTouchState(canvas);
      onDragPreview?.(null);
      selectedIdRef.current = null;
      setSelectedPieceId(null);
      ctx.hoverPreviewPieceIdRef.current = null;
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
    // Always hit-test board pieces; restricting to assembled bounds can miss pieces
    // moved near board edges and make rotate/drag feel randomly broken.
    const pieceId = pickPieceId(ctx2d, st.pieces, pickX, pickY, {
      // Mobile taps benefit from a larger hit target around irregular piece edges.
      hitSlopPx: e.pointerType === "touch" ? 12 : 2,
    });
    if (!pieceId) {
      selectedIdRef.current = null;
      setSelectedPieceId(null);
      ctx.hoverPreviewPieceIdRef.current = null;
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

    if (
      e.pointerType === "touch" &&
      ctx.activePointerIdRef.current != null &&
      ctx.activePointerIdRef.current !== e.pointerId
    ) {
      return;
    }

    /* Bring piece to front on tap so it never appears trapped under others */
    if (piece && !piece.isPlaced) {
      manager.raiseGroupToFront(pieceId);
      setState(manager.getState());
    }

    selectedIdRef.current = pieceId;
    setSelectedPieceId(pieceId);
    bump();

    const isTouch = e.pointerType === "touch";
    if (isTouch && piece) {
      handleTouchDown(e, ctx, pieceId, boardRect, piece, screenToBoard);
      return;
    }

    if (e.button === 0 || e.button === 2) {
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
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>): void {
    activePointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
      pointerType: e.pointerType,
      updatedAtMs: performance.now(),
    });
    pruneStaleTouchPointers();

    if (viewport && e.pointerType === "touch") {
      const touchPointers = [...activePointersRef.current.entries()]
        .filter(([, p]) => p.pointerType === "touch")
        .map(([id, p]) => ({ id, ...p }));
      const canvas = canvasRef.current as CanvasWithTouch | null;
      const hasActivePieceDrag =
        ctx.activePointerIdRef.current != null &&
        ((canvas?.pendingPieceId ?? null) != null ||
          manager?.getDragState().activeId != null);

      if (touchPointers.length >= 2 && hasActivePieceDrag && canvas) {
        ctx.activePointerIdRef.current = null;
        resetTouchState(canvas);
        onDragPreview?.(null);
        selectedIdRef.current = null;
        setSelectedPieceId(null);
        ctx.hoverPreviewPieceIdRef.current = null;
        manager?.pointerUp();
        if (manager) setState(manager.getState());
        viewport.endPan();
        viewport.startPinch(
          { clientX: touchPointers[0].clientX, clientY: touchPointers[0].clientY },
          { clientX: touchPointers[1].clientX, clientY: touchPointers[1].clientY },
        );
        e.preventDefault();
        return;
      }
    }

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
      const now = performance.now();
      if (now - lastTouchMoveAtMs < touchMoveThrottleMs) return;
      lastTouchMoveAtMs = now;
      if (
        ctx.activePointerIdRef.current != null &&
        e.pointerId !== ctx.activePointerIdRef.current
      ) {
        return;
      }
      const handled = handleTouchMove(e, ctx, screenToBoard);
      if (handled) return;
      return;
    }

    mouseMoveQueue.queue(e.clientX, e.clientY, e.pointerType);
  }

  const {
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  } = createPointerEndHandlers({
    activePointersRef,
    ctx,
    setState,
    screenToBoard,
    isPointerOverTray,
    canRotatePiece,
  });

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => {
      mouseMoveQueue.clear();
      handlePointerUp(e);
    },
    handleContextMenu,
    handlePointerCancel: (e: React.PointerEvent<HTMLCanvasElement>) => {
      mouseMoveQueue.clear();
      handlePointerCancel(e);
    },
    handleLostPointerCapture: (e: React.PointerEvent<HTMLCanvasElement>) => {
      mouseMoveQueue.clear();
      handleLostPointerCapture(e);
    },
  };
}
