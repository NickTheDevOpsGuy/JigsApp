import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { soundManager } from "@/audio/sounds";
import type { CanvasWithTouch } from "./types";
import { TAP_DRAG_THRESHOLD_PX } from "./types";
import type { PointerHandlersContext } from "./types";
import { finishDragWithTrayCheck } from "./shared";

export function resetTouchState(canvas: CanvasWithTouch): void {
  canvas.touchStartX = undefined;
  canvas.touchStartY = undefined;
  canvas.touchDragStarted = false;
  canvas.pendingPieceId = null;
  canvas.pendingPieceRect = null;
}

export function handleTouchDown(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
  pieceId: string,
  boardRect: DOMRect,
  piece: { x: number; y: number; w: number; h: number },
): void {
  const { manager, canvasRef, didDragRef } = ctx;
  if (!manager) return;

  const canvas = canvasRef.current as CanvasWithTouch;
  if (!canvas) return;

  didDragRef.current = false;
  e.preventDefault();

  canvas.touchStartX = e.clientX;
  canvas.touchStartY = e.clientY;
  canvas.touchDragStarted = false;
  canvas.pendingPieceId = pieceId;
  canvas.pendingPieceRect = new DOMRect(
    boardRect.left + piece.x,
    boardRect.top + piece.y,
    piece.w,
    piece.h,
  );

  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}

export function handleTouchMove(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
): boolean {
  const { manager, boardRef, didDragRef, setState } = ctx;
  if (!manager || !boardRef.current) return false;

  const canvas = e.currentTarget as CanvasWithTouch;
  const sx = canvas.touchStartX;
  const sy = canvas.touchStartY;
  const pendingId = canvas.pendingPieceId;
  const pendingRect = canvas.pendingPieceRect;

  if (sx == null || sy == null || !pendingId || !pendingRect) return false;

  const dist = Math.hypot(e.clientX - sx, e.clientY - sy);

  if (!canvas.touchDragStarted && dist >= TAP_DRAG_THRESHOLD_PX) {
    canvas.touchDragStarted = true;
    didDragRef.current = true;
    manager.pointerDown(pendingId, sx, sy, pendingRect);
    setState(manager.getState());
  }

  if (canvas.touchDragStarted) {
    const boardRect = boardRef.current.getBoundingClientRect();
    manager.pointerMove(e.clientX, e.clientY, boardRect);
  }
  return true;
}

export function handleTouchUp(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
  canRotatePiece: (pid: string) => boolean,
  isPointerOverTray: (x: number, y: number) => boolean,
): void {
  const { manager, boardRef, canvasRef, setState, haptic, selectCycle } = ctx;
  if (!manager || !canvasRef.current) return;

  const canvas = canvasRef.current as CanvasWithTouch;
  const boardRect = boardRef.current?.getBoundingClientRect();
  const ctx2d = canvas.getContext("2d");

  if (!dragStarted(canvas)) {
    // Touch tap: rotate
    if (boardRect && ctx2d) {
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      const st = manager.getState();
      const x = e.clientX - boardRect.left;
      const y = e.clientY - boardRect.top;
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pid = pickPieceId(ctx2d, boardPieces, x, y);
      if (pid && canRotatePiece(pid)) {
        manager.rotatePiece(pid);
        soundManager.play("rotate");
        haptic?.("rotate");
        setState(manager.getState());
      }
    }
  } else {
    // Touch drag end: check for drop on tray
    finishDragWithTrayCheck(
      manager,
      e.clientX,
      e.clientY,
      isPointerOverTray,
      selectCycle,
    );
    setState(manager.getState());
  }

  resetTouchState(canvas);
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}

function dragStarted(canvas: CanvasWithTouch): boolean {
  return !!canvas.touchDragStarted;
}
