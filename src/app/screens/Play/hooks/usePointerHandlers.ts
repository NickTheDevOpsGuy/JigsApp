import { useCallback } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { soundManager } from "@/audio/sounds";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";

type CanvasWithLongPress = HTMLCanvasElement & {
  longPressTimer?: ReturnType<typeof setTimeout>;
  longPressFired?: boolean;
};

export function usePointerHandlers(args: {
  manager: PuzzleManager | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
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

      // Hard lock: placed pieces never rotate
      if (piece.isPlaced) return false;

      // Pieces in tray should not rotate from board interactions
      if (piece.inTray) return false;

      // If a piece is merged into a group, rotating it would desync the group
      const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
      if (groupSize > 1) return false;

      return true;
    },
    [manager],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithLongPress;
      canvas.longPressFired = false;

      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Hit testing uses CSS pixel space
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx, boardPieces, cssX, cssY);
      if (!pieceId) return;

      // Select what we clicked
      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      // Middle click = send to tray (desktop)
      if (e.button === 1) {
        e.preventDefault();
        manager.movePieceToTray(pieceId);
        setState(manager.getState());
        selectCycle(1);
        return;
      }

      // Touch or left click = start drag
      const isTouch = e.pointerType === "touch";
      const isLeftClick = e.button === 0;

      if (isTouch || isLeftClick) {
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (!piece) return;

        didDragRef.current = false;
        e.preventDefault();

        const pieceRect = new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        );

        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        setState(manager.getState());

        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        // Long-press on touch to send to tray
        if (isTouch) {
          canvas.longPressTimer = setTimeout(() => {
            canvas.longPressFired = true;

            // End any active drag cleanly before moving to tray
            manager.pointerUp();
            manager.movePieceToTray(pieceId);
            setState(manager.getState());

            // Prevent the subsequent pointerUp from being treated as a "tap to rotate"
            didDragRef.current = true;

            try {
              canvas.releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }, 500);
        }
      }

      // Right click = rotate (desktop)
      if (e.button === 2) {
        e.preventDefault();

        if (!canRotatePiece(pieceId)) return;

        manager.rotatePiece(pieceId);
        soundManager.play("rotate");
        haptic?.("rotate");
        setState(manager.getState());
      }
    },
    [
      manager,
      boardRef,
      canvasRef,
      selectedIdRef,
      setSelectedPieceId,
      bump,
      didDragRef,
      selectCycle,
      setState,
      haptic,
      canRotatePiece,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current) return;

      const canvas = e.currentTarget as CanvasWithLongPress;
      if (canvas.longPressTimer) {
        clearTimeout(canvas.longPressTimer);
        canvas.longPressTimer = undefined;
      }

      // Mark drag (so we can differentiate tap vs drag)
      didDragRef.current = true;

      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
    },
    [manager, boardRef, didDragRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      const canvas = canvasRef.current as CanvasWithLongPress;
      if (canvas.longPressTimer) {
        clearTimeout(canvas.longPressTimer);
        canvas.longPressTimer = undefined;
      }

      // If a long-press action fired, do not treat this as a "tap to rotate"
      if (canvas.longPressFired) {
        canvas.longPressFired = false;
        didDragRef.current = false;
        return;
      }

      const isTouch = e.pointerType === "touch";
      const boardRect = boardRef.current?.getBoundingClientRect();
      const ctx = canvas.getContext("2d");

      // Single tap to rotate on touch (tap without dragging)
      if (isTouch && boardRect && ctx && !didDragRef.current) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const st = manager.getState();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;

        // Only consider board pieces for tap-rotate (tray pieces should not be hittable here)
        const boardPieces = st.pieces.filter((p) => !p.inTray);
        const pid = pickPieceId(ctx, boardPieces, x, y);

        if (pid && canRotatePiece(pid)) {
          manager.rotatePiece(pid);
          soundManager.play("rotate");
          haptic?.("rotate");
        }
      }

      manager.pointerUp();
      setState(manager.getState());

      // Reset drag marker for next interaction
      didDragRef.current = false;

      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [manager, canvasRef, boardRef, didDragRef, setState, haptic, canRotatePiece],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return { handlePointerDown, handlePointerMove, handlePointerUp, handleContextMenu };
}
