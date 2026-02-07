import { useCallback, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { soundManager } from "@/audio/sounds";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";

const TAP_DRAG_THRESHOLD_PX = 12;
const LONG_PRESS_MS = 500;

type PendingTouch = {
  pointerId: number;
  startX: number;
  startY: number;
  pieceId: PieceId;
  pieceRect: DOMRect;
  dragging: boolean;
};

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

  const pendingTouchRef = useRef<PendingTouch | null>(null);

  const clearLongPress = (canvas: CanvasWithLongPress) => {
    if (canvas.longPressTimer) {
      clearTimeout(canvas.longPressTimer);
      canvas.longPressTimer = undefined;
    }
  };

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;
      const st = manager.getState();
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece || piece.isPlaced || piece.inTray) return false;
      return st.pieces.filter((p) => p.groupId === piece.groupId).length === 1;
    },
    [manager],
  );

  const pickPiece = (
    clientX: number,
    clientY: number,
  ): { pieceId: PieceId; piece: Piece; boardRect: DOMRect } | null => {
    if (!manager || !canvasRef.current || !boardRef.current) return null;
    const canvas = canvasRef.current;
    const boardRect = boardRef.current.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const x = clientX - boardRect.left;
    const y = clientY - boardRect.top;

    const st = manager.getState();
    const boardPieces = st.pieces.filter((p) => !p.inTray);
    const pieceId = pickPieceId(ctx, boardPieces, x, y);
    if (!pieceId) return null;

    const piece = st.pieces.find((p) => p.id === pieceId);
    if (!piece || piece.locked) return null;

    return { pieceId, piece, boardRect };
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithLongPress;
      canvas.longPressFired = false;
      e.preventDefault();

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;

      const { pieceId, piece, boardRect } = picked;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      if (e.pointerType !== "touch" && e.button === 2) {
        if (canRotatePiece(pieceId)) {
          manager.rotatePiece(pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        }
        return;
      }

      if (e.pointerType !== "touch" && e.button === 1) {
        manager.sendToTray(pieceId);
        setState(manager.getState());
        selectCycle(1);
        return;
      }

      didDragRef.current = false;

      const pieceRect = new DOMRect(
        boardRect.left + piece.x,
        boardRect.top + piece.y,
        piece.w,
        piece.h,
      );

      if (e.pointerType !== "touch") {
        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        soundManager.play("pickup");
        setState(manager.getState());
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      pendingTouchRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        pieceId,
        pieceRect,
        dragging: false,
      };

      canvas.setPointerCapture(e.pointerId);

      canvas.longPressTimer = setTimeout(() => {
        canvas.longPressFired = true;
        manager.pointerUp();
        manager.sendToTray(pieceId);
        setState(manager.getState());
        selectCycle(1);
        didDragRef.current = true;
        pendingTouchRef.current = null;
      }, LONG_PRESS_MS);
    },
    [
      manager,
      canvasRef,
      boardRef,
      setSelectedPieceId,
      bump,
      didDragRef,
      setState,
      selectCycle,
      haptic,
      canRotatePiece,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current as CanvasWithLongPress;

      if (e.pointerType === "touch") {
        const pending = pendingTouchRef.current;
        if (!pending || pending.pointerId !== e.pointerId) return;

        const dist = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);
        if (!pending.dragging && dist >= TAP_DRAG_THRESHOLD_PX) {
          pending.dragging = true;
          didDragRef.current = true;
          clearLongPress(canvas);
          manager.pointerDown(
            pending.pieceId,
            pending.startX,
            pending.startY,
            pending.pieceRect,
          );
          soundManager.play("pickup");
        }

        if (!pending.dragging) return;
        const rect = boardRef.current.getBoundingClientRect();
        manager.pointerMove(e.clientX, e.clientY, rect);
        setState(manager.getState());
        return;
      }

      if (!manager.getDragState().activeId) return;
      const rect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, rect);
      setState(manager.getState());
    },
    [manager, boardRef, canvasRef, didDragRef, setState],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;
      const canvas = canvasRef.current as CanvasWithLongPress;
      clearLongPress(canvas);

      if (canvas.longPressFired) {
        canvas.longPressFired = false;
        pendingTouchRef.current = null;
        didDragRef.current = false;
        return;
      }

      if (e.pointerType === "touch") {
        const pending = pendingTouchRef.current;
        pendingTouchRef.current = null;

        if (pending && !pending.dragging && canRotatePiece(pending.pieceId)) {
          manager.rotatePiece(pending.pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        } else {
          manager.pointerUp();
          setState(manager.getState());
        }

        didDragRef.current = false;
        return;
      }

      manager.pointerUp();
      setState(manager.getState());
      didDragRef.current = false;
    },
    [manager, canvasRef, didDragRef, setState, haptic, canRotatePiece],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleContextMenu,
  };
}
