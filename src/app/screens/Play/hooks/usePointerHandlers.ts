import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";

const DRAG_THRESHOLD = 12;

type DragState = {
  pointerId: number;
  pieceId: PieceId;
  startX: number;
  startY: number;
  rect: DOMRect;
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
  const argsRef = useRef(args);
  argsRef.current = args;

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

  const dragRef = useRef<DragState | null>(null);

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;
      const st = manager.getState();
      const p = st.pieces.find((x) => x.id === pid);
      if (!p || p.isPlaced || p.locked || p.inTray) return false;
      return st.pieces.filter((x) => x.groupId === p.groupId).length === 1;
    },
    [manager],
  );

  const isOverTray = useCallback(
    (x: number, y: number) => {
      const el = trayRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    },
    [trayRef],
  );

  const pickPiece = useCallback(
    (
      clientX: number,
      clientY: number,
    ): { pieceId: PieceId; piece: Piece; boardRect: DOMRect } | null => {
      if (!manager || !canvasRef.current || !boardRef.current) return null;

      const canvas = canvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const x = clientX - canvasRect.left;
      const y = clientY - canvasRect.top;

      const st = manager.getState();
      const pid = pickPieceId(
        ctx,
        st.pieces.filter((p) => !p.inTray),
        x,
        y,
      );
      if (!pid) return null;

      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece || piece.locked) return null;

      return { pieceId: pid, piece, boardRect: canvasRect };
    },
    [manager, canvasRef, boardRef],
  );

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!manager) return;
      if (isOverTray(clientX, clientY)) {
        const activeId = manager.getDragState().activeId;
        if (activeId) {
          manager.sendToTray(activeId);
          selectCycle(1);
        }
      }
      manager.pointerUp();
    },
    [manager, isOverTray, selectCycle],
  );

  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;
      if (isTouchDevice && e.pointerType === "touch") return;

      e.preventDefault();

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;

      const { pieceId, piece, boardRect } = picked;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      if (e.button === 2 && canRotatePiece(pieceId)) {
        manager.rotatePiece(pieceId);
        soundManager.play("rotate");
        haptic?.("rotate");
        setState(manager.getState());
        return;
      }

      dragRef.current = {
        pointerId: e.pointerId,
        pieceId,
        startX: e.clientX,
        startY: e.clientY,
        rect: new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        ),
        dragging: false,
      };

      try {
        boardRef.current?.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [
      manager,
      boardRef,
      canvasRef,
      pickPiece,
      canRotatePiece,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      onPieceInteraction,
      haptic,
      setState,
      isTouchDevice,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !boardRef.current) return;
      if (isTouchDevice && e.pointerType === "touch") return;

      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;

      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);

      if (!d.dragging && dist > DRAG_THRESHOLD) {
        d.dragging = true;
        didDragRef.current = true;
        manager.pointerDown(d.pieceId, d.startX, d.startY, d.rect);
        soundManager.play("pickup");
      }

      if (!d.dragging) return;

      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return;
      manager.pointerMove(e.clientX, e.clientY, r);
      onPieceInteraction?.();

      const activeId = manager.getDragState().activeId;
      if (activeId && onDragPreview) {
        const st = manager.getState();
        const p = st.pieces.find((x) => x.id === activeId);
        const groupSize = p ? st.pieces.filter((x) => x.groupId === p.groupId).length : 0;
        if (groupSize === 1) {
          onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
        }
      }

      setState(manager.getState());
      e.preventDefault();
    },
    [
      manager,
      boardRef,
      canvasRef,
      didDragRef,
      onPieceInteraction,
      onDragPreview,
      setState,
      isTouchDevice,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager) return;
      if (isTouchDevice && e.pointerType === "touch") return;

      onDragPreview?.(null);

      const d = dragRef.current;
      dragRef.current = null;

      if (d?.dragging) {
        finishDrag(e.clientX, e.clientY);
        setState(manager.getState());
      } else if (d && canRotatePiece(d.pieceId)) {
        manager.rotatePiece(d.pieceId);
        soundManager.play("rotate");
        haptic?.("rotate");
        setState(manager.getState());
      }

      didDragRef.current = false;

      try {
        boardRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [
      manager,
      boardRef,
      finishDrag,
      canRotatePiece,
      haptic,
      setState,
      didDragRef,
      onDragPreview,
      isTouchDevice,
    ],
  );

  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent<HTMLElement>) => {
      if (!manager) return;
      dragRef.current = null;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
    },
    [manager, onDragPreview, setState],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // iOS/Android: document-level touch listeners (passive: false)
  // setPointerCapture fails when finger moves outside element
  useEffect(() => {
    if (!isTouchDevice) return;

    let cancelled = false;
    let removeListeners: (() => void) | null = null;

    const attach = () => {
      if (cancelled) return;
      const boardEl = argsRef.current.boardRef.current;
      if (!boardEl) {
        requestAnimationFrame(attach);
        return;
      }

    type TouchDrag = {
      touchId: number;
      startX: number;
      startY: number;
      pieceId: PieceId;
      rect: DOMRect;
      dragging: boolean;
    };
    const touchDragRef = { current: null as TouchDrag | null };

    const getTouch = (e: TouchEvent, id: number): Touch | null => {
      const list = e.touches.length ? e.touches : e.changedTouches;
      for (let i = 0; i < list.length; i++) {
        if (list[i].identifier === id) return list[i];
      }
      return null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const { manager, canvasRef, boardRef } = argsRef.current;
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      const canvas = canvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width < 10 || canvasRect.height < 10) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const x = touch.clientX - canvasRect.left;
      const y = touch.clientY - canvasRect.top;

      const st = manager.getState();
      const pid = pickPieceId(
        ctx,
        st.pieces.filter((p) => !p.inTray),
        x,
        y,
      );
      if (!pid) return;

      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece || piece.locked) return;

      e.preventDefault();
      argsRef.current.didDragRef.current = false;
      argsRef.current.onPieceInteraction?.();
      argsRef.current.selectedIdRef.current = pid;
      argsRef.current.setSelectedPieceId(pid);
      argsRef.current.bump();

      touchDragRef.current = {
        touchId: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        pieceId: pid,
        rect: new DOMRect(
          canvasRect.left + piece.x,
          canvasRect.top + piece.y,
          piece.w,
          piece.h,
        ),
        dragging: false,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const t = touchDragRef.current;
      if (!t) return;

      const touch = getTouch(e, t.touchId);
      if (!touch) return;

      const { manager, boardRef, setState, onDragPreview } = argsRef.current;
      if (!manager || !boardRef.current) return;

      const dist = Math.hypot(touch.clientX - t.startX, touch.clientY - t.startY);

      if (!t.dragging && dist > DRAG_THRESHOLD) {
        t.dragging = true;
        argsRef.current.didDragRef.current = true;
        manager.pointerDown(t.pieceId, t.startX, t.startY, t.rect);
        soundManager.play("pickup");
      }

      if (t.dragging) {
        e.preventDefault();
        const r = argsRef.current.canvasRef.current?.getBoundingClientRect();
        if (!r) return;
        manager.pointerMove(touch.clientX, touch.clientY, r);
        argsRef.current.onPieceInteraction?.();

        const activeId = manager.getDragState().activeId;
        if (activeId && onDragPreview) {
          const st = manager.getState();
          const p = st.pieces.find((x) => x.id === activeId);
          const groupSize = p
            ? st.pieces.filter((x) => x.groupId === p.groupId).length
            : 0;
          if (groupSize === 1) {
            onDragPreview({
              clientX: touch.clientX,
              clientY: touch.clientY,
              pieceId: activeId,
            });
          }
        }
        setState(manager.getState());
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const t = touchDragRef.current;
      if (!t) return;

      const touch = getTouch(e, t.touchId);
      if (!touch) return;

      touchDragRef.current = null;
      const { manager, setState } = argsRef.current;

      argsRef.current.onDragPreview?.(null);

      if (t.dragging) {
        const overTray = argsRef.current.trayRef.current
          ? (() => {
              const r = argsRef.current.trayRef.current!.getBoundingClientRect();
              return (
                touch.clientX >= r.left &&
                touch.clientX <= r.right &&
                touch.clientY >= r.top &&
                touch.clientY <= r.bottom
              );
            })()
          : false;
        if (overTray && manager) {
          const activeId = manager.getDragState().activeId;
          if (activeId) {
            manager.sendToTray(activeId);
            argsRef.current.selectCycle(1);
          }
        }
        manager?.pointerUp();
      } else if (t.pieceId && manager) {
        const st = manager.getState();
        const piece = st.pieces.find((p) => p.id === t.pieceId);
        const canRotate =
          piece &&
          !piece.isPlaced &&
          !piece.locked &&
          !piece.inTray &&
          st.pieces.filter((p) => p.groupId === piece.groupId).length === 1;
        if (canRotate) {
          manager.rotatePiece(t.pieceId);
          soundManager.play("rotate");
          argsRef.current.haptic?.("rotate");
        }
      }

      if (manager) setState(manager.getState());
      argsRef.current.didDragRef.current = false;
    };

    const handleTouchCancel = (e: TouchEvent) => {
      const t = touchDragRef.current;
      if (!t || !getTouch(e, t.touchId)) return;

      touchDragRef.current = null;
      argsRef.current.onDragPreview?.(null);
      argsRef.current.manager?.pointerUp();
      if (argsRef.current.manager) {
        argsRef.current.setState(argsRef.current.manager.getState());
      }
    };

    const opts = { passive: false, capture: true };
    boardEl.addEventListener("touchstart", handleTouchStart, opts);
    document.addEventListener("touchmove", handleTouchMove, opts);
    document.addEventListener("touchend", handleTouchEnd, opts);
    document.addEventListener("touchcancel", handleTouchCancel, opts);

    removeListeners = () => {
      boardEl.removeEventListener("touchstart", handleTouchStart, opts);
      document.removeEventListener("touchmove", handleTouchMove, opts);
      document.removeEventListener("touchend", handleTouchEnd, opts);
      document.removeEventListener("touchcancel", handleTouchCancel, opts);
    };
    };
    attach();

    return () => {
      cancelled = true;
      removeListeners?.();
    };
  }, [isTouchDevice]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture: handlePointerCancel,
    handleContextMenu,
  };
}
