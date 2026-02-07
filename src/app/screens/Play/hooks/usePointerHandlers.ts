// src/app/screens/Play/hooks/usePointerHandlers.ts
import { useCallback, useRef } from "react";
import type React from "react";

import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";

const TAP_DRAG_THRESHOLD_PX = 12;

type Pending = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  pieceId: PieceId;
  pieceRect: DOMRect;
  dragging: boolean;
};

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
  onDragPreview?: (state: DragPreviewState | null) => void;
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

  // Pointer-events only. No native touch listeners. No dual pipelines.
  const pendingRef = useRef<Pending | null>(null);

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;
      const st = manager.getState();
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece) return false;
      if (piece.isPlaced || piece.locked || piece.inTray) return false;

      // Only allow rotate for single-piece groups
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
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      // Skip if we already handled this touch via touchstart (touch events fire first on iOS)
      if (e.pointerType === "touch" && canvas.pendingPieceId) return;

      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return null;

      // Hit test in CSS pixels
      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const x = clientX - boardRect.left;
      const y = clientY - boardRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, x, y);
      if (!pieceId) return null;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.locked) return null;

      return { pieceId, piece, boardRect };
    },
    [manager, canvasRef, boardRef],
  );

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!manager) return;

      const overTray = isPointerOverTray(clientX, clientY);
      const activeId = manager.getDragState().activeId;

      if (overTray && activeId) {
        // Put the active piece into the tray. Then end drag.
        manager.sendToTray(activeId);
        selectCycle(1);
      }

      manager.pointerUp();
    },
    [manager, isPointerOverTray, selectCycle],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      // Left click / touch only. Right-click handled as rotate below.
      if (e.button !== 0 && e.button !== 2) return;

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;

      const { pieceId, piece, boardRect } = picked;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      // Desktop right-click rotate
      if (e.pointerType !== "touch" && e.button === 2) {
        e.preventDefault();
        if (canRotatePiece(pieceId)) {
          manager.rotatePiece(pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        }
        return;
      }

      e.preventDefault();
      didDragRef.current = false;

      const pieceRect = new DOMRect(
        boardRect.left + piece.x,
        boardRect.top + piece.y,
        piece.w,
        piece.h,
      );

      pendingRef.current = {
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
        pieceId,
        pieceRect,
        dragging: false,
      };

      // Capture on the canvas so iOS keeps sending move/up.
      try {
        canvasRef.current.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [
      manager,
      canvasRef,
      boardRef,
      pickPiece,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      onPieceInteraction,
      canRotatePiece,
      haptic,
      setState,
      didDragRef,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !boardRef.current) return;

      const p = pendingRef.current;
      if (!p) return;
      if (e.pointerId !== p.pointerId) return;

      const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);

      if (!p.dragging && dist >= TAP_DRAG_THRESHOLD_PX) {
        p.dragging = true;
        didDragRef.current = true;

        manager.pointerDown(p.pieceId, p.startX, p.startY, p.pieceRect);
        soundManager.play("pickup");
      }

      if (!p.dragging) return;

      e.preventDefault();
      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
      onPieceInteraction?.();

      const activeId = manager.getDragState().activeId;
      if (activeId && onDragPreview) {
        const st = manager.getState();
        const piece = st.pieces.find((pp) => pp.id === activeId);
        const groupSize = piece
          ? st.pieces.filter((pp) => pp.groupId === piece.groupId).length
          : 0;
        if (groupSize === 1) {
          onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
        }
      }
    },
    [manager, boardRef, didDragRef, onPieceInteraction, onDragPreview],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current) return;

      const p = pendingRef.current;
      pendingRef.current = null;

      onDragPreview?.(null);

      if (!p || e.pointerId !== p.pointerId) return;

      if (p.dragging) {
        finishDrag(e.clientX, e.clientY);
        setState(manager.getState());
      } else {
        // Tap = rotate (touch tap or mouse click-release)
        if (canRotatePiece(p.pieceId)) {
          manager.rotatePiece(p.pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        }
      }

      didDragRef.current = false;

      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [
      manager,
      canvasRef,
      onDragPreview,
      finishDrag,
      setState,
      canRotatePiece,
      haptic,
      didDragRef,
    ],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current) return;

      pendingRef.current = null;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());

      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [manager, canvasRef, onDragPreview, setState],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
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

    const onTouchMove = (ev: TouchEvent) => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      if (!canvas?.pendingPieceId || activeTouchIdRef.current == null) return;
      const touch = Array.from(ev.touches).find(
        (t) => t.identifier === activeTouchIdRef.current,
      );
      if (!touch) return;
      ev.preventDefault();
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
      handleTouchMove(
        {
          clientX: touch.clientX,
          clientY: touch.clientY,
          pointerId: touch.identifier,
        } as PointerEvent,
        freshCtx,
        canvas,
      );
    };

    const onTouchEnd = (ev: TouchEvent) => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      const mgr = managerRef.current;
      if (!canvas || !mgr) return;
      const tid = activeTouchIdRef.current;
      if (tid == null) return;
      const touch = Array.from(ev.changedTouches).find((t) => t.identifier === tid);
      if (!touch) return;

      const hadDrag = canvas.touchDragStarted;
      const hadPending = !!canvas.pendingPieceId;
      activeTouchIdRef.current = null;
      if (!hadPending && !mgr.getDragState().activeId) return;

      ev.preventDefault();
      touchPendingRef.current = false;
      if (hadDrag) {
        dragPreviewRef.current?.(null);
        finishDragWithTrayCheck(
          mgr,
          touch.clientX,
          touch.clientY,
          isPointerOverTray,
          selectCycle,
        );
        stateSetterRef.current(mgr.getState());
      } else if (hadPending && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const ctx2d = canvas.getContext("2d");
        if (ctx2d) {
          const dpr = window.devicePixelRatio || 1;
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
          const x = touch.clientX - boardRect.left;
          const y = touch.clientY - boardRect.top;
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
    };

    document.addEventListener("pointermove", onDocMove, { capture: true });
    document.addEventListener("pointerup", onDocUp, { capture: true });
    document.addEventListener("pointercancel", onDocUp, { capture: true });
    document.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: false,
    });
    document.addEventListener("touchend", onTouchEnd, { capture: true, passive: false });
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
    handleTouchStart,
  };
}
