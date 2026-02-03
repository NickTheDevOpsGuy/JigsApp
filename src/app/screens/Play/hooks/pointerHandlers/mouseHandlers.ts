import type React from "react";
import { soundManager } from "@/audio/sounds";
import type { CanvasWithTouch } from "./types";
import type { PointerHandlersContext } from "./types";
import { finishDragWithTrayCheck } from "./shared";
import { dragLog } from "./dragLog";

export function handleMouseDown(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
  pieceId: string,
  boardRect: DOMRect,
  piece: { x: number; y: number; w: number; h: number },
  canRotatePiece: (pid: string) => boolean,
): boolean {
  const { manager, canvasRef, didDragRef, setState, haptic } = ctx;
  if (!manager) return false;

  // Right click = rotate (desktop)
  if (e.button === 2) {
    e.preventDefault();
    if (!canRotatePiece(pieceId)) return false;

    manager.rotatePiece(pieceId);
    soundManager.play("rotate");
    haptic?.("rotate");
    setState(manager.getState());
    ctx.onPieceInteraction?.();
    return true;
  }

  // Mouse left click: start drag immediately (desktop behavior)
  if (e.button === 0) {
    const canvas = canvasRef.current as CanvasWithTouch;
    if (!canvas) return false;

    didDragRef.current = false;
    e.preventDefault();

    const pieceRect = new DOMRect(
      boardRect.left + piece.x,
      boardRect.top + piece.y,
      piece.w,
      piece.h,
    );

    manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
    dragLog("down", { pieceId, x: e.clientX, y: e.clientY, pointerId: e.pointerId });
    setState(manager.getState());
    ctx.onPieceInteraction?.();

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    return true;
  }

  return false;
}

export function handleMouseMove(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
): void {
  const { manager, boardRef, didDragRef, onDragPreview } = ctx;
  if (!manager || !boardRef.current) return;

  didDragRef.current = true;
  ctx.onPieceInteraction?.();
  const boardRect = boardRef.current.getBoundingClientRect();
  manager.pointerMove(e.clientX, e.clientY, boardRect);
  dragLog("move", {
    x: e.clientX,
    y: e.clientY,
    activeId: manager.getDragState().activeId,
  });

  const activeId = manager.getDragState().activeId;
  if (activeId && onDragPreview) {
    const st = manager.getState();
    const piece = st.pieces.find((p) => p.id === activeId);
    const groupSize = piece
      ? st.pieces.filter((p) => p.groupId === piece.groupId).length
      : 0;
    if (groupSize === 1) {
      onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
    }
  }
}

export function handleMouseUp(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
  isPointerOverTray: (x: number, y: number) => boolean,
): void {
  const { manager, canvasRef, didDragRef, setState, selectCycle, onDragPreview } = ctx;
  if (!manager || !canvasRef.current) return;

  const canvas = canvasRef.current as CanvasWithTouch;

  ctx.onPieceInteraction?.();
  onDragPreview?.(null);
  dragLog("up", {
    x: e.clientX,
    y: e.clientY,
    activeId: manager.getDragState().activeId,
    pointerId: e.pointerId,
  });

  finishDragWithTrayCheck(manager, e.clientX, e.clientY, isPointerOverTray, selectCycle);
  setState(manager.getState());
  didDragRef.current = false;

  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}
