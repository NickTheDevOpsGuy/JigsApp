import { useCallback, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { soundManager } from "@/audio/sounds";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";

type CanvasWithLongPress = HTMLCanvasElement & {
  longPressTimer?: ReturnType<typeof setTimeout>;
  longPressFired?: boolean;
};

const TAP_DRAG_THRESHOLD_PX = 12; // how far finger must move to count as drag
const LONG_PRESS_MS = 500;

type PendingTouch = {
  pointerId: number;
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

  const clearLongPress = useCallback((canvas: CanvasWithLongPress) => {
    if (canvas.longPressTimer) {
      clearTimeout(canvas.longPressTimer);
      canvas.longPressTimer = undefined;
    }
  }, []);

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;

      const st = manager.getState();
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece) return false;

      // placed pieces never rotate
      if (piece.isPlaced) return false;

      // tray pieces should not rotate from board interactions
      if (piece.inTray) return false;

      // only allow rotate for single-piece groups
      const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
      return groupSize === 1;
    },
    [manager],
  );

  const pickPiece = useCallback(
    (clientX: number, clientY: number): { pieceId: PieceId; piece: Piece; boardRect: DOMRect } | null => {
      if (!manager || !canvasRef.current || !boardRef.current) return null;

      const canvas = canvasRef.current;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // IMPORTANT: hit-test in same coordinate space as rendering (DPR)
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cssX = clientX - boardRect.left;
      const cssY = clientY - boardRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx, boardPieces, cssX, cssY);
      if (!pieceId) return null;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.locked) return null;

      return { pieceId, piece, boardRect };
    },
    [manager, canvasRef, boardRef],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithLongPress;
      canvas.longPressFired = false;

      // prevent browser gestures/context menu paths
      e.preventDefault();

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;

      const { pieceId, piece, boardRect } = picked;

      // select
      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();

      // Right click = rotate (desktop)
      if (e.pointerType !== "touch" && e.button === 2) {
        if (!canRotatePiece(pieceId)) return;

        manager.rotatePiece(pieceId);
        soundManager.play("rotate");
        haptic?.("rotate");
        setState(manager.getState());
        return;
      }

      // Middle click = send to tray (desktop)
      if (e.pointerType !== "touch" && e.button === 1) {
        manager.sendToTray(pieceId);
        setState(manager.getState());
        selectCycle(1);
        return;
      }

      const isTouch = e.pointerType === "touch";
      didDragRef.current = false;

      const pieceRect = new DOMRect(
        boardRect.left + piece.x,
        boardRect.top + piece.y,
        piece.w,
        piece.h,
      );

      // Mouse: start drag immediately.
      if (!isTouch) {
        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        soundManager.play("pickup");
        setState(manager.getState());

        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        return;
      }

      // Touch: DO NOT start drag yet.
      // Wait for movement beyond threshold so taps can rotate.
      pendingTouchRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        pieceId,
        pieceRect,
        dragging: false,
      };

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      // Long press sends to tray (touch)
      canvas.longPressTimer = setTimeout(() => {
        canvas.longPressFired = true;

        // If drag started, end it cleanly first
        manager.pointerUp();

        manager.sendToTray(pieceId);
        setState(manager.getState());
        selectCycle(1);

        // make sure pointerUp doesn't count as tap-rotate
        didDragRef.current = true;

        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        pendingTouchRef.current = null;
      }, LONG_PRESS_MS);
    },
    [
      manager,
      canvasRef,
      boardRef,
      pickPiece,
      selectedIdRef,
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

      // Touch path: start drag only after threshold
      if (e.pointerType === "touch") {
        const pending = pendingTouchRef.current;
        if (!pending || pending.pointerId !== e.pointerId) return;

        const dist = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);

        if (!pending.dragging && dist >= TAP_DRAG_THRESHOLD_PX) {
          pending.dragging = true;
          didDragRef.current = true;

          // once we’re dragging, cancel long press
          clearLongPress(canvas);

          manager.pointerDown(pending.pieceId, pending.startX, pending.startY, pending.pieceRect);
          soundManager.play("pickup");
        }

        if (!pending.dragging) return;

        e.preventDefault();
        const boardRect = boardRef.current.getBoundingClientRect();
        manager.pointerMove(e.clientX, e.clientY, boardRect);
        setState(manager.getState());
        return;
      }

      // Mouse path: if dragging is active, move it
      if (!manager.getDragState().activeId) return;

      didDragRef.current = true;
      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
      setState(manager.getState());
    },
    [manager, boardRef, canvasRef, didDragRef, setState, clearLongPress],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      const canvas = canvasRef.current as CanvasWithLongPress;
      clearLongPress(canvas);

      // If long press fired, do nothing else
      if (canvas.longPressFired) {
        canvas.longPressFired = false;
        pendingTouchRef.current = null;
        didDragRef.current = false;
        return;
      }

      if (e.pointerType === "touch") {
        const pending = pendingTouchRef.current;
        pendingTouchRef.current = null;

        // Tap (no drag): rotate the originally pressed piece
        if (pending && !pending.dragging && !didDragRef.current) {
          if (canRotatePiece(pending.pieceId)) {
            manager.rotatePiece(pending.pieceId);
            soundManager.play("rotate");
            haptic?.("rotate");
          }
          setState(manager.getState());

          try {
            canvas.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }

          didDragRef.current = false;
          return;
        }

        // Drag ended
        manager.pointerUp();
        setState(manager.getState());

        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        didDragRef.current = false;
        return;
      }

      // Mouse up
      manager.pointerUp();
      setState(manager.getState());
      didDragRef.current = false;

      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [manager, canvasRef, clearLongPress, didDragRef, setState, haptic, canRotatePiece],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return { handlePointerDown, handlePointerMove, handlePointerUp, handleContextMenu };
}