import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { soundManager } from "@/audio/sounds";
import type { CanvasWithTouch } from "./types";
import { TAP_DRAG_THRESHOLD_PX } from "./types";
import type { PointerHandlersContext } from "./types";
import { finishDragWithTrayCheck } from "./shared";
import { dragLog } from "./dragLog";

export function resetTouchState(canvas: CanvasWithTouch): void {
  canvas.touchStartX = undefined;
  canvas.touchStartY = undefined;
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
  canvas.touchDragStarted = false;
  canvas.pendingPieceId = pieceId;

  dragLog("down", { pieceId, x: e.clientX, y: e.clientY, pointerId: e.pointerId });

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
  e: React.PointerEvent<Element> | PointerEvent,
  ctx: PointerHandlersContext,
  canvas?: CanvasWithTouch,
): boolean {
  const { manager, boardRef, canvasRef, didDragRef, setState } = ctx;
  if (!manager || !boardRef.current) return false;

  const canvasEl =
    canvas ??
    (canvasRef?.current as CanvasWithTouch) ??
    (e.currentTarget as CanvasWithTouch);

  if (!canvasEl) return false;

  const sx = canvasEl.touchStartX;
  const sy = canvasEl.touchStartY;
  const pendingId = canvasEl.pendingPieceId;
  const pendingRect = canvasEl.pendingPieceRect;

  if (sx == null || sy == null || !pendingId || !pendingRect) return false;

  const dist = Math.hypot(e.clientX - sx, e.clientY - sy);

  if (!canvasEl.touchDragStarted && dist >= TAP_DRAG_THRESHOLD_PX) {
    canvasEl.touchDragStarted = true;
    didDragRef.current = true;
    ctx.onPieceInteraction?.();

    manager.pointerDown(pendingId, sx, sy, pendingRect);
    setState(manager.getState());
  }

  if (canvasEl.touchDragStarted) {
    ctx.onPieceInteraction?.();
    const boardRect = boardRef.current.getBoundingClientRect();
    manager.pointerMove(e.clientX, e.clientY, boardRect);

    dragLog("move", {
      x: e.clientX,
      y: e.clientY,
      activeId: manager.getDragState().activeId,
    });

    const { onDragPreview } = ctx;
    const activeId = manager.getDragState().activeId;
    if (activeId && onDragPreview) {
      const st = manager.getState();
      const piece = st.pieces.find((p) => p.id === activeId);
      const groupSize = piece ? st.pieces.filter((p) => p.groupId === piece.groupId).length : 0;
      if (groupSize === 1) {
        onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
      }
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
  const { manager, boardRef, canvasRef, setState, haptic, selectCycle, onDragPreview, onPieceInteraction } =
    ctx;
  if (!manager || !canvasRef.current) return;

  const canvas = canvasRef.current as CanvasWithTouch;
  const boardRect = boardRef.current?.getBoundingClientRect();
  const ctx2d = canvas.getContext("2d");

  onPieceInteraction?.();

  dragLog("up", {
    x: e.clientX,
    y: e.clientY,
    activeId: manager.getDragState().activeId,
    pointerId: e.pointerId,
  });

  if (!dragStarted(canvas)) {
    // Tap: rotate (hit-test must match render DPR transform)
    if (boardRect && ctx2d) {
      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const x = e.clientX - boardRect.left;
      const y = e.clientY - boardRect.top;

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
    // Drag end
    onDragPreview?.(null);
    finishDragWithTrayCheck(manager, e.clientX, e.clientY, isPointerOverTray, selectCycle);
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