/**
 * Native touch event handlers for iOS Safari compatibility.
 *
 * iOS Safari has several issues that prevent pointer events from working correctly:
 * 1. setPointerCapture() doesn't reliably dispatch events when touch moves outside the element
 * 2. preventDefault() on touch events requires passive: false - React's synthetic events don't support this
 * 3. Touch events must use document-level listeners to capture touchmove/touchend when finger moves outside
 *
 * This hook attaches native touch listeners with { passive: false } to properly handle touch on iOS.
 */
import { useEffect, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { CanvasWithTouch, DragPreviewState } from "./pointerHandlers/types";
import { TAP_DRAG_THRESHOLD_PX } from "./pointerHandlers/types";
import { finishDragWithTrayCheck } from "./pointerHandlers/shared";
import { soundManager } from "@/audio/sounds";

type TouchHandlersArgs = {
  manager: PuzzleManager | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  trayRef: React.RefObject<HTMLDivElement | null>;
  selectedIdRef: React.MutableRefObject<PieceId | null>;
  setSelectedPieceId: (id: PieceId | null) => void;
  bump: () => void;
  didDragRef: React.MutableRefObject<boolean>;
  selectCycle: (dir: 1 | -1) => void;
  setState: (st: PuzzleState) => void;
  haptic?: (kind: HapticKind) => void;
  onDragPreview?: (state: DragPreviewState | null) => void;
  onPieceInteraction?: () => void;
};

function getTouchById(e: TouchEvent, id: number): Touch | null {
  const list = e.touches.length > 0 ? e.touches : e.changedTouches;
  for (let i = 0; i < list.length; i++) {
    if (list[i].identifier === id) return list[i];
  }
  return null;
}

function findTouchInChanged(e: TouchEvent, id: number): Touch | null {
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === id) return e.changedTouches[i];
  }
  return null;
}

export function useTouchHandlers(args: TouchHandlersArgs) {
  const argsRef = useRef(args);
  argsRef.current = args;

  const activeTouchIdRef = useRef<number | null>(null);

  const canRotatePiece = (pid: PieceId): boolean => {
    const { manager } = argsRef.current;
    if (!manager) return false;
    const st = manager.getState();
    const piece = st.pieces.find((p) => p.id === pid);
    if (!piece) return false;
    if (piece.isPlaced || piece.locked || piece.inTray) return false;
    const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
    return groupSize === 1;
  };

  const isPointerOverTray = (x: number, y: number): boolean => {
    const { trayRef } = argsRef.current;
    const el = trayRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  useEffect(() => {
    const boardEl = argsRef.current.boardRef.current;
    if (!boardEl) return;

    const handleTouchStart = (e: TouchEvent) => {
      const { manager, canvasRef, boardRef, selectedIdRef, setSelectedPieceId, bump } =
        argsRef.current;
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      const canvasRect = canvas.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cssX = touch.clientX - canvasRect.left;
      const cssY = touch.clientY - canvasRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, cssX, cssY);
      if (!pieceId) return;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.locked) return;

      e.preventDefault();
      activeTouchIdRef.current = touch.identifier;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      const { didDragRef, onPieceInteraction } = argsRef.current;
      didDragRef.current = false;
      onPieceInteraction?.();

      canvas.touchStartX = touch.clientX;
      canvas.touchStartY = touch.clientY;
      canvas.touchStartTime = performance.now();
      canvas.touchDragStarted = false;
      canvas.pendingPieceId = pieceId;
      canvas.pendingPieceRect = new DOMRect(
        canvasRect.left + piece.x,
        canvasRect.top + piece.y,
        piece.w,
        piece.h,
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchId = activeTouchIdRef.current;
      if (touchId == null) return;

      const touch = getTouchById(e, touchId);
      if (!touch) return;

      const { manager, boardRef, canvasRef, setState, onDragPreview } = argsRef.current;
      if (!manager || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      if (
        !canvas?.pendingPieceId ||
        canvas.touchStartX == null ||
        canvas.touchStartY == null
      ) {
        return;
      }

      const dist = Math.hypot(
        touch.clientX - canvas.touchStartX,
        touch.clientY - canvas.touchStartY,
      );

      if (!canvas.touchDragStarted && dist >= TAP_DRAG_THRESHOLD_PX) {
        const { didDragRef } = argsRef.current;
        canvas.touchDragStarted = true;
        didDragRef.current = true;
        manager.pointerDown(
          canvas.pendingPieceId,
          canvas.touchStartX,
          canvas.touchStartY,
          canvas.pendingPieceRect!,
        );
        setState(manager.getState());
        soundManager.play("pickup");
      }

      if (canvas.touchDragStarted) {
        e.preventDefault();
        const boardRect = boardRef.current.getBoundingClientRect();
        manager.pointerMove(touch.clientX, touch.clientY, boardRect);

        const activeId = manager.getDragState().activeId;
        if (activeId && onDragPreview) {
          onDragPreview({
            clientX: touch.clientX,
            clientY: touch.clientY,
            pieceId: activeId,
          });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchId = activeTouchIdRef.current;
      if (touchId == null) return;

      const touch = findTouchInChanged(e, touchId);
      if (!touch) return;

      activeTouchIdRef.current = null;

      const { manager, canvasRef, setState, haptic, selectCycle, onDragPreview } =
        argsRef.current;
      if (!manager || !canvasRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      const now = performance.now();

      const duration = now - (canvas.touchStartTime ?? now);
      const dx = Math.abs(touch.clientX - (canvas.touchStartX ?? touch.clientX));
      const dy = Math.abs(touch.clientY - (canvas.touchStartY ?? touch.clientY));
      const dist = Math.hypot(dx, dy);

      const isTap =
        duration < 180 && dist < 14 && manager.getDragState().activeId == null;

      if (isTap) {
        const canvasRect = canvas.getBoundingClientRect();
        const ctx2d = canvas.getContext("2d");
        if (ctx2d) {
          const dpr = window.devicePixelRatio || 1;
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
          const x = touch.clientX - canvasRect.left;
          const y = touch.clientY - canvasRect.top;
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
          touch.clientX,
          touch.clientY,
          isPointerOverTray,
          selectCycle,
        );
        setState(manager.getState());
      }

      canvas.touchStartX = undefined;
      canvas.touchStartY = undefined;
      canvas.touchStartTime = undefined;
      canvas.touchDragStarted = false;
      canvas.pendingPieceId = null;
      canvas.pendingPieceRect = null;

      // Clear after pointerup has fired (same tick) - prevents double-handling
      setTimeout(() => {
        activeTouchIdRef.current = null;
      }, 0);
    };

    const handleTouchCancel = (e: TouchEvent) => {
      const touchId = activeTouchIdRef.current;
      if (touchId == null) return;

      const touch = findTouchInChanged(e, touchId);
      if (!touch) return;

      const { manager, canvasRef, setState, onDragPreview } = argsRef.current;
      if (manager && canvasRef.current) {
        onDragPreview?.(null);
        manager.pointerUp();
        setState(manager.getState());

        const canvas = canvasRef.current as CanvasWithTouch;
        canvas.touchStartX = undefined;
        canvas.touchStartY = undefined;
        canvas.touchStartTime = undefined;
        canvas.touchDragStarted = false;
        canvas.pendingPieceId = null;
        canvas.pendingPieceRect = null;
      }

      setTimeout(() => {
        activeTouchIdRef.current = null;
      }, 0);
    };

    const passiveFalse = { passive: false, capture: true };

    boardEl.addEventListener("touchstart", handleTouchStart, passiveFalse);
    document.addEventListener("touchmove", handleTouchMove, passiveFalse);
    document.addEventListener("touchend", handleTouchEnd, passiveFalse);
    document.addEventListener("touchcancel", handleTouchCancel, passiveFalse);

    return () => {
      boardEl.removeEventListener("touchstart", handleTouchStart, passiveFalse);
      document.removeEventListener("touchmove", handleTouchMove, passiveFalse);
      document.removeEventListener("touchend", handleTouchEnd, passiveFalse);
      document.removeEventListener("touchcancel", handleTouchCancel, passiveFalse);
    };
  }, []);

  return { activeTouchIdRef };
}
