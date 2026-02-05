import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { CanvasWithTouch, DragPreviewState } from "./pointerHandlers/types";
import {
  handleTouchDown,
  handleTouchMove,
  resetTouchState,
} from "./pointerHandlers/touchHandlers";
import { soundManager } from "@/audio/sounds";
import { finishDragWithTrayCheck } from "./pointerHandlers/shared";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "./pointerHandlers/mouseHandlers";

export function usePointerHandlers(args: {
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
  onDragPreview?: (state: DragPreviewState) => void;
  onPieceInteraction?: () => void;
}) {
  const {
    manager,
    boardRef,
    canvasRef,
    trayRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    didDragRef,
    selectCycle,
    setState,
    haptic,
    onDragPreview,
    onPieceInteraction,
  } = args;

  // Keep refs to always have fresh values in document listeners
  const managerRef = useRef(manager);
  const setStateRef = useRef(setState);
  const onDragPreviewRef = useRef(onDragPreview);
  const selectCycleRef = useRef(selectCycle);
  const hapticRef = useRef(haptic);
  const onPieceInteractionRef = useRef(onPieceInteraction);

  useEffect(() => {
    managerRef.current = manager;
    setStateRef.current = setState;
    onDragPreviewRef.current = onDragPreview;
    selectCycleRef.current = selectCycle;
    hapticRef.current = haptic;
    onPieceInteractionRef.current = onPieceInteraction;
  });

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      const mgr = managerRef.current;
      if (!mgr) return false;
      const st = mgr.getState();
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece) return false;
      if (piece.isPlaced || piece.locked || piece.inTray) return false;
      const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
      return groupSize === 1;
    },
    [],
  );

  const isPointerOverTray = useCallback(
    (clientX: number, clientY: number) => {
      const el = trayRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    },
    [trayRef],
  );

  const touchPendingRef = useRef(false);
  const activeTouchIdRef = useRef<number | null>(null);
  const clearTouchPending = useCallback(() => {
    touchPendingRef.current = false;
  }, []);

  // Build ctx that uses refs for values that change
  const getCtx = useCallback(() => ({
    manager: managerRef.current,
    boardRef,
    canvasRef,
    trayRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    didDragRef,
    selectCycle: selectCycleRef.current,
    setState: setStateRef.current,
    haptic: hapticRef.current,
    onDragPreview: onDragPreviewRef.current,
    onPieceInteraction: onPieceInteractionRef.current,
    clearTouchPending,
  }), [boardRef, canvasRef, trayRef, selectedIdRef, setSelectedPieceId, bump, didDragRef, clearTouchPending]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const mgr = managerRef.current;
      if (!mgr || !canvasRef.current || !boardRef.current || e.touches.length === 0)
        return;
      const touch = e.touches[0];
      const canvas = canvasRef.current as CanvasWithTouch;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;
      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cssX = touch.clientX - boardRect.left;
      const cssY = touch.clientY - boardRect.top;
      const st = mgr.getState();
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
      touchPendingRef.current = true;
      handleTouchDown(
        {
          clientX: touch.clientX,
          clientY: touch.clientY,
          pointerId: touch.identifier,
          preventDefault: () => e.preventDefault(),
        } as React.PointerEvent<Element>,
        getCtx(),
        pieceId,
        boardRect,
        piece,
      );
    },
    [boardRef, canvasRef, selectedIdRef, setSelectedPieceId, bump, getCtx],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === "touch") return;
      const mgr = managerRef.current;
      if (!mgr || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = mgr.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, cssX, cssY);
      if (!pieceId) return;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (piece?.locked) return;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      const isLeftClick = e.button === 0;
      if (isLeftClick || e.button === 2) {
        if (piece) {
          handleMouseDown(
            e,
            getCtx(),
            pieceId,
            boardRect,
            piece,
            canRotatePiece,
          );
        }
      }
    },
    [boardRef, canvasRef, selectedIdRef, setSelectedPieceId, bump, canRotatePiece, getCtx],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!managerRef.current || !boardRef.current) return;
      if (e.pointerType === "touch") return;
      handleMouseMove(e, getCtx());
    },
    [boardRef, getCtx],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!managerRef.current || !canvasRef.current) return;
      if (e.pointerType === "touch") return;
      handleMouseUp(e, getCtx(), isPointerOverTray);
    },
    [canvasRef, isPointerOverTray, getCtx],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const mgr = managerRef.current;
      if (!mgr || !canvasRef.current) return;
      const canvas = canvasRef.current as CanvasWithTouch;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      onDragPreviewRef.current?.(null);
      mgr.pointerUp();
      setStateRef.current(mgr.getState());
      if (e.pointerType === "touch") {
        resetTouchState(canvas);
      }
    },
    [canvasRef],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      handlePointerCancel(e);
    },
    [handlePointerCancel],
  );

  // Document-level touch listeners for iOS/Android
  useEffect(() => {
    const onTouchMove = (ev: TouchEvent) => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      const mgr = managerRef.current;
      if (!canvas?.pendingPieceId || !mgr || activeTouchIdRef.current == null) return;
      const t = Array.from(ev.touches).find(
        (x) => x.identifier === activeTouchIdRef.current,
      );
      if (!t) return;
      ev.preventDefault();
      handleTouchMove(
        {
          clientX: t.clientX,
          clientY: t.clientY,
          pointerId: t.identifier,
        } as PointerEvent,
        getCtx(),
        canvas,
      );
    };

    const onTouchEnd = (ev: TouchEvent) => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      const mgr = managerRef.current;
      if (!canvas || !mgr) return;
      const tid = activeTouchIdRef.current;
      if (tid == null) return;
      const t = Array.from(ev.changedTouches).find((x) => x.identifier === tid);
      if (!t) return;
      const hadDrag = canvas.touchDragStarted;
      const hadPending = !!canvas.pendingPieceId;
      activeTouchIdRef.current = null;
      if (!hadPending && !mgr.getDragState().activeId) return;
      ev.preventDefault();
      touchPendingRef.current = false;
      onDragPreviewRef.current?.(null);
      if (hadDrag) {
        finishDragWithTrayCheck(
          mgr,
          t.clientX,
          t.clientY,
          isPointerOverTray,
          selectCycleRef.current,
        );
        setStateRef.current(mgr.getState());
      } else if (hadPending && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const ctx2d = canvas.getContext("2d");
        if (ctx2d) {
          const dpr = window.devicePixelRatio || 1;
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
          const x = t.clientX - boardRect.left;
          const y = t.clientY - boardRect.top;
          const st = mgr.getState();
          const boardPieces = st.pieces.filter((p) => !p.inTray);
          const pid = pickPieceId(ctx2d, boardPieces, x, y);
          if (pid && canRotatePiece(pid)) {
            mgr.rotatePiece(pid);
            soundManager.play("rotate");
            setStateRef.current(mgr.getState());
          }
        }
      }
      resetTouchState(canvas);
    };

    document.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: false,
    });
    document.addEventListener("touchend", onTouchEnd, {
      capture: true,
      passive: false,
    });
    document.addEventListener("touchcancel", onTouchEnd, {
      capture: true,
      passive: false,
    });
    return () => {
      document.removeEventListener("touchmove", onTouchMove, { capture: true });
      document.removeEventListener("touchend", onTouchEnd, { capture: true });
      document.removeEventListener("touchcancel", onTouchEnd, { capture: true });
    };
  }, [canvasRef, boardRef, isPointerOverTray, canRotatePiece, getCtx]);

  // Safety net for window-level pointer up
  useEffect(() => {
    const onWinUp = () => {
      const mgr = managerRef.current;
      if (!mgr) return;
      const activeId = mgr.getDragState().activeId;
      if (!activeId) return;
      onDragPreviewRef.current?.(null);
      mgr.pointerUp();
      setStateRef.current(mgr.getState());
    };
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    return () => {
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
    };
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
    handleTouchStart,
  };
}
