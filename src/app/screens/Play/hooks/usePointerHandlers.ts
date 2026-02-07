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
  handleTouchUp,
  resetTouchState,
} from "./pointerHandlers/touchHandlers";

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

  const managerRef = useRef<PuzzleManager | null>(null);
  managerRef.current = manager;

  const ctx = {
    manager: managerRef.current,
    managerRef,
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
    clearTouchPending: () => {},
  };

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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      // Prevent default for touch to stop scrolling
      if (e.pointerType === "touch") {
        e.preventDefault();
      }

      const canvas = canvasRef.current as CanvasWithTouch;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      // IMPORTANT: match render transform (CSS-space drawing w/ DPR transform)
      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, cssX, cssY);
      if (!pieceId) return;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.locked) return;

      if (e.pointerType === "touch") {
        handleTouchDown(e, ctx, pieceId, boardRect, piece);
        return;
      }

      const handled = handleMouseDown(e, ctx, pieceId, boardRect, piece, canRotatePiece);
      if (handled) return;
    },
    [
      manager,
      boardRef,
      canvasRef,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      canRotatePiece,
      onPieceInteraction,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current) return;

      if (e.pointerType === "touch") {
        const canvas = canvasRef.current as CanvasWithTouch | null;
        if (!canvas) return;

        const moved = handleTouchMove(e, ctx, canvas);
        if (moved && canvas.touchDragStarted) e.preventDefault();
        return;
      }

      handleMouseMove(e, ctx);
    },
    [manager, boardRef, canvasRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      if (e.pointerType === "touch") {
        handleTouchUp(e, ctx, canRotatePiece, isPointerOverTray);
        return;
      }

      handleMouseUp(e, ctx, isPointerOverTray);
    },
    [manager, canvasRef, isPointerOverTray, canRotatePiece],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager) return;

      const canvas = canvasRef.current as CanvasWithTouch | null;

      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());

      if (e.pointerType === "touch" && canvas) {
        resetTouchState(canvas);
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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Safety: if window loses focus mid-drag, clear drag state
  useEffect(() => {
    if (!manager) return;

    const onBlur = () => {
      const canvas = canvasRef.current as CanvasWithTouch | null;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
      if (canvas) resetTouchState(canvas);
    };

    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [manager, canvasRef, onDragPreview, setState]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  };
}
