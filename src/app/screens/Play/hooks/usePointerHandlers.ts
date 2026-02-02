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

  // Touch gesture state (to distinguish tap vs drag)
  touchStartX?: number;
  touchStartY?: number;
  touchDragStarted?: boolean;
  pendingPieceId?: PieceId | null;
  pendingPieceRect?: DOMRect | null;
};

const TAP_DRAG_THRESHOLD_PX = 6;
const LONG_PRESS_MS = 500;

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

      // User lock: locked pieces cannot be rotated
      if (piece.locked) return false;

      // Pieces in tray should not rotate from board interactions
      if (piece.inTray) return false;

      // If a piece is merged into a group, rotating it would desync the group
      const groupSize = st.pieces.filter((p) => p.groupId === piece.groupId).length;
      if (groupSize > 1) return false;

      return true;
    },
    [manager],
  );

  const clearLongPress = (canvas: CanvasWithLongPress) => {
    if (canvas.longPressTimer) {
      clearTimeout(canvas.longPressTimer);
      canvas.longPressTimer = undefined;
    }
  };

  const resetTouchState = (canvas: CanvasWithLongPress) => {
    canvas.touchStartX = undefined;
    canvas.touchStartY = undefined;
    canvas.touchDragStarted = false;
    canvas.pendingPieceId = null;
    canvas.pendingPieceRect = null;
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current as CanvasWithLongPress;

      // Reset per-interaction flags
      canvas.longPressFired = false;
      clearLongPress(canvas);

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

      // Locked pieces cannot be interacted with (no select, drag, or long-press)
      const piece = st.pieces.find((p) => p.id === pieceId);
      if (piece?.locked) return;

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

      const isTouch = e.pointerType === "touch";
      const isLeftClick = e.button === 0;

      // Right click = rotate (desktop)
      if (e.button === 2) {
        e.preventDefault();
        if (!canRotatePiece(pieceId)) return;

        manager.rotatePiece(pieceId);
        soundManager.play("rotate");
        haptic?.("rotate");
        setState(manager.getState());
        return;
      }

      // Touch: do NOT start dragging immediately.
      // We wait until the finger moves past a small threshold.
      if (isTouch) {
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (!piece) return;

        didDragRef.current = false;
        e.preventDefault();

        canvas.touchStartX = e.clientX;
        canvas.touchStartY = e.clientY;
        canvas.touchDragStarted = false;

        canvas.pendingPieceId = pieceId;
        canvas.pendingPieceRect = new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        );

        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        // Long-press to send to tray (touch)
        canvas.longPressTimer = setTimeout(() => {
          canvas.longPressFired = true;

          // If a drag started, end it cleanly before moving to tray.
          if (canvas.touchDragStarted) {
            manager.pointerUp();
          }

          manager.movePieceToTray(pieceId);
          setState(manager.getState());

          // Prevent a subsequent pointerUp from being treated as tap-rotate
          didDragRef.current = true;

          try {
            canvas.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }

          resetTouchState(canvas);
        }, LONG_PRESS_MS);

        return;
      }

      // Mouse left click: start drag immediately (desktop behavior)
      if (isLeftClick) {
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

      const isTouch = e.pointerType === "touch";

      // Touch: only begin drag after threshold
      if (isTouch) {
        if (canvas.longPressFired) return;

        const sx = canvas.touchStartX;
        const sy = canvas.touchStartY;
        const pendingId = canvas.pendingPieceId;
        const pendingRect = canvas.pendingPieceRect;

        if (sx != null && sy != null && pendingId && pendingRect) {
          const dx0 = e.clientX - sx;
          const dy0 = e.clientY - sy;
          const dist = Math.hypot(dx0, dy0);

          // Cancel long-press only once the user is clearly moving
          if (dist >= TAP_DRAG_THRESHOLD_PX) {
            clearLongPress(canvas);
          }

          // Start dragging only once we cross threshold
          if (!canvas.touchDragStarted && dist >= TAP_DRAG_THRESHOLD_PX) {
            canvas.touchDragStarted = true;
            didDragRef.current = true;

            manager.pointerDown(pendingId, sx, sy, pendingRect);
            setState(manager.getState());
          }

          // If drag started, continue moving
          if (canvas.touchDragStarted) {
            const boardRect = boardRef.current.getBoundingClientRect();
            manager.pointerMove(e.clientX, e.clientY, boardRect);
          }

          return;
        }

        return;
      }

      // Mouse: any move while captured implies drag
      if (canvas.longPressTimer) {
        clearLongPress(canvas);
      }

      didDragRef.current = true;

      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
    },
    [manager, boardRef, didDragRef, setState],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      const canvas = canvasRef.current as CanvasWithLongPress;

      clearLongPress(canvas);

      const isTouch = e.pointerType === "touch";

      // If a long-press fired, do not treat this as tap-rotate or drag-end.
      if (canvas.longPressFired) {
        canvas.longPressFired = false;
        didDragRef.current = false;
        resetTouchState(canvas);
        return;
      }

      if (isTouch) {
        const dragStarted = !!canvas.touchDragStarted;

        // Touch tap (no drag): rotate the tapped piece
        if (!dragStarted) {
          const boardRect = boardRef.current?.getBoundingClientRect();
          const ctx = canvas.getContext("2d");
          if (boardRect && ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            const st = manager.getState();
            const x = e.clientX - boardRect.left;
            const y = e.clientY - boardRect.top;

            const boardPieces = st.pieces.filter((p) => !p.inTray);
            const pid = pickPieceId(ctx, boardPieces, x, y);

            if (pid && canRotatePiece(pid)) {
              manager.rotatePiece(pid);
              soundManager.play("rotate");
              haptic?.("rotate");
              setState(manager.getState());
            }
          }

          didDragRef.current = false;
          resetTouchState(canvas);

          try {
            canvas.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }

          return;
        }

        // Touch drag end
        manager.pointerUp();
        setState(manager.getState());

        didDragRef.current = false;
        resetTouchState(canvas);

        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        return;
      }

      // Mouse: end drag
      manager.pointerUp();
      setState(manager.getState());

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
