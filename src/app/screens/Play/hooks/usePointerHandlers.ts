import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { CanvasWithTouch, DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";
import {
  handleTouchDown,
  handleTouchMove,
  handleTouchUp,
  resetTouchState,
} from "./pointerHandlers/touchHandlers";
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
  const clearTouchPending = useCallback(() => {
    touchPendingRef.current = false;
  }, []);

  // Use refs for values needed in document listeners to avoid stale closures
  const managerRef = useRef(manager);
  const stateSetterRef = useRef(setState);
  const dragPreviewRef = useRef(onDragPreview);
  const hapticRef = useRef(haptic);
  const onPieceInteractionRef = useRef(onPieceInteraction);

  useEffect(() => {
    managerRef.current = manager;
    stateSetterRef.current = setState;
    dragPreviewRef.current = onDragPreview;
    hapticRef.current = haptic;
    onPieceInteractionRef.current = onPieceInteraction;
  });

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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
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

      const isTouch = e.pointerType === "touch";
      const isLeftClick = e.button === 0;

      if (isTouch && piece) {
        touchPendingRef.current = true;
        handleTouchDown(e, ctx, pieceId, boardRect, piece);
        return;
      }

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
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !boardRef.current) return;

      const isTouch = e.pointerType === "touch";
      if (isTouch) {
        const handled = handleTouchMove(e, ctx);
        if (handled) return;
        return;
      }

      handleMouseMove(e, ctx);
    },
    [manager, boardRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current) return;

      const isTouch = e.pointerType === "touch";

      if (isTouch) {
        handleTouchUp(e, ctx, canRotatePiece, isPointerOverTray);
        return;
      }

      handleMouseUp(e, ctx, isPointerOverTray);
    },
    [manager, canvasRef, canRotatePiece, isPointerOverTray],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current) return;
      const canvas = canvasRef.current as CanvasWithTouch;
      // ensure drag state clears even if the browser cancels the pointer sequence
      try {
        // release capture if we had it
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
      // reset touch bookkeeping to avoid "stuck" drags
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
    (e: React.PointerEvent<HTMLElement>) => {
      // treat as cancel
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

      // Build fresh ctx with current refs
      const freshCtx = {
        manager: managerRef.current,
        boardRef,
        canvasRef,
        trayRef,
        selectedIdRef,
        setSelectedPieceId,
        bump,
        didDragRef,
        selectCycle,
        setState: stateSetterRef.current,
        haptic: hapticRef.current,
        onDragPreview: dragPreviewRef.current,
        onPieceInteraction: onPieceInteractionRef.current,
        clearTouchPending,
      };
      handleTouchMove(ev, freshCtx, canvas);
    };

    const onDocUp = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch") return;
      const canvas = canvasRef.current as CanvasWithTouch | null;
      const mgr = managerRef.current;
      if (!canvas || !mgr) return;

      const hadDrag = canvas.touchDragStarted;
      const hadPending = !!canvas.pendingPieceId;
      if (!hadPending && !mgr.getDragState().activeId) return;

      touchPendingRef.current = false;
      if (hadDrag) {
        ev.preventDefault();
        ev.stopPropagation();
        dragPreviewRef.current?.(null);
        finishDragWithTrayCheck(
          mgr,
          ev.clientX,
          ev.clientY,
          isPointerOverTray,
          selectCycle,
        );
        stateSetterRef.current(mgr.getState());
      } else if (hadPending && boardRef.current) {
        ev.preventDefault();
        ev.stopPropagation();
        const boardRect = boardRef.current.getBoundingClientRect();
        const ctx2d = canvas.getContext("2d");
        if (ctx2d) {
          const dpr = window.devicePixelRatio || 1;
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
          const x = ev.clientX - boardRect.left;
          const y = ev.clientY - boardRect.top;
          const st = mgr.getState();
          const boardPieces = st.pieces.filter((p) => !p.inTray);
          const pid = pickPieceId(ctx2d, boardPieces, x, y);
          if (pid && canRotatePiece(pid)) {
            mgr.rotatePiece(pid);
            soundManager.play("rotate");
            stateSetterRef.current(mgr.getState());
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

    document.addEventListener("pointermove", onDocMove, { capture: true });
    document.addEventListener("pointerup", onDocUp, { capture: true });
    document.addEventListener("pointercancel", onDocUp, { capture: true });
    return () => {
      document.removeEventListener("pointermove", onDocMove, { capture: true });
      document.removeEventListener("pointerup", onDocUp, { capture: true });
      document.removeEventListener("pointercancel", onDocUp, { capture: true });
    };
  }, [
    manager,
    canvasRef,
    boardRef,
    trayRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    didDragRef,
    isPointerOverTray,
    selectCycle,
    canRotatePiece,
    clearTouchPending,
  ]);

  // Safety net: pointerup/pointercancel on window when drag is active (e.g. release outside canvas)
  useEffect(() => {
    const onWinUp = () => {
      const mgr = managerRef.current;
      if (!mgr) return;
      const activeId = mgr.getDragState().activeId;
      if (!activeId) return;
      dragPreviewRef.current?.(null);
      mgr.pointerUp();
      stateSetterRef.current(mgr.getState());
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
  };
}
