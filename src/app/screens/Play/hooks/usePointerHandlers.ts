import { useCallback, useRef } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";

const TAP_THRESHOLD = 10;

type TouchState = {
  startX: number;
  startY: number;
  pieceId: string;
  pieceRect: DOMRect;
  isDragging: boolean;
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

  // Touch state ref
  const touchRef = useRef<TouchState | null>(null);

  // Helper: pick piece at coordinates
  const pickPiece = useCallback(
    (clientX: number, clientY: number) => {
      if (!manager || !canvasRef.current) return null;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return null;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, x, y);
      if (!pieceId) return null;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.locked) return null;

      return { pieceId, piece, rect };
    },
    [manager, canvasRef],
  );

  // Helper: can rotate piece
  const canRotate = useCallback(
    (pid: string) => {
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

  // Helper: is over tray
  const isOverTray = useCallback(
    (x: number, y: number) => {
      const el = trayRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    },
    [trayRef],
  );

  // Helper: finish drag
  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!manager) return;
      if (isOverTray(clientX, clientY)) {
        const activeId = manager.getDragState().activeId;
        if (activeId) {
          manager.sendToTray(activeId);
          selectCycle(1);
        }
      }
      manager.pointerUp();
    },
    [manager, isOverTray, selectCycle],
  );

  // POINTER DOWN
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const picked = pickPiece(e.clientX, e.clientY);
      if (!picked) return;

      const { pieceId, piece, rect } = picked;

      // Select piece
      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      // TOUCH: delayed drag start
      if (e.pointerType === "touch") {
        e.preventDefault();
        touchRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          pieceId,
          pieceRect: new DOMRect(rect.left + piece.x, rect.top + piece.y, piece.w, piece.h),
          isDragging: false,
        };
        didDragRef.current = false;

        try {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } catch { /* ignore */ }
        return;
      }

      // MOUSE: right-click = rotate
      if (e.button === 2) {
        e.preventDefault();
        if (canRotate(pieceId)) {
          manager.rotatePiece(pieceId);
          soundManager.play("rotate");
          haptic?.("rotate");
          setState(manager.getState());
        }
        return;
      }

      // MOUSE: left-click = immediate drag
      if (e.button === 0) {
        e.preventDefault();
        const pieceRect = new DOMRect(rect.left + piece.x, rect.top + piece.y, piece.w, piece.h);
        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        soundManager.play("pickup");
        setState(manager.getState());
        didDragRef.current = false;

        try {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } catch { /* ignore */ }
      }
    },
    [manager, canvasRef, boardRef, pickPiece, selectedIdRef, setSelectedPieceId, bump, onPieceInteraction, canRotate, haptic, setState, didDragRef],
  );

  // POINTER MOVE
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager || !boardRef.current) return;

      // TOUCH
      if (e.pointerType === "touch") {
        const touch = touchRef.current;
        if (!touch) return;

        const dist = Math.hypot(e.clientX - touch.startX, e.clientY - touch.startY);

        // Start drag after threshold
        if (!touch.isDragging && dist >= TAP_THRESHOLD) {
          touch.isDragging = true;
          didDragRef.current = true;
          manager.pointerDown(touch.pieceId, touch.startX, touch.startY, touch.pieceRect);
          soundManager.play("pickup");
        }

        // Continue drag
        if (touch.isDragging) {
          e.preventDefault();
          const boardRect = boardRef.current.getBoundingClientRect();
          manager.pointerMove(e.clientX, e.clientY, boardRect);
          onPieceInteraction?.();

          const activeId = manager.getDragState().activeId;
          if (activeId && onDragPreview) {
            const st = manager.getState();
            const p = st.pieces.find((pc) => pc.id === activeId);
            const groupSize = p ? st.pieces.filter((pc) => pc.groupId === p.groupId).length : 0;
            if (groupSize === 1) {
              onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
            }
          }
        }
        return;
      }

      // MOUSE
      if (!manager.getDragState().activeId) return;
      didDragRef.current = true;
      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
      onPieceInteraction?.();

      const activeId = manager.getDragState().activeId;
      if (activeId && onDragPreview) {
        const st = manager.getState();
        const p = st.pieces.find((pc) => pc.id === activeId);
        const groupSize = p ? st.pieces.filter((pc) => pc.groupId === p.groupId).length : 0;
        if (groupSize === 1) {
          onDragPreview({ clientX: e.clientX, clientY: e.clientY, pieceId: activeId });
        }
      }
    },
    [manager, boardRef, didDragRef, onPieceInteraction, onDragPreview],
  );

  // POINTER UP
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!manager) return;

      // TOUCH
      if (e.pointerType === "touch") {
        const touch = touchRef.current;
        touchRef.current = null;

        if (!touch) return;

        onDragPreview?.(null);

        if (touch.isDragging) {
          // End drag
          finishDrag(e.clientX, e.clientY);
          setState(manager.getState());
        } else {
          // Tap = rotate
          if (canRotate(touch.pieceId)) {
            manager.rotatePiece(touch.pieceId);
            soundManager.play("rotate");
            haptic?.("rotate");
            setState(manager.getState());
          }
        }

        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch { /* ignore */ }
        return;
      }

      // MOUSE
      onDragPreview?.(null);
      finishDrag(e.clientX, e.clientY);
      setState(manager.getState());
      didDragRef.current = false;

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
    },
    [manager, onDragPreview, finishDrag, setState, canRotate, haptic, didDragRef],
  );

  // POINTER CANCEL
  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent<HTMLElement>) => {
      if (!manager) return;
      touchRef.current = null;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
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
