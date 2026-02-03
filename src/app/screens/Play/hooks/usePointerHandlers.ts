import { useCallback } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { CanvasWithTouch } from "./pointerHandlers/types";
import {
  handleTouchDown,
  handleTouchMove,
  handleTouchUp,
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
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
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
    (e: React.PointerEvent<HTMLCanvasElement>) => {
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
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      const canvas = canvasRef.current as CanvasWithTouch;
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

  return { handlePointerDown, handlePointerMove, handlePointerUp, handleContextMenu };
}
