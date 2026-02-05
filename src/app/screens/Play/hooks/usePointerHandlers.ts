// src/app/screens/Play/hooks/usePointerHandlers.ts

import { useCallback, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";

const TAP_THRESHOLD = 8;

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

  // Touch state
  const touchStartRef = useRef<{
    x: number;
    y: number;
    pieceId: string;
    pieceRect: DOMRect;
  } | null>(null);
  const isDraggingRef = useRef(false);

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

  const pickPiece = useCallback(
    (clientX: number, clientY: number): { pieceId: string; piece: Piece } | null => {
      if (!manager || !canvasRef.current || !boardRef.current) return null;
      const canvas = canvasRef.current;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return null;

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

      return { pieceId, piece };
    },
    [manager, canvasRef, boardRef],
  );

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!manager) return;
      const overTray = isPointerOverTray(clientX, clientY);

      if (overTray) {
        const activeId = manager.getDragState().activeId;
        if (activeId) {
          manager.sendToTray(activeId);
          selectCycle(1);
        }
      }

      manager.pointerUp();
    },
    [manager, isPointerOverTray, selectCycle],
  );

  // === TOUCH HANDLERS ===
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!manager || !boardRef.current || e.touches.length === 0) return;
      e.preventDefault();
      const touch = e.touches[0];
      const picked = pickPiece(touch.clientX, touch.clientY);
      if (!picked) return;
      const { pieceId, piece } = picked;
      const boardRect = boardRef.current.getBoundingClientRect();

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        pieceId,
        pieceRect: new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        ),
      };
      isDraggingRef.current = false;
      didDragRef.current = false;
    },
    [
      manager,
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
      if (
        !manager ||
        !boardRef.current ||
        !touchStartRef.current ||
        e.touches.length === 0
      )
        return;

      const touch = e.touches[0];
      const start = touchStartRef.current;
      const dist = Math.hypot(touch.clientX - start.x, touch.clientY - start.y);

      // Start drag if moved enough
      if (!isDraggingRef.current && dist >= TAP_THRESHOLD) {
        isDraggingRef.current = true;
        didDragRef.current = true;
        manager.pointerDown(start.pieceId, start.x, start.y, start.pieceRect);
        soundManager.play("pickup");
      }

      if (isDraggingRef.current) {
        e.preventDefault();
        const boardRect = boardRef.current.getBoundingClientRect();
        manager.pointerMove(touch.clientX, touch.clientY, boardRect);
        onPieceInteraction?.();

        // Drag preview for single pieces
        const activeId = manager.getDragState().activeId;
        if (activeId && onDragPreview) {
          const st = manager.getState();
          const piece = st.pieces.find((p) => p.id === activeId);
          const groupSize = piece
            ? st.pieces.filter((p) => p.groupId === piece.groupId).length
            : 0;
          if (groupSize === 1) {
            onDragPreview({
              clientX: touch.clientX,
              clientY: touch.clientY,
              pieceId: activeId,
            });
          }
        }
      }
    },
    [manager, boardRef, didDragRef, onPieceInteraction, onDragPreview],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!manager || !touchStartRef.current) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      onDragPreview?.(null);

      if (isDraggingRef.current) {
        // Finish drag
        finishDrag(touch.clientX, touch.clientY);
        setState(manager.getState());
      } else {
        // Tap = rotate
        const start = touchStartRef.current;
        if (canRotatePiece(start.pieceId)) {
          manager.rotatePiece(start.pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        }
      }

      touchStartRef.current = null;
      isDraggingRef.current = false;
    },
    [manager, onDragPreview, finishDrag, setState, canRotatePiece, haptic],
  );

  // === MOUSE/POINTER HANDLERS ===
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return; // Touch handled separately
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;
      const { pieceId, piece } = picked;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      // Right click = rotate
      if (e.button === 2) {
        e.preventDefault();
        if (canRotatePiece(pieceId)) {
          manager.rotatePiece(pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        }
        return;
      }

      // Left click = start drag
      if (e.button === 0) {
        e.preventDefault();
        const boardRect = boardRef.current.getBoundingClientRect();
        const pieceRect = new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        );
        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        soundManager.play("pickup");
        setState(manager.getState());
        didDragRef.current = false;
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
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
      canRotatePiece,
      haptic,
      setState,
      didDragRef,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return;
      if (!manager || !boardRef.current) return;
      if (!manager.getDragState().activeId) return;

      didDragRef.current = true;
      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
      onPieceInteraction?.();

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
    },
    [manager, boardRef, didDragRef, onPieceInteraction, onDragPreview],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return;
      if (!manager || !canvasRef.current) return;

      onDragPreview?.(null);
      finishDrag(e.clientX, e.clientY);
      setState(manager.getState());
      didDragRef.current = false;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [manager, canvasRef, onDragPreview, finishDrag, setState, didDragRef],
  );

  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent<HTMLElement>) => {
      if (!manager) return;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
      touchStartRef.current = null;
      isDraggingRef.current = false;
    },
    [manager, onDragPreview, setState],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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
