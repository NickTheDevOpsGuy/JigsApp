import { useCallback } from "react";
import type React from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";
import type { HapticKind } from "./useHaptics";
import type { DragPreviewState } from "./pointerHandlers/types";
import { soundManager } from "@/audio/sounds";

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

  const canRotatePiece = useCallback(
    (pid: PieceId) => {
      if (!manager) return false;
      const st = manager.getState();
      const piece = st.pieces.find((p) => p.id === pid);
      if (!piece || piece.locked || piece.inTray || piece.isPlaced) return false;
      return st.pieces.filter((p) => p.groupId === piece.groupId).length === 1;
    },
    [manager],
  );

  const isOverTray = (x: number, y: number) => {
    const tray = trayRef.current;
    if (!tray) return false;
    const r = tray.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;
      e.preventDefault();

      const rect = boardRef.current.getBoundingClientRect();
      const ctx2d = canvasRef.current.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const st = manager.getState();
      const pieceId = pickPieceId(
        ctx2d,
        st.pieces.filter((p) => !p.inTray),
        x,
        y,
      );
      if (!pieceId) return;

      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
      onPieceInteraction?.();

      manager.pointerDown(pieceId, e.clientX, e.clientY, new DOMRect(x, y, 1, 1));
      soundManager.play("pickup");
      didDragRef.current = false;
    },
    [manager, canvasRef, boardRef, bump, setSelectedPieceId, onPieceInteraction],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current) return;
      if (!manager.getDragState().activeId) return;

      didDragRef.current = true;
      manager.pointerMove(e.clientX, e.clientY, boardRef.current.getBoundingClientRect());
    },
    [manager, boardRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager) return;

      const active = manager.getDragState().activeId;
      if (active && isOverTray(e.clientX, e.clientY)) {
        manager.sendToTray(active);
        selectCycle(1);
      } else if (!didDragRef.current && active && canRotatePiece(active)) {
        manager.rotatePiece(active);
        soundManager.play("rotate");
        haptic?.("rotate");
      }

      manager.pointerUp();
      setState(manager.getState());
      didDragRef.current = false;
      onDragPreview?.(null);
    },
    [manager, setState, canRotatePiece, haptic, selectCycle],
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel: handlePointerUp,
    handleLostPointerCapture: handlePointerUp,
    handleContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
