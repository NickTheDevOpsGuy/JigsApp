import { useCallback, useRef } from "react";
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

  const touchPendingRef = useRef(false);
  const clearTouchPending = () => {
    touchPendingRef.current = false;
  };

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
    clearTouchPending,
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
    (x: number, y: number) => {
      const el = trayRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    },
    [trayRef],
  );

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
      if (!piece || piece.locked) return;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      if (e.pointerType === "touch") {
        e.preventDefault();
        touchPendingRef.current = true;
        handleTouchDown(e, ctx, pieceId, boardRect, piece);
        return;
      }

      handleMouseDown(e, ctx, pieceId, boardRect, piece, canRotatePiece);
    },
    [manager, boardRef, canvasRef, bump, canRotatePiece],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
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
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current) return;

      if (e.pointerType === "touch") {
        handleTouchUp(e, ctx, canRotatePiece, isPointerOverTray);
        return;
      }

      handleMouseUp(e, ctx, isPointerOverTray);
    },
    [manager, canvasRef, canRotatePiece, isPointerOverTray],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager) return;
      const canvas = canvasRef.current as CanvasWithTouch | null;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
      if (e.pointerType === "touch" && canvas) {
        resetTouchState(canvas);
        clearTouchPending();
      }
    },
    [manager, canvasRef, onDragPreview, setState],
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
