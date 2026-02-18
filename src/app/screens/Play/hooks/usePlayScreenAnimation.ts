/**
 * usePlayScreenAnimation – RAF loop for canvas rendering.
 * Drives renderBoard with piece cache, drag interpolation, snap particles, completion glow.
 */
import { useEffect, useRef } from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import type { SnapParticle } from "@/puzzle/canvas/renderBoardHelpers";
import { SHOW_DEBUG, type DebugFlags } from "../playScreenUtils";
import type { ViewportState } from "./useViewport";
import type { PerfStats } from "../components/ProfilerOverlay";

export function usePlayScreenAnimation(args: {
  manager: PuzzleManager | null;
  setState: (st: PuzzleState) => void;
  boardRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  popMapRef: React.RefObject<Map<string, number>>;
  lockMapRef: React.RefObject<Map<string, number>>;
  selectedIdRef: React.RefObject<string | null>;
  dragPreviewPieceIdRef: React.RefObject<string | null>;
  snapParticlesRef?: React.RefObject<SnapParticle[]>;
  debug: DebugFlags;
  showGhostHint: boolean;
  showAlignmentGrid: boolean;
  showGhostWhenIdle?: boolean;
  showEdgeHighlight?: boolean;
  lastInteractionRef?: React.RefObject<number>;
  viewport: ViewportState;
  perfStatsRef?: React.RefObject<PerfStats | null>;
  wrongRotationHintRef?: React.RefObject<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>;
}) {
  const {
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    lockMapRef,
    selectedIdRef,
    dragPreviewPieceIdRef,
    snapParticlesRef,
    debug,
    showGhostHint,
    showAlignmentGrid,
    showGhostWhenIdle,
    showEdgeHighlight,
    lastInteractionRef,
    viewport,
    perfStatsRef,
    wrongRotationHintRef,
  } = args;

  const rafRef = useRef<number | null>(null);
  const completedAtRef = useRef<number | null>(null);
  const pieceCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const lastCompleteRef = useRef<boolean>(false);
  const lastPieceCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsFrameTimesRef = useRef<number[]>([]);
  const fpsLogIntervalRef = useRef<number>(0);
  /** Interpolated positions for dragged group (smooth drag, no touch/pointer changes) */
  const dragDisplayRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const DRAG_LERP = 0.32;

  const perfFrameTimesRef = useRef<number[]>([]);
  const perfDrawCountRef = useRef(0);
  const perfLastSecRef = useRef(0);

  /** For 100+ piece puzzles: throttle redraw to 30fps when idle to reduce CPU/GPU load. */
  const IDLE_TARGET_FPS = 30;
  const IDLE_MIN_INTERVAL_MS = 1000 / IDLE_TARGET_FPS;
  const HIGH_PIECE_COUNT_THRESHOLD = 50;

  useEffect(() => {
    if (!manager) return;
    pieceCacheRef.current.clear();
    const tick = (now: number) => {
      const canvas = canvasRef.current;
      const boardEl = boardRef.current;
      const img = imgRef.current;
      if (!canvas || !boardEl || !img) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const st = manager.getState();
      const firstPiece = st.pieces[0];
      if (!firstPiece) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dragState = manager.getDragState();
      const isDragging = dragState.activeId != null;
      const completionElapsed =
        st.isComplete && completedAtRef.current ? now - completedAtRef.current : Infinity;
      const inCompletionFlourish = completionElapsed < 800;
      const pieceCount = st.pieces.length;
      const throttleIdle =
        pieceCount >= HIGH_PIECE_COUNT_THRESHOLD && !isDragging && !inCompletionFlourish;

      if (throttleIdle && now - lastFrameTimeRef.current < IDLE_MIN_INTERVAL_MS) {
        if (
          st.isComplete !== lastCompleteRef.current ||
          st.placedCount !== lastPieceCountRef.current
        ) {
          lastCompleteRef.current = st.isComplete;
          lastPieceCountRef.current = st.placedCount;
          setState(st);
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = lastFrameTimeRef.current > 0 ? now - lastFrameTimeRef.current : 0;
      lastFrameTimeRef.current = now;

      const showPerf = debug.showPerfOverlay && perfStatsRef?.current;
      if (showPerf) {
        const times = perfFrameTimesRef.current;
        if (dt > 0) {
          times.push(dt);
          if (times.length > 60) times.shift();
        }
        perfDrawCountRef.current += 1;
        const activeGroups = new Set(
          st.pieces.filter((p) => !p.inTray).map((p) => p.groupId),
        ).size;
        const elapsed = now - perfLastSecRef.current;
        if (elapsed >= 1000) {
          const stats = perfStatsRef.current!;
          const avg = times.length ? times.reduce((a, t) => a + t, 0) / times.length : 0;
          stats.fps = avg > 0 ? Math.round(1000 / avg) : 0;
          stats.drawsPerSec = perfDrawCountRef.current;
          stats.activeGroups = activeGroups;
          stats.snapChecksPerSec = stats.snapCheckCount;
          stats.snapCheckCount = 0;
          perfDrawCountRef.current = 0;
          perfLastSecRef.current = now;
        } else {
          const stats = perfStatsRef.current!;
          stats.activeGroups = activeGroups;
        }
      }

      if (SHOW_DEBUG) {
        performance.mark("render-frame-start");
        const times = fpsFrameTimesRef.current;
        if (dt > 0) {
          times.push(dt);
          if (times.length > 60) times.shift();
        }
        fpsLogIntervalRef.current += dt;
        if (fpsLogIntervalRef.current >= 2000) {
          fpsLogIntervalRef.current = 0;
          const avg = times.length ? times.reduce((a, t) => a + t, 0) / times.length : 0;
          const fps = avg > 0 ? Math.round(1000 / avg) : 0;
          console.debug(
            `[Phuzzle] FPS: ~${fps} (drag: ${isDragging ? "yes" : "no"}, pieces: ${pieceCount})`,
          );
        }
      }

      const rect = boardEl.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      if (
        canvas.width !== Math.floor(cssW * dpr) ||
        canvas.height !== Math.floor(cssH * dpr)
      ) {
        const targetW = Math.floor(cssW * dpr);
        const targetH = Math.floor(cssH * dpr);
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
      const assembledW = st.grid.cols * firstPiece.tileW;
      const assembledH = st.grid.rows * firstPiece.tileH;
      if (st.isComplete && !completedAtRef.current) completedAtRef.current = now;
      else if (!st.isComplete) completedAtRef.current = null;
      const draggedGroupId = dragState.activeId
        ? (st.pieces.find((p) => p.id === dragState.activeId)?.groupId ?? null)
        : null;

      const dragDisplayOverrides = dragDisplayRef.current;
      if (isDragging && draggedGroupId) {
        const groupPieces = st.pieces.filter(
          (p) => !p.inTray && p.groupId === draggedGroupId,
        );
        for (const p of groupPieces) {
          let pos = dragDisplayOverrides.get(p.id);
          if (!pos) {
            pos = { x: p.x, y: p.y };
            dragDisplayOverrides.set(p.id, pos);
          }
          pos.x += (p.x - pos.x) * DRAG_LERP;
          pos.y += (p.y - pos.y) * DRAG_LERP;
        }
      } else {
        dragDisplayOverrides.clear();
      }

      const popMap = popMapRef.current ?? new Map<string, number>();
      const lockMap = lockMapRef.current ?? new Map<string, number>();
      const pieceCache = pieceCacheRef.current;
      const snapParticles = snapParticlesRef?.current ?? [];
      const hint = wrongRotationHintRef?.current;
      const wrongRotationHint = hint && now - hint.triggeredAt < 700 ? hint : undefined;
      const snapPreview =
        dragState.activeId && manager ? manager.getSnapPreviewState() : null;
      const idleMs =
        lastInteractionRef?.current != null ? now - lastInteractionRef.current : 0;
      const IDLE_GHOST_MS = 4000;
      const effectiveShowGhost =
        showGhostHint ||
        (!!showGhostWhenIdle && idleMs >= IDLE_GHOST_MS && !st.isComplete);
      const ghostAlpha = showGhostHint ? 0.35 : 0.2;
      renderBoard(
        ctx,
        st,
        img,
        assembledW,
        assembledH,
        popMap,
        lockMap,
        now,
        debug,
        dragState,
        {
          draggedGroupId,
          hoveredPieceId: selectedIdRef.current,
          selectedPieceId: selectedIdRef.current,
          isComplete: st.isComplete,
          completedAtMs: completedAtRef.current,
          showGhostHint: effectiveShowGhost,
          ghostAlpha,
          showEdgeHighlight,
          showAlignmentGrid,
          dragPreviewPieceId: dragPreviewPieceIdRef.current,
          dragDisplayOverrides: isDragging ? dragDisplayOverrides : undefined,
          wrongRotationHint,
          snapPreview,
        },
        pieceCache,
        viewport,
        snapParticles,
      );

      if (SHOW_DEBUG) {
        performance.mark("render-frame-end");
        performance.measure("render-frame", "render-frame-start", "render-frame-end");
      }

      if (
        st.isComplete !== lastCompleteRef.current ||
        st.placedCount !== lastPieceCountRef.current
      ) {
        lastCompleteRef.current = st.isComplete;
        lastPieceCountRef.current = st.placedCount;
        setState(st);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    manager,
    debug,
    showGhostHint,
    showGhostWhenIdle,
    showEdgeHighlight,
    showAlignmentGrid,
    lastInteractionRef,
    setState,
    viewport,
    snapParticlesRef,
    perfStatsRef,
    wrongRotationHintRef,
  ]);
}
