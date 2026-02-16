/**
 * Touch handlers for piece drag, tap-to-rotate, pinch zoom.
 * Uses tap-vs-drag threshold (TAP_DRAG_THRESHOLD_PX) to distinguish taps from drags.
 */
import type React from "react";
import { soundManager } from "@/audio/sounds";
import type { CanvasWithTouch, ScreenToBoard } from "./types";
import { TAP_DRAG_THRESHOLD_PX, TAP_MAX_MS } from "./types";
import type { PointerHandlersContext } from "./types";
import { finishDragWithTrayCheck } from "./shared";
import { dragLog } from "./dragLog";

export function resetTouchState(canvas: CanvasWithTouch): void {
  canvas.touchStartX = undefined;
  canvas.touchStartY = undefined;
  canvas.touchStartTime = undefined;
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
  screenToBoard?: ScreenToBoard,
): void {
  const { manager, canvasRef, didDragRef, onPieceInteraction } = ctx;
  if (!manager) return;

  const canvas = canvasRef.current as CanvasWithTouch;
  if (!canvas) return;

  didDragRef.current = false;
  onPieceInteraction?.();
  e.preventDefault();

  ctx.activePointerIdRef.current = e.pointerId;
  canvas.touchStartX = e.clientX;
  canvas.touchStartY = e.clientY;
  canvas.touchStartTime = Date.now();
  canvas.touchDragStarted = false;
  canvas.pendingPieceId = pieceId;
  dragLog("down", { pieceId, x: e.clientX, y: e.clientY, pointerId: e.pointerId });

  canvas.pendingPieceRect =
    screenToBoard !== undefined
      ? null
      : new DOMRect(boardRect.left + piece.x, boardRect.top + piece.y, piece.w, piece.h);

  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}

export function handleTouchMove(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
  screenToBoard?: ScreenToBoard,
): boolean {
  const { manager, boardRef, didDragRef, setState, activePointerIdRef } = ctx;
  if (!manager || !boardRef.current) return false;
  if (activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) {
    return true;
  }

  const canvas = e.currentTarget as CanvasWithTouch;
  const sx = canvas.touchStartX;
  const sy = canvas.touchStartY;
  const pendingId = canvas.pendingPieceId;
  const pendingRect = canvas.pendingPieceRect;

  const useBoardSpace = !!screenToBoard;
  if (sx == null || sy == null || !pendingId) return false;
  if (!useBoardSpace && !pendingRect) return false;

  const dist = Math.hypot(e.clientX - sx, e.clientY - sy);

  if (!canvas.touchDragStarted && dist >= TAP_DRAG_THRESHOLD_PX) {
    canvas.touchDragStarted = true;
    didDragRef.current = true;
    ctx.onPieceInteraction?.();
    const boardRect = boardRef.current.getBoundingClientRect();
    if (screenToBoard) {
      const { x: boardX, y: boardY } = screenToBoard(sx, sy, boardRect);
      manager.pointerDownBoardSpace(pendingId, boardX, boardY);
    } else {
      manager.pointerDown(pendingId, sx, sy, pendingRect!);
    }
    setState(manager.getState());
  }

  if (canvas.touchDragStarted) {
    ctx.onPieceInteraction?.();
    const boardRect = boardRef.current.getBoundingClientRect();
    if (screenToBoard) {
      const { x: boardX, y: boardY } = screenToBoard(e.clientX, e.clientY, boardRect);
      manager.pointerMoveBoardSpace(boardX, boardY);
    } else {
      manager.pointerMove(e.clientX, e.clientY, boardRect);
    }
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
      const groupSize = piece
        ? st.pieces.filter((p) => p.groupId === piece.groupId).length
        : 0;
      if (groupSize === 1) {
        onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
      }
    }
  }
  return true;
}

export function handleTouchUp(
  e: React.PointerEvent<HTMLCanvasElement>,
  ctx: PointerHandlersContext,
  canRotatePiece: (pid: string) => boolean,
  isPointerOverTray: (x: number, y: number) => boolean,
  _screenToBoard?: ScreenToBoard,
): void {
  const {
    manager,
    canvasRef,
    setState,
    haptic,
    selectCycle,
    onDragPreview,
    onPieceInteraction,
  } = ctx;
  if (!manager || !canvasRef.current) return;

  const canvas = canvasRef.current as CanvasWithTouch;

  onPieceInteraction?.();
  dragLog("up", {
    x: e.clientX,
    y: e.clientY,
    activeId: manager.getDragState().activeId,
    pointerId: e.pointerId,
  });

  if (!dragStarted(canvas)) {
    // Touch tap: rotate (only if within time + distance threshold)
    const now = Date.now();
    const doubleFireWindow = 300;
    const recentlyRotated =
      (ctx.lastTapRotateTimeRef?.current ?? 0) > now - doubleFireWindow;
    if (!recentlyRotated) {
      const sx = canvas.touchStartX ?? 0;
      const sy = canvas.touchStartY ?? 0;
      const dist = Math.hypot(e.clientX - sx, e.clientY - sy);
      const elapsed =
        (canvas.touchStartTime ?? 0) > 0 ? now - canvas.touchStartTime! : Infinity;
      const pid = canvas.pendingPieceId;
      if (
        dist < TAP_DRAG_THRESHOLD_PX &&
        elapsed < TAP_MAX_MS &&
        pid &&
        canRotatePiece(pid)
      ) {
        if (ctx.lastTapRotateTimeRef) ctx.lastTapRotateTimeRef.current = now;
        onPieceInteraction?.();
        manager.rotatePiece(pid);
        soundManager.play("rotate");
        haptic?.("rotate");
        setState(manager.getState());
      }
    }
  } else {
    // Touch drag end: check for drop on tray
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
  ctx.activePointerIdRef.current = null;
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}

function dragStarted(canvas: CanvasWithTouch): boolean {
  return !!canvas.touchDragStarted;
}
