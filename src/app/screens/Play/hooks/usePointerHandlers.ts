// src/app/screens/Play/hooks/usePointerHandlers.ts
import { useCallback, useRef, useEffect } from "react";
import type React from "react";

import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";

const TAP_DRAG_THRESHOLD_PX = 10;

type Pending = {
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

  const pendingRef = useRef<Pending | null>(null);

  // Keep refs to current values for use in native event listeners
  const managerRef = useRef(manager);
  const setStateRef = useRef(setState);
  const onDragPreviewRef = useRef(onDragPreview);
  const selectCycleRef = useRef(selectCycle);
  const hapticRef = useRef(haptic);

  useEffect(() => {
    managerRef.current = manager;
    setStateRef.current = setState;
    onDragPreviewRef.current = onDragPreview;
    selectCycleRef.current = selectCycle;
    hapticRef.current = haptic;
  });

  const canRotatePiece = useCallback((pid: PieceId) => {
    const mgr = managerRef.current;
    if (!mgr) return false;
    const st = mgr.getState();
    const piece = st.pieces.find((p) => p.id === pid);
    if (!piece) return false;
    if (piece.isPlaced || piece.locked || piece.inTray) return false;
    const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
    return groupSize === 1;
  }, []);

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

  const pickPiece = useCallback(
    (
      clientX: number,
      clientY: number,
    ): { pieceId: PieceId; piece: Piece; boardRect: DOMRect } | null => {
      const mgr = managerRef.current;
      if (!mgr || !canvasRef.current || !boardRef.current) return null;

      const canvas = canvasRef.current;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return null;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const x = clientX - boardRect.left;
      const y = clientY - boardRect.top;

      const st = mgr.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, x, y);
      if (!pieceId) return null;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.locked) return null;

      return { pieceId, piece, boardRect };
    },
    [canvasRef, boardRef],
  );

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      const mgr = managerRef.current;
      if (!mgr) return;

      const overTray = isPointerOverTray(clientX, clientY);
      const activeId = mgr.getDragState().activeId;

      if (overTray && activeId) {
        mgr.sendToTray(activeId);
        selectCycleRef.current(1);
      }

      mgr.pointerUp();
    },
    [isPointerOverTray],
  );

  // MOUSE pointer handlers (desktop)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // Skip touch - handled by native touch events
      if (e.pointerType === "touch") return;

      const mgr = managerRef.current;
      if (!mgr || !canvasRef.current || !boardRef.current) return;
      if (e.button !== 0 && e.button !== 2) return;

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;

      const { pieceId, piece, boardRect } = picked;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      // Right-click rotate
      if (e.button === 2) {
        e.preventDefault();
        if (canRotatePiece(pieceId)) {
          mgr.rotatePiece(pieceId);
          soundManager.play("rotate");
          hapticRef.current?.("rotate");
          setStateRef.current(mgr.getState());
        }
        return;
      }

      // Left-click: start drag immediately for mouse
      e.preventDefault();
      didDragRef.current = false;

      const pieceRect = new DOMRect(
        boardRect.left + piece.x,
        boardRect.top + piece.y,
        piece.w,
        piece.h,
      );

      mgr.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
      soundManager.play("pickup");
      setStateRef.current(mgr.getState());

      pendingRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        pieceId,
        pieceRect,
        dragging: true,
      };
    },
    [
      canvasRef,
      boardRef,
      pickPiece,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      onPieceInteraction,
      canRotatePiece,
      didDragRef,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return;

      const mgr = managerRef.current;
      if (!mgr || !boardRef.current) return;

      const p = pendingRef.current;
      if (!p || !p.dragging) return;

      didDragRef.current = true;
      const boardRect = boardRef.current.getBoundingClientRect();
      mgr.pointerMove(e.clientX, e.clientY, boardRect);
      onPieceInteraction?.();

      const activeId = mgr.getDragState().activeId;
      if (activeId && onDragPreviewRef.current) {
        const st = mgr.getState();
        const piece = st.pieces.find((pp) => pp.id === activeId);
        const groupSize = piece
          ? st.pieces.filter((pp) => pp.groupId === piece.groupId).length
          : 0;
        if (groupSize === 1) {
          onDragPreviewRef.current({
            clientX: e.clientX,
            clientY: e.clientY,
            pieceId: activeId,
          });
        }
      }
    },
    [boardRef, didDragRef, onPieceInteraction],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return;

      const mgr = managerRef.current;
      if (!mgr) return;

      const p = pendingRef.current;
      pendingRef.current = null;

      onDragPreviewRef.current?.(null);

      if (p?.dragging) {
        finishDrag(e.clientX, e.clientY);
        setStateRef.current(mgr.getState());
      }

      didDragRef.current = false;
    },
    [finishDrag, didDragRef],
  );

  const handlePointerCancel = useCallback((_e: React.PointerEvent<HTMLElement>) => {
    const mgr = managerRef.current;
    if (!mgr) return;

    pendingRef.current = null;
    onDragPreviewRef.current?.(null);
    mgr.pointerUp();
    setStateRef.current(mgr.getState());
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // NATIVE TOUCH handlers for iOS/Android
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const mgr = managerRef.current;
      if (!mgr || !boardRef.current || e.touches.length === 0) return;

      const touch = e.touches[0];
      const picked = pickPiece(touch.clientX, touch.clientY);
      if (!picked) return;

      const { pieceId, piece, boardRect } = picked;

      // Prevent context menu and scrolling
      e.preventDefault();

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      pendingRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        pieceId,
        pieceRect: new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        ),
        dragging: false,
      };
      didDragRef.current = false;
    },
    [
      boardRef,
      pickPiece,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      onPieceInteraction,
      didDragRef,
    ],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const mgr = managerRef.current;
      if (!mgr || !boardRef.current || e.touches.length === 0) return;

      const p = pendingRef.current;
      if (!p) return;

      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - p.startX, touch.clientY - p.startY);

      // Start drag after threshold
      if (!p.dragging && dist >= TAP_DRAG_THRESHOLD_PX) {
        p.dragging = true;
        didDragRef.current = true;
        mgr.pointerDown(p.pieceId, p.startX, p.startY, p.pieceRect);
        soundManager.play("pickup");
      }

      if (p.dragging) {
        e.preventDefault();
        const boardRect = boardRef.current.getBoundingClientRect();
        mgr.pointerMove(touch.clientX, touch.clientY, boardRect);
        onPieceInteraction?.();

        const activeId = mgr.getDragState().activeId;
        if (activeId && onDragPreviewRef.current) {
          const st = mgr.getState();
          const piece = st.pieces.find((pp) => pp.id === activeId);
          const groupSize = piece
            ? st.pieces.filter((pp) => pp.groupId === piece.groupId).length
            : 0;
          if (groupSize === 1) {
            onDragPreviewRef.current({
              clientX: touch.clientX,
              clientY: touch.clientY,
              pieceId: activeId,
            });
          }
        }
      }
    },
    [boardRef, didDragRef, onPieceInteraction],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const mgr = managerRef.current;
      if (!mgr) return;

      const p = pendingRef.current;
      pendingRef.current = null;

      onDragPreviewRef.current?.(null);

      if (!p) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      if (p.dragging) {
        finishDrag(touch.clientX, touch.clientY);
        setStateRef.current(mgr.getState());
      } else {
        // Tap = rotate
        if (canRotatePiece(p.pieceId)) {
          mgr.rotatePiece(p.pieceId);
          soundManager.play("rotate");
          hapticRef.current?.("rotate");
          setStateRef.current(mgr.getState());
        }
      }

      didDragRef.current = false;
    },
    [finishDrag, canRotatePiece, didDragRef],
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture: handlePointerCancel,
    handleContextMenu,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
