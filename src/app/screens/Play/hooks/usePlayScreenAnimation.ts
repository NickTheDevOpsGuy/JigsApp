/**
 * usePlayScreenAnimation – RAF loop for canvas rendering.
 * Drives renderBoard with piece cache, drag interpolation, snap particles, completion glow.
 */
import { useEffect, useRef } from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import {
  getRotationEaseProgress,
  getPositionEaseProgress,
  SNAP_MOVE_EASE_MS,
} from "@/puzzle/rotationEase";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import type { SnapParticle } from "@/puzzle/canvas/renderBoardHelpers";
import { SNAP_GLOW_COLORS_BY_THEME } from "@/data/confettiColors";
import type { Theme } from "@/hooks/useTheme";
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
  snapPositionAnimRef?: React.MutableRefObject<{
    items: Array<{
      id: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
    }>;
    startMs: number;
  } | null>;
  debug: DebugFlags;
  showGhostHint: boolean;
  showAlignmentGrid: boolean;
  showGhostWhenIdle?: boolean;
  showGhostImage?: boolean;
  showEdgeHighlight?: boolean;
  isCompetitiveOrDaily?: boolean;
  /** When true, ghost image is disabled (memory-based challenge). */
  challengeModeEnabled?: boolean;
  lastInteractionRef?: React.RefObject<number>;
  viewport: ViewportState;
  perfStatsRef?: React.RefObject<PerfStats | null>;
  wrongRotationHintRef?: React.RefObject<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>;
  rotationAnimRef?: React.MutableRefObject<{
    pieceIds: string[];
    from: number;
    to: number;
    startMs: number;
  } | null>;
  themeRef?: React.RefObject<Theme | undefined>;
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
    snapPositionAnimRef,
    debug,
    showGhostHint,
    showAlignmentGrid,
    showGhostWhenIdle,
    showGhostImage,
    showEdgeHighlight,
    isCompetitiveOrDaily,
    challengeModeEnabled,
    lastInteractionRef,
    viewport,
    perfStatsRef,
    wrongRotationHintRef,
    rotationAnimRef,
    themeRef,
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
      const snapParticles = snapParticlesRef?.current ?? [];
      const popMap = popMapRef.current ?? new Map<string, number>();
      const hasActiveSnapEffects =
        snapParticles.length > 0 || [...popMap.values()].some((t) => now - t < 600);
      const throttleIdle =
        pieceCount >= HIGH_PIECE_COUNT_THRESHOLD &&
        !isDragging &&
        !inCompletionFlourish &&
        !hasActiveSnapEffects;

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

      const lockMap = lockMapRef.current ?? new Map<string, number>();
      const pieceCache = pieceCacheRef.current;
      const hint = wrongRotationHintRef?.current;
      const wrongRotationHint = hint && now - hint.triggeredAt < 700 ? hint : undefined;
      const snapPreview =
        dragState.activeId && manager ? manager.getSnapPreviewState() : null;
      const idleMs =
        lastInteractionRef?.current != null ? now - lastInteractionRef.current : 0;
      const IDLE_GHOST_MS = 4000;
      const GHOST_RAMP_MS = 5000;

      let effectiveShowGhost: boolean;
      let ghostAlpha: number;

      if (showGhostHint) {
        effectiveShowGhost = true;
        ghostAlpha = 0.35;
      } else if (showGhostWhenIdle && idleMs >= IDLE_GHOST_MS && !st.isComplete) {
        effectiveShowGhost = true;
        const excessIdle = idleMs - IDLE_GHOST_MS;
        const rawProgress = Math.min(1, excessIdle / GHOST_RAMP_MS);
        const easeInOut = (t: number) =>
          t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        ghostAlpha = easeInOut(rawProgress) * 0.25;
      } else {
        effectiveShowGhost = false;
        ghostAlpha = 0;
      }

      let rotationDisplayOverrides: Map<string, number> | undefined;
      const anim = rotationAnimRef?.current;
      if (anim) {
        const deg = getRotationEaseProgress(anim.from, anim.to, anim.startMs, now);
        if (deg != null) {
          rotationDisplayOverrides = new Map(anim.pieceIds.map((id) => [id, deg]));
        } else {
          rotationAnimRef.current = null;
        }
      }

      let snapPositionOverrides: Map<string, { x: number; y: number }> | undefined;
      const snapAnim = snapPositionAnimRef?.current;
      if (snapAnim) {
        const overrides = new Map<string, { x: number; y: number }>();
        let allDone = true;
        for (const item of snapAnim.items) {
          const x = getPositionEaseProgress(
            item.from.x,
            item.to.x,
            snapAnim.startMs,
            now,
            SNAP_MOVE_EASE_MS,
          );
          const y = getPositionEaseProgress(
            item.from.y,
            item.to.y,
            snapAnim.startMs,
            now,
            SNAP_MOVE_EASE_MS,
          );
          if (x != null && y != null) {
            overrides.set(item.id, { x, y });
            allDone = false;
          }
        }
        if (allDone && snapPositionAnimRef) {
          (snapPositionAnimRef as { current: typeof snapAnim | null }).current = null;
        } else {
          snapPositionOverrides = overrides;
        }
      }

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
          showGhostImage: (showGhostImage ?? false) && !challengeModeEnabled,
          isCompetitiveOrDaily: isCompetitiveOrDaily ?? false,
          showEdgeHighlight,
          showAlignmentGrid,
          dragPreviewPieceId: dragPreviewPieceIdRef.current,
          dragDisplayOverrides: isDragging ? dragDisplayOverrides : undefined,
          rotationDisplayOverrides,
          wrongRotationHint,
          snapPreview,
          snapPositionOverrides,
          snapGlowColors: themeRef?.current
            ? SNAP_GLOW_COLORS_BY_THEME[themeRef.current]
            : undefined,
          piecesRemaining: st.totalCount - st.placedCount,
          snapEffectScale: cssW < 600 ? 1.35 : 1,
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
    showGhostImage,
    challengeModeEnabled,
    showEdgeHighlight,
    showAlignmentGrid,
    isCompetitiveOrDaily,
    lastInteractionRef,
    setState,
    viewport,
    snapParticlesRef,
    snapPositionAnimRef,
    themeRef,
    perfStatsRef,
    wrongRotationHintRef,
    rotationAnimRef,
  ]);
}
