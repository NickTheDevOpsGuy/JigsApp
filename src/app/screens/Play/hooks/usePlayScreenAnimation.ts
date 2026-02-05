import { useEffect, useRef } from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import type { DebugFlags } from "../playScreenUtils";

import type { SnapFromMap } from "@/puzzle/canvas/renderBoard";

export function usePlayScreenAnimation(args: {
  manager: PuzzleManager | null;
  setState: (st: PuzzleState) => void;
  boardRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  popMapRef: React.RefObject<Map<string, number>>;
  snapFromMapRef: React.RefObject<SnapFromMap>;
  selectedIdRef: React.RefObject<string | null>;
  dragPreviewPieceIdRef: React.RefObject<string | null>;
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
    snapFromMapRef,
    selectedIdRef,
    dragPreviewPieceIdRef,
    debug,
    showGhostHint,
  } = args;

  const rafRef = useRef<number | null>(null);
  const completedAtRef = useRef<number | null>(null);
  const pieceCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const lastCompleteRef = useRef<boolean>(false);
  const lastPieceCountRef = useRef<number>(0);

  useEffect(() => {
    if (!manager) return;
    pieceCacheRef.current.clear();
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

      // Only resize canvas if dimensions changed
      const targetW = Math.floor(cssW * dpr);
      const targetH = Math.floor(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
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
      const nowMs = performance.now();
      const popMap = popMapRef.current ?? new Map<string, number>();
      const snapFromMap = snapFromMapRef.current;
      // Clean up expired snap-from entries (animation duration ~200ms)
      if (snapFromMap) {
        for (const [id, entry] of snapFromMap.entries()) {
          if (nowMs - entry.startMs > 220) snapFromMap.delete(id);
        }
      }
      const pieceCache = pieceCacheRef.current;
      renderBoard(
        ctx,
        st,
        img,
        assembledW,
        assembledH,
        popMap,
        nowMs,
        debug,
        dragState,
        {
          draggedGroupId,
          hoveredPieceId: selectedIdRef.current,
          selectedPieceId: selectedIdRef.current,
          isComplete: st.isComplete,
          completedAtMs: completedAtRef.current,
          showGhostHint,
          dragPreviewPieceId: dragPreviewPieceIdRef.current,
        },
        pieceCache,
        snapFromMap ?? undefined,
      );

      // Only update React state when something meaningful changes
      // (completion status or placed piece count)
      const placedCount = st.pieces.filter((p) => p.isPlaced).length;
      if (
        st.isComplete !== lastCompleteRef.current ||
        placedCount !== lastPieceCountRef.current
      ) {
        lastCompleteRef.current = st.isComplete;
        lastPieceCountRef.current = placedCount;
        setState(st);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [manager, debug, showGhostHint, setState]);
}
