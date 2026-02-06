import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { soundManager } from "@/audio/sounds";
import type { CanvasWithTouch, PointerHandlersContext } from "./types";
import { TAP_DRAG_THRESHOLD_PX } from "./types";
import { finishDragWithTrayCheck } from "./shared";

export function resetTouchState(canvas: CanvasWithTouch): void {
  canvas.touchStartX = undefined;
  canvas.touchStartY = undefined;
  canvas.touchStartTime = undefined;
  canvas.touchDragStarted = false;
  canvas.pendingPieceId = null;
  canvas.pendingPieceRect = null;
}

export function handleTouchDown(
  e: React.PointerEvent<Element>,
  ctx: PointerHandlersContext,
  pieceId: string,
  boardRect: DOMRect,
  piece: { x: number; y: number; w: number; h: number },
): void {
  const { manager, canvasRef, didDragRef, onPieceInteraction } = ctx;
  if (!manager) return;

  const canvas = canvasRef.current as CanvasWithTouch;
  if (!canvas) return;

  didDragRef.current = false;
  onPieceInteraction?.();
  e.preventDefault();

  canvas.touchStartX = e.clientX;
  canvas.touchStartY = e.clientY;
  canvas.touchStartTime = performance.now();
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
    /* ignore */
  }
}

export function handleTouchMove(
  e: React.PointerEvent<Element>,
  ctx: PointerHandlersContext,
  canvas?: CanvasWithTouch,
): boolean {
  const { manager, boardRef, didDragRef, setState, onDragPreview } = ctx;
  if (!manager || !boardRef.current) return false;

  const c = canvas ?? (ctx.canvasRef.current as CanvasWithTouch);
  if (!c?.pendingPieceId || c.touchStartX == null || c.touchStartY == null) return false;

  const dist = Math.hypot(e.clientX - c.touchStartX, e.clientY - c.touchStartY);

  if (!c.touchDragStarted && dist >= TAP_DRAG_THRESHOLD_PX) {
    c.touchDragStarted = true;
    didDragRef.current = true;
    manager.pointerDown(
      c.pendingPieceId,
      c.touchStartX,
      c.touchStartY,
      c.pendingPieceRect!,
    );
    setState(manager.getState());
    soundManager.play("pickup");
  }

  if (c.touchDragStarted) {
    const boardRect = boardRef.current.getBoundingClientRect();
    manager.pointerMove(e.clientX, e.clientY, boardRect);

    const activeId = manager.getDragState().activeId;
    if (activeId && onDragPreview) {
      onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
    }
  }

  return true;
}

export function handleTouchUp(
  e: React.PointerEvent<Element>,
  ctx: PointerHandlersContext,
  canRotatePiece: (pid: string) => boolean,
  isPointerOverTray: (x: number, y: number) => boolean,
): void {
  const { manager, canvasRef, setState, haptic, selectCycle, onDragPreview } = ctx;
  if (!manager || !canvasRef.current) return;

  const canvas = canvasRef.current as CanvasWithTouch;
  const now = performance.now();

  const duration = now - (canvas.touchStartTime ?? now);
  const dx = Math.abs(e.clientX - (canvas.touchStartX ?? e.clientX));
  const dy = Math.abs(e.clientY - (canvas.touchStartY ?? e.clientY));
  const dist = Math.hypot(dx, dy);

  const isTap = duration < 180 && dist < 14 && manager.getDragState().activeId == null;

  if (isTap) {
    const canvasRect = canvas.getBoundingClientRect();
    const ctx2d = canvas.getContext("2d");
    if (ctx2d) {
      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      const st = manager.getState();
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
    onDragPreview?.(null);
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
    /* ignore */
  }
}
