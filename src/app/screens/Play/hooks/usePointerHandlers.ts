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

  // === POINTER HANDLERS (mouse + touch via pointer events) ===
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !boardRef.current) return;

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;
      const { pieceId, piece } = picked;

      e.preventDefault();

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      // Touch: delay drag until movement (tap = rotate)
      if (e.pointerType === "touch") {
        const boardRect = boardRef.current.getBoundingClientRect();
        touchStartRef.current = {
          x: e.clientX,
          y: e.clientY,
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
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }

      // Right click = rotate (mouse only)
      if (e.button === 2) {
        if (canRotatePiece(pieceId)) {
          manager.rotatePiece(pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        }
        return;
      }

      // Left click = start drag immediately (mouse)
      if (e.button === 0) {
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

      // Touch: check if we should start drag (tap vs drag threshold)
      if (e.pointerType === "touch" && touchStartRef.current) {
        const start = touchStartRef.current;
        const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);

        if (!isDraggingRef.current && dist >= TAP_THRESHOLD) {
          isDraggingRef.current = true;
          didDragRef.current = true;
          manager.pointerDown(start.pieceId, start.x, start.y, start.pieceRect);
          soundManager.play("pickup");
        }

        if (isDraggingRef.current) {
          e.preventDefault();
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
              onDragPreview({
                clientX: e.clientX,
                clientY: e.clientY,
                pieceId: activeId,
              });
            }
          }
        }
        return;
      }

      // Mouse: only when dragging
      if (e.pointerType !== "touch" && !manager.getDragState().activeId) return;

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
      if (!manager) return;

      onDragPreview?.(null);

      // Touch: use touch end logic
      if (e.pointerType === "touch") {
        if (!touchStartRef.current) return;

        if (isDraggingRef.current) {
          finishDrag(e.clientX, e.clientY);
          setState(manager.getState());
        } else {
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
      } else {
        // Mouse
        finishDrag(e.clientX, e.clientY);
        setState(manager.getState());
        didDragRef.current = false;
      }

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [manager, onDragPreview, finishDrag, setState, canRotatePiece, haptic, didDragRef],
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
  };
}
