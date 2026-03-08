import type React from "react";
import { handleTouchUp } from "./touchHandlers";
import { handleMouseUp } from "./mouseHandlers";
import type { CanvasWithTouch, PointerHandlerFactoryDeps } from "./types";

type EndDeps = Pick<
  PointerHandlerFactoryDeps,
  "activePointersRef" | "setState" | "screenToBoard" | "isPointerOverTray"
> & {
  ctx: PointerHandlerFactoryDeps["ctx"];
  canRotatePiece: PointerHandlerFactoryDeps["canRotatePiece"];
};

export function createPointerEndHandlers({
  activePointersRef,
  ctx,
  setState,
  screenToBoard,
  isPointerOverTray,
  canRotatePiece,
}: EndDeps) {
  const { manager, canvasRef, onDragPreview, viewport } = ctx;

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>): void {
    activePointersRef.current.delete(e.pointerId);
    if (viewport?.isPinching?.()) {
      if (activePointersRef.current.size < 2) viewport.endPinch();
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

    if (e.pointerType === "touch") {
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

  function handlePointerCancel(e: React.PointerEvent<HTMLCanvasElement>): void {
    activePointersRef.current.delete(e.pointerId);
    if (viewport?.isPinching?.()) {
      if (activePointersRef.current.size < 2) viewport.endPinch();
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

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault();
  }

  return {
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  };
}
