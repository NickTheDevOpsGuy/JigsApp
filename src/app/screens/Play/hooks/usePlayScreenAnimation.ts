import { useEffect, useRef } from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import type { DebugFlags } from "../playScreenUtils";

export function usePlayScreenAnimation(args: {
  manager: PuzzleManager | null;
  setState: (st: PuzzleState) => void;
  boardRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  popMapRef: React.RefObject<Map<string, number>>;
  selectedIdRef: React.RefObject<string | null>;
  debug: DebugFlags;
  showGhostHint: boolean;
}) {
  const {
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    selectedIdRef,
    debug,
    showGhostHint,
  } = args;

  const rafRef = useRef<number | null>(null);
  const completedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!manager) return;
    const tick = () => {
      const canvas = canvasRef.current;
      const boardEl = boardRef.current;
      const img = imgRef.current;
      if (!canvas || !boardEl || !img) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const rect = boardEl.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const st = manager.getState();
      const firstPiece = st.pieces[0];
      if (!firstPiece) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const assembledW = st.grid.cols * firstPiece.tileW;
      const assembledH = st.grid.rows * firstPiece.tileH;
      if (st.isComplete && !completedAtRef.current)
        completedAtRef.current = performance.now();
      else if (!st.isComplete) completedAtRef.current = null;
      const dragState = manager.getDragState();
      const draggedGroupId = dragState.activeId
        ? (st.pieces.find((p) => p.id === dragState.activeId)?.groupId ?? null)
        : null;
      const popMap = popMapRef.current ?? new Map<string, number>();
      renderBoard(
        ctx,
        st,
        img,
        assembledW,
        assembledH,
        popMap,
        performance.now(),
        debug,
        dragState,
        {
          draggedGroupId,
          hoveredPieceId: selectedIdRef.current,
          selectedPieceId: selectedIdRef.current,
          isComplete: st.isComplete,
          completedAtMs: completedAtRef.current,
          showGhostHint,
        },
      );
      setState(st);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [manager, debug, showGhostHint, setState]);
}
