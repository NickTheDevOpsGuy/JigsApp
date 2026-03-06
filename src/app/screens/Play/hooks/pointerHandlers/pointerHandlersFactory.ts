/**
 * Factory that creates pointer handler functions for the play canvas.
 * Used by usePointerHandlers to keep the hook file smaller.
 */
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { CanvasWithTouch, PointerHandlerFactoryDeps } from "./types";
import {
  handleTouchDown,
  handleTouchMove,
  handleTouchUp,
  resetTouchState,
} from "./touchHandlers";
import { handleMouseDown, handleMouseMove, handleMouseUp } from "./mouseHandlers";

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
    const boardPieces = st.pieces.filter((p) => !p.inTray);
    // Always hit-test board pieces; restricting to assembled bounds can miss pieces
    // moved near board edges and make rotate/drag feel randomly broken.
    const pieceId = pickPieceId(ctx2d, boardPieces, pickX, pickY, {
      // Mobile taps benefit from a larger hit target around irregular piece edges.
      hitSlopPx: e.pointerType === "touch" ? 8 : 2,
    });
    if (!pieceId) {
      selectedIdRef.current = null;
      setSelectedPieceId(null);
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
        ctx.activePointerIdRef.current != null &&
        e.pointerId !== ctx.activePointerIdRef.current
      ) {
        return;
      }
      const handled = handleTouchMove(e, ctx, screenToBoard);
      if (handled) return;
      return;
    }

    handleMouseMove(e, ctx, screenToBoard);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>): void {
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
        ctx.activePointerIdRef.current != null &&
        e.pointerId !== ctx.activePointerIdRef.current
      ) {
        return;
      }
      handleTouchUp(e, ctx, canRotatePiece, isPointerOverTray, screenToBoard);
      return;
    }

    handleMouseUp(e, ctx, isPointerOverTray, screenToBoard);
  }

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault();
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLCanvasElement>): void {
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
    ctx.activePointerIdRef.current = null;
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
  }

  function handleLostPointerCapture(e: React.PointerEvent<HTMLCanvasElement>): void {
    handlePointerCancel(e);
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleContextMenu,
    handlePointerCancel,
    handleLostPointerCapture,
  };
}
