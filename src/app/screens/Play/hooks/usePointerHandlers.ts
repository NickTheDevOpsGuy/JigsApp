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

  const pickPiece = useCallback(
    (
      clientX: number,
      clientY: number,
    ): { pieceId: PieceId; piece: Piece; boardRect: DOMRect } | null => {
      if (!manager || !canvasRef.current || !boardRef.current) return null;

      const canvas = canvasRef.current;
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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
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
