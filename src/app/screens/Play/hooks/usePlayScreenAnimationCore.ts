import { useEffect } from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import type { SnapParticle } from "@/puzzle/canvas/renderBoardHelpers";
import type { UndoSnapBackFrom } from "../playUtils";
import { SHOW_DEBUG, type DebugFlags } from "../playScreenUtils";
import type { ViewportState } from "./useViewport";
import type { PerfStats } from "../components/ProfilerOverlay";
import { IDLE_MIN_INTERVAL_MS, getHighPieceCountThreshold, IDLE_GHOST_MS } from "./usePlayScreenAnimationConstants";
import { useAutoBatterySaver } from "./useAutoBatterySaver";
import { useDevFrameSampler } from "./useDevFrameSampler";
import { useReducedMotionRef } from "./useReducedMotionRef";
import { usePlayScreenAnimationRefs } from "./usePlayScreenAnimationRefs";
import { buildLockLerpOverrides, updateDragDisplayOverrides, updateLastPiecePositions, updatePerfStats, updateDebugFps, shouldPublishState, prepareCanvasForRender } from "./usePlayScreenAnimationHelpers";
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
  magneticSnapEnabled: boolean;
  snapGlowEnabled: boolean;
  showGhostHint: boolean;
  showAlignmentGrid: boolean;
  showGhostWhenIdle?: boolean;
  showEdgeHighlight?: boolean;
  showClusterOutline?: boolean;
  lastInteractionRef?: React.RefObject<number>;
  viewport: ViewportState;
  perfStatsRef?: React.RefObject<PerfStats | null>;
  wrongRotationHintRef?: React.RefObject<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>;
  batterySaverMode?: boolean;
  undoSnapBackRef?: React.RefObject<{
    fromPositions: UndoSnapBackFrom;
    startMs: number;
  } | null>;
  onUndoSnapBackComplete?: () => void;
  dailyVisualModifier?: "none" | "fog" | "night" | "sepia";
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
    magneticSnapEnabled,
    snapGlowEnabled,
    showGhostHint,
    showAlignmentGrid,
    showGhostWhenIdle,
    showEdgeHighlight,
    showClusterOutline,
    lastInteractionRef,
    viewport,
    perfStatsRef,
    wrongRotationHintRef,
    batterySaverMode = false,
    undoSnapBackRef,
    onUndoSnapBackComplete: _onUndoSnapBackComplete,
    dailyVisualModifier = "none",
  } = args;
  const autoBatterySaverMode = useAutoBatterySaver();
  const effectiveBatterySaverMode = batterySaverMode || autoBatterySaverMode;

  const {
    rafRef,
    completedAtRef,
    pieceCacheRef,
    lastCompleteRef,
    lastPieceCountRef,
    lastFrameTimeRef,
    fpsFrameTimesRef,
    fpsLogIntervalRef,
    dragDisplayRef,
    lastPiecePositionsRef,
    perfFrameTimesRef,
    perfDrawCountRef,
    perfLastSecRef,
  } = usePlayScreenAnimationRefs();
  const reduceMotionRef = useReducedMotionRef();
  const devFrameSampler = useDevFrameSampler();
  const HIGH_PIECE_COUNT_THRESHOLD = getHighPieceCountThreshold(effectiveBatterySaverMode);

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
      const reducedMotion = reduceMotionRef.current;
      const throttleIdle =
        pieceCount >= HIGH_PIECE_COUNT_THRESHOLD && !isDragging && !inCompletionFlourish;
      const minFrameIntervalMs = reducedMotion
        ? Math.max(IDLE_MIN_INTERVAL_MS, 28)
        : IDLE_MIN_INTERVAL_MS;
      if (throttleIdle && now - lastFrameTimeRef.current < minFrameIntervalMs) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = lastFrameTimeRef.current > 0 ? now - lastFrameTimeRef.current : 0;
      lastFrameTimeRef.current = now;
      const devRollbackQuality = devFrameSampler.shouldRollback(dt, isDragging, pieceCount);

      updatePerfStats(
        st,
        now,
        dt,
        debug.showPerfOverlay,
        perfStatsRef,
        perfFrameTimesRef,
        perfDrawCountRef,
        perfLastSecRef,
      );

      updateDebugFps({
        showDebug: SHOW_DEBUG,
        dt,
        now,
        isDragging,
        pieceCount,
        fpsFrameTimesRef,
        fpsLogIntervalRef,
      });

      const reducedQuality =
        effectiveBatterySaverMode ||
        reducedMotion ||
        devRollbackQuality ||
        (isDragging && pieceCount >= HIGH_PIECE_COUNT_THRESHOLD);
      const canvasReady = prepareCanvasForRender(canvas, boardEl, reducedQuality);
      if (!canvasReady) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const { ctx } = canvasReady;
      const assembledW = st.grid.cols * firstPiece.tileW;
      const assembledH = st.grid.rows * firstPiece.tileH;
      if (st.isComplete && !completedAtRef.current) completedAtRef.current = now;
      else if (!st.isComplete) completedAtRef.current = null;
      const { draggedGroupId, dragDisplayOverrides } = updateDragDisplayOverrides({
        st,
        dragState,
        reducedMotion,
        magneticSnapEnabled,
        manager,
        dragDisplayRef,
        lastPiecePositionsRef,
      });

      const popMap = popMapRef.current ?? new Map<string, number>();
      const lockMap = lockMapRef.current ?? new Map<string, number>();

      const lockLerpOverrides = buildLockLerpOverrides({
        st,
        now,
        isDragging,
        reducedMotion,
        lockMap,
        assembledW,
        assembledH,
        lastPiecePositionsRef,
      });
      updateLastPiecePositions({
        st,
        now,
        isDragging,
        draggedGroupId,
        dragDisplayOverrides,
        lockMap,
        lastPiecePositionsRef,
      });

      const pieceCache = pieceCacheRef.current;
      const snapParticles = snapParticlesRef?.current ?? [];
      const hint = wrongRotationHintRef?.current;
      const wrongRotationHint = hint && now - hint.triggeredAt < 700 ? hint : undefined;
      const snapPreview =
        dragState.activeId && manager ? manager.getSnapPreviewState() : null;
      const idleMs =
        lastInteractionRef?.current != null ? now - lastInteractionRef.current : 0;
      const effectiveShowGhost =
        showGhostHint ||
        (!!showGhostWhenIdle && idleMs >= IDLE_GHOST_MS && !st.isComplete);
      const ghostAlpha = showGhostHint ? 0.35 : 0.2;
      const totalPieces = st.pieces.filter((p) => !p.inTray).length;
      const placedCount = st.pieces.filter((p) => !p.inTray && p.isPlaced).length;
      const fogAlphaForUnplaced =
        dailyVisualModifier === "fog" && totalPieces > 0
          ? Math.max(0.15, 0.6 * (1 - placedCount / totalPieces))
          : 0;
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
          showClusterOutline,
          showAlignmentGrid,
          dragPreviewPieceId: dragPreviewPieceIdRef.current,
          dragDisplayOverrides: isDragging ? dragDisplayOverrides : undefined,
          lockLerpOverrides,
          wrongRotationHint,
          snapPreview,
          snapGlowEnabled,
          fogAlphaForUnplaced: fogAlphaForUnplaced > 0 ? fogAlphaForUnplaced : undefined,
        },
        pieceCache,
        viewport,
        snapParticles,
      );

      if (SHOW_DEBUG) {
        performance.mark("render-frame-end");
        performance.measure("render-frame", "render-frame-start", "render-frame-end");
      }

      if (shouldPublishState(st, lastCompleteRef, lastPieceCountRef)) {
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
    undoSnapBackRef,
    debug,
    magneticSnapEnabled,
    snapGlowEnabled,
    showGhostHint,
    showGhostWhenIdle,
    showEdgeHighlight,
    showClusterOutline,
    showAlignmentGrid,
    lastInteractionRef,
    setState,
    viewport,
    snapParticlesRef,
    perfStatsRef,
    wrongRotationHintRef,
    batterySaverMode,
    autoBatterySaverMode,
    dailyVisualModifier,
  ]);
}
