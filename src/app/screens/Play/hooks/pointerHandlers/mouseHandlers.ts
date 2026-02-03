import type React from "react";
import { soundManager } from "@/audio/sounds";
import type { CanvasWithTouch } from "./types";
import type { PointerHandlersContext } from "./types";
import { finishDragWithTrayCheck } from "./shared";

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
    setState(manager.getState());

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
  const { manager, boardRef, didDragRef } = ctx;
  if (!manager || !boardRef.current) return;

  didDragRef.current = true;
  const boardRect = boardRef.current.getBoundingClientRect();
  manager.pointerMove(e.clientX, e.clientY, boardRect);
}

export function handleMouseUp(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
  isPointerOverTray: (x: number, y: number) => boolean,
): void {
  const { manager, canvasRef, didDragRef, setState, selectCycle } = ctx;
  if (!manager || !canvasRef.current) return;

  const canvas = canvasRef.current as CanvasWithTouch;

  finishDragWithTrayCheck(manager, e.clientX, e.clientY, isPointerOverTray, selectCycle);
  setState(manager.getState());
  didDragRef.current = false;

  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}
