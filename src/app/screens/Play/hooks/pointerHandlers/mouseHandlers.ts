/**
 * Mouse handlers: left=drag, middle=pan, right=context menu. No tap threshold.
 */
import type React from "react";
import { soundManager } from "@/audio/sounds";
import type { CanvasWithTouch, ScreenToBoard } from "./types";
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
  screenToBoard?: ScreenToBoard,
): boolean {
  const { manager, canvasRef, didDragRef, setState, haptic, onPieceInteraction } = ctx;
  if (!manager) return false;

  // Right click = rotate (desktop)
  if (e.button === 2) {
    e.preventDefault();
    if (!canRotatePiece(pieceId)) return false;

    onPieceInteraction?.();
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

    onPieceInteraction?.();
    ctx.onDragStarted?.();
    if (screenToBoard) {
      const { x: boardX, y: boardY } = screenToBoard(e.clientX, e.clientY, boardRect);
      manager.pointerDownBoardSpace(pieceId, boardX, boardY);
    } else {
      const pieceRect = new DOMRect(
        boardRect.left + piece.x,
        boardRect.top + piece.y,
        piece.w,
        piece.h,
      );
      manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
    }
    dragLog("down", { pieceId, x: e.clientX, y: e.clientY, pointerId: e.pointerId });
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
  screenToBoard?: ScreenToBoard,
): void {
  const { manager, boardRef, didDragRef, onDragPreview, onPieceInteraction } = ctx;
  if (!manager || !boardRef.current) return;

  didDragRef.current = true;
  onPieceInteraction?.();
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
  _screenToBoard?: ScreenToBoard,
): void {
  const {
    manager,
    canvasRef,
    didDragRef,
    setState,
    selectCycle,
    onDragPreview,
    onPieceInteraction,
  } = ctx;
  if (!manager || !canvasRef.current) return;

  const canvas = canvasRef.current as CanvasWithTouch;

  onPieceInteraction?.();
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
  ctx.onDragEnded?.();

  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}
