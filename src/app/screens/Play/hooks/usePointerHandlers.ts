import { useCallback, useEffect, useRef } from "react";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import type { PointerHandlersContext, CanvasWithTouch } from "./pointerHandlers/types";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "./pointerHandlers/mouseHandlers";
import {
  handleTouchDown as doTouchDown,
  handleTouchMove as doTouchMove,
  handleTouchUp as doTouchUp,
  resetTouchState,
} from "./pointerHandlers/touchHandlers";
import { useCoarsePointer } from "./useCoarsePointer";

export type UsePointerHandlersParams = {
  manager: PointerHandlersContext["manager"];
  canvasRef: PointerHandlersContext["canvasRef"];
  boardRef: PointerHandlersContext["boardRef"];
  trayRef: PointerHandlersContext["trayRef"];
  setState: PointerHandlersContext["setState"];
  selectCycle: PointerHandlersContext["selectCycle"];
  setSelectedPieceId: PointerHandlersContext["setSelectedPieceId"];
  selectedIdRef: PointerHandlersContext["selectedIdRef"];
  bump: PointerHandlersContext["bump"];
  didDragRef: PointerHandlersContext["didDragRef"];
  haptic?: PointerHandlersContext["haptic"];
  onDragPreview?: PointerHandlersContext["onDragPreview"];
  onPieceInteraction?: PointerHandlersContext["onPieceInteraction"];
};

export function usePointerHandlers(params: UsePointerHandlersParams) {
  const {
    manager,
    canvasRef,
    boardRef,
    trayRef,
    setState,
    selectCycle,
    setSelectedPieceId,
    selectedIdRef,
    bump,
    didDragRef,
    haptic,
    onDragPreview,
    onPieceInteraction,
  } = params;

  const isCoarsePointer = useCoarsePointer();
  const touchPendingRef = useRef(false);

  const isPointerOverTray = useCallback(
    (clientX: number, clientY: number): boolean => {
      const tray = trayRef.current;
      if (!tray) return false;
      const rect = tray.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    },
    [trayRef],
  );

  const canRotatePiece = useCallback(
    (pid: string): boolean => {
      if (!manager) return false;
      const piece = manager.getState().pieces.find((p) => p.id === pid);
      return !!piece && !piece.isPlaced && !piece.locked;
    },
    [manager],
  );

  const ctx: PointerHandlersContext = {
    manager,
    canvasRef,
    boardRef,
    trayRef,
    selectedIdRef,
    setSelectedPieceId,
    bump,
    didDragRef,
    setState,
    selectCycle,
    haptic,
    onDragPreview,
    onPieceInteraction,
    clearTouchPending: () => {
      touchPendingRef.current = false;
    },
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!manager || !boardRef.current || !canvasRef.current) return;

      const boardRect = boardRef.current.getBoundingClientRect();
      const canvas = canvasRef.current;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const x = e.clientX - boardRect.left;
      const y = e.clientY - boardRect.top;
      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, x, y);
      if (!pieceId) return;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece) return;

      const pieceRect = {
        x: piece.x,
        y: piece.y,
        w: piece.w,
        h: piece.h,
      };

      if (isCoarsePointer && e.pointerType === "touch") {
        return;
      }

      if (e.pointerType === "mouse") {
        const handled = handleMouseDown(
          e,
          ctx,
          pieceId,
          boardRect,
          pieceRect,
          canRotatePiece,
        );
        if (handled) {
          setSelectedPieceId(pieceId);
          selectedIdRef.current = pieceId;
        }
      }
    },
    [
      manager,
      boardRef,
      canvasRef,
      isCoarsePointer,
      ctx,
      canRotatePiece,
      setSelectedPieceId,
      selectedIdRef,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!manager || !boardRef.current) return;

      if (isCoarsePointer && e.pointerType === "touch") {
        return;
      }

      if (e.pointerType === "mouse") {
        handleMouseMove(e, ctx);
      }
    },
    [manager, boardRef, canvasRef, isCoarsePointer, ctx],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!manager || !boardRef.current || !canvasRef.current) return;

      if (isCoarsePointer && e.pointerType === "touch") {
        return;
      }

      if (e.pointerType === "mouse") {
        handleMouseUp(e, ctx, isPointerOverTray);
        setSelectedPieceId(null);
        selectedIdRef.current = null;
      }
    },
    [
      manager,
      boardRef,
      canvasRef,
      isCoarsePointer,
      ctx,
      canRotatePiece,
      isPointerOverTray,
      setSelectedPieceId,
      selectedIdRef,
    ],
  );

  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      if (!manager || !canvasRef.current) return;
      const canvas = canvasRef.current as HTMLCanvasElement & {
        touchStartX?: number;
        touchStartY?: number;
        touchDragStarted?: boolean;
        pendingPieceId?: string | null;
        pendingPieceRect?: DOMRect | null;
      };
      resetTouchState(canvas);
      touchPendingRef.current = false;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
    },
    [manager, canvasRef, onDragPreview, setState],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!manager || !boardRef.current) return;
      if (isCoarsePointer && e.pointerType === "touch") return;
      didDragRef.current = false;
      onDragPreview?.(null);
      manager.pointerUp();
      setState(manager.getState());
    },
    [manager, boardRef, isCoarsePointer, didDragRef, onDragPreview, setState],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isCoarsePointer || !boardRef.current || !canvasRef.current) return;

    const board = boardRef.current;
    const canvas = canvasRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target !== canvas && !board.contains(e.target as Node)) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const boardRect = board.getBoundingClientRect();
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const ctx2d = canvas.getContext("2d");
      if (!ctx2d || !manager) return;

      const dpr = window.devicePixelRatio || 1;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);
      const pieceId = pickPieceId(ctx2d, boardPieces, x, y);
      if (!pieceId) return;

      const piece = st.pieces.find((p) => p.id === pieceId);
      if (!piece) return;

      touchPendingRef.current = true;
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pointerId: touch.identifier,
        pointerType: "touch" as const,
        preventDefault: () => e.preventDefault(),
      } as React.PointerEvent<HTMLDivElement>;

      doTouchDown(syntheticEvent, ctx, pieceId, boardRect, {
        x: piece.x,
        y: piece.y,
        w: piece.w,
        h: piece.h,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchPendingRef.current || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pointerId: touch.identifier,
        pointerType: "touch" as const,
      } as React.PointerEvent<HTMLDivElement>;

      doTouchMove(syntheticEvent, ctx, canvas as CanvasWithTouch);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchPendingRef.current || e.changedTouches.length !== 1) return;
      e.preventDefault();

      const touch = e.changedTouches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pointerId: touch.identifier,
        pointerType: "touch" as const,
      } as React.PointerEvent<HTMLDivElement>;

      doTouchUp(syntheticEvent, ctx, canRotatePiece, isPointerOverTray);
      touchPendingRef.current = false;
    };

    const handleTouchCancel = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const canvasEl = canvas as HTMLCanvasElement & {
        touchStartX?: number;
        touchStartY?: number;
        touchDragStarted?: boolean;
        pendingPieceId?: string | null;
        pendingPieceRect?: DOMRect | null;
      };
      resetTouchState(canvasEl);
      touchPendingRef.current = false;
      if (manager) {
        onDragPreview?.(null);
        manager.pointerUp();
        setState(manager.getState());
      }
    };

    board.addEventListener("touchstart", handleTouchStart, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchend", handleTouchEnd, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchcancel", handleTouchCancel, {
      passive: false,
      capture: true,
    });

    return () => {
      board.removeEventListener("touchstart", handleTouchStart, { capture: true });
      document.removeEventListener("touchmove", handleTouchMove, { capture: true });
      document.removeEventListener("touchend", handleTouchEnd, { capture: true });
      document.removeEventListener("touchcancel", handleTouchCancel, { capture: true });
    };
  }, [
    isCoarsePointer,
    boardRef,
    canvasRef,
    manager,
    ctx,
    canRotatePiece,
    isPointerOverTray,
    onDragPreview,
    setState,
  ]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  };
}
