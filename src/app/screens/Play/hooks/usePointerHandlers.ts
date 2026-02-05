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

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;
      const st = manager.getState();
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece) return false;
      if (piece.isPlaced || piece.locked || piece.inTray) return false;
      const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
      return groupSize === 1;
    },
    [manager],
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

  const ctx = {
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
    clearTouchPending,
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current || e.touches.length === 0)
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
      touchPendingRef.current = true;
      handleTouchDown(
        {
          clientX: touch.clientX,
          clientY: touch.clientY,
          pointerId: touch.identifier,
          preventDefault: () => e.preventDefault(),
        } as React.PointerEvent<Element>,
        ctx,
        pieceId,
        boardRect,
        piece,
      );
    },
    [manager, boardRef, canvasRef, selectedIdRef, setSelectedPieceId, bump],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === "touch") return;
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = manager.getState();
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
          const handled = handleMouseDown(
            e,
            ctx,
            pieceId,
            boardRect,
            piece,
            canRotatePiece,
          );
          if (handled) return;
        }
      }
    },
    [
      manager,
      boardRef,
      canvasRef,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      canRotatePiece,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current) return;
      if (e.pointerType === "touch") return;
      handleMouseMove(e, ctx);
    },
    [manager, boardRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;
      if (e.pointerType === "touch") return;
      handleMouseUp(e, ctx, isPointerOverTray);
    },
    [manager, canvasRef, canRotatePiece, isPointerOverTray],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;
      const canvas = canvasRef.current as CanvasWithTouch;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
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
    },
    [manager, canvasRef, onDragPreview, setState],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      handlePointerCancel(e);
    },
    [handlePointerCancel],
  );

  // Document-level listeners for mobile: iOS Safari often doesn't deliver pointermove/up
  // to the canvas even with setPointerCapture. Capture phase ensures we get events.
  useEffect(() => {
    if (!manager) return;

    const onDocMove = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch") return;
      const canvas = canvasRef.current as CanvasWithTouch | null;
      if (!canvas?.pendingPieceId) return;
      if (ev.target === canvas) return;
      handleTouchMove(ev, ctx, canvas);
    };

    const onDocUp = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch") return;
      const canvas = canvasRef.current as CanvasWithTouch | null;
      if (!canvas) return;
      const hadDrag = canvas.touchDragStarted;
      const hadPending = !!canvas.pendingPieceId;
      if (!hadPending && !manager.getDragState().activeId) return;
      touchPendingRef.current = false;
      onDragPreview?.(null);
      if (hadDrag) {
        finishDragWithTrayCheck(
          manager,
          ev.clientX,
          ev.clientY,
          isPointerOverTray,
          selectCycle,
        );
        setState(manager.getState());
      } else if (hadPending && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const ctx2d = canvas.getContext("2d");
        if (ctx2d) {
          const dpr = window.devicePixelRatio || 1;
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
          const x = ev.clientX - boardRect.left;
          const y = ev.clientY - boardRect.top;
          const st = manager.getState();
          const boardPieces = st.pieces.filter((p) => !p.inTray);
          const pid = pickPieceId(ctx2d, boardPieces, x, y);
          if (pid && canRotatePiece(pid)) {
            manager.rotatePiece(pid);
            soundManager.play("rotate");
            setState(manager.getState());
          }
        }
      }
      resetTouchState(canvas);
      try {
        canvas.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onTouchMove = (ev: TouchEvent) => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      if (!canvas?.pendingPieceId || activeTouchIdRef.current == null) return;
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
        ctx,
        canvas,
      );
    };

    const onTouchEnd = (ev: TouchEvent) => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      const mgr = manager;
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
      onDragPreview?.(null);
      if (hadDrag) {
        finishDragWithTrayCheck(
          mgr,
          t.clientX,
          t.clientY,
          isPointerOverTray,
          selectCycle,
        );
        setState(mgr.getState());
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
            setState(mgr.getState());
          }
        }
      }
      resetTouchState(canvas);
    };

    document.addEventListener("pointermove", onDocMove, { capture: true });
    document.addEventListener("pointerup", onDocUp, { capture: true });
    document.addEventListener("pointercancel", onDocUp, { capture: true });
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
      document.removeEventListener("pointermove", onDocMove, { capture: true });
      document.removeEventListener("pointerup", onDocUp, { capture: true });
      document.removeEventListener("pointercancel", onDocUp, { capture: true });
      document.removeEventListener("touchmove", onTouchMove, { capture: true });
      document.removeEventListener("touchend", onTouchEnd, { capture: true });
      document.removeEventListener("touchcancel", onTouchEnd, { capture: true });
    };
  }, [
    manager,
    canvasRef,
    boardRef,
    onDragPreview,
    setState,
    isPointerOverTray,
    selectCycle,
    canRotatePiece,
  ]);

  useEffect(() => {
    const onWinUp = () => {
      if (!manager) return;
      const activeId = manager.getDragState().activeId;
      if (!activeId) return;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
    };
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    return () => {
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
    };
  }, [manager, onDragPreview, setState]);

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
