import { useEffect, useRef } from "react";
import { renderBoard } from "@/puzzle/canvas/render/renderBoard";
import { SHOW_DEBUG } from "@/screens/Play/core/utils/playScreenUtils";
import {
  IDLE_MIN_INTERVAL_MS,
  IDLE_MIN_INTERVAL_MS_LARGE,
  LARGE_PUZZLE_PIECE_COUNT,
  LOCK_LERP_MS,
  QUIET_IDLE_AFTER_MS,
  QUIET_IDLE_MIN_INTERVAL_MS,
  getHighPieceCountThreshold,
} from "@/screens/Play/hooks/animation/usePlayScreenAnimationConstants";
import { useAutoBatterySaver } from "@/screens/Play/hooks/system/useAutoBatterySaver";
import { useDevFrameSampler } from "@/screens/Play/hooks/system/useDevFrameSampler";
import { useReducedMotionRef } from "@/screens/Play/hooks/system/useReducedMotionRef";
import { usePlayScreenAnimationRefs } from "@/screens/Play/hooks/animation/usePlayScreenAnimationRefs";
import {
  buildLockLerpOverrides,
  updateDragDisplayOverrides,
  updateLastPiecePositions,
  updatePerfStats,
  updateDebugFps,
  shouldPublishState,
  prepareCanvasForRender,
  prunePieceCacheForCurrentFrame,
} from "@/screens/Play/hooks/animation/usePlayScreenAnimationHelpers";
import { soundManager } from "@/audio/core/sounds";
import type { UsePlayScreenAnimationArgs } from "./usePlayScreenAnimationTypes";

export function usePlayScreenAnimation(args: UsePlayScreenAnimationArgs) {
  const {
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    lockMapRef,
    selectedIdRef,
    hoverPreviewPieceIdRef: _hoverPreviewPieceIdRef,
    dragPreviewPieceIdRef,
    snapParticlesRef,
    debug,
    magneticSnapEnabled,
    snapGlowEnabled,
    showGhostHint: _showGhostHint,
    showAlignmentGrid,
    showGhostWhenIdle: _showGhostWhenIdle,
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
    replayBarOpen = false,
    replayPlaybackActive = false,
    isPaused = false,
    isCoarsePointer: _isCoarsePointer = false,
  } = args;
  const autoBatterySaverMode = useAutoBatterySaver();
  const effectiveBatterySaverMode = batterySaverMode || autoBatterySaverMode;

  const {
    rafRef,
    completedAtRef,
    pieceCacheRef,
    pathCacheRef,
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
  const HIGH_PIECE_COUNT_THRESHOLD = getHighPieceCountThreshold(
    effectiveBatterySaverMode,
  );
  const nearSnapPlayedRef = useRef(false);

  useEffect(() => {
    if (!manager) return;
    pieceCacheRef.current.clear();
    pathCacheRef.current.clear();
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
      const lockMap = lockMapRef.current ?? new Map<string, number>();
      const hasActiveLockLerp = [...lockMap.entries()].some(
        ([, lockAt]) => now - lockAt < LOCK_LERP_MS,
      );
      const snapParticles = snapParticlesRef?.current ?? [];
      const SNAP_PARTICLE_MS = 520;
      const hasActiveSnapParticles = snapParticles.some(
        (p) => now - p.t0 < SNAP_PARTICLE_MS,
      );
      const throttleIdle =
        !replayBarOpen &&
        !isDragging &&
        !inCompletionFlourish &&
        !hasActiveLockLerp &&
        !hasActiveSnapParticles;
      const idleForMs =
        lastInteractionRef?.current != null ? now - lastInteractionRef.current : 0;
      const quietIdle = throttleIdle && (isPaused || idleForMs >= QUIET_IDLE_AFTER_MS);
      const useLargePuzzleInterval =
        throttleIdle && pieceCount >= LARGE_PUZZLE_PIECE_COUNT;
      const minFrameIntervalMs = reducedMotion
        ? Math.max(QUIET_IDLE_MIN_INTERVAL_MS, 28)
        : quietIdle
          ? QUIET_IDLE_MIN_INTERVAL_MS
          : useLargePuzzleInterval
          ? IDLE_MIN_INTERVAL_MS_LARGE
          : IDLE_MIN_INTERVAL_MS;
      if (throttleIdle && now - lastFrameTimeRef.current < minFrameIntervalMs) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = lastFrameTimeRef.current > 0 ? now - lastFrameTimeRef.current : 0;
      lastFrameTimeRef.current = now;
      const devRollbackQuality = devFrameSampler.shouldRollback(
        dt,
        isDragging,
        pieceCount,
      );

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
        quietIdle ||
        (isDragging && pieceCount >= HIGH_PIECE_COUNT_THRESHOLD);
      const canvasReady = prepareCanvasForRender(canvas, boardEl, reducedQuality);
      if (!canvasReady) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const { ctx, dpr } = canvasReady;
      prunePieceCacheForCurrentFrame(st, pieceCacheRef.current, dpr);
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
      const hint = wrongRotationHintRef?.current;
      const wrongRotationHint = hint && now - hint.triggeredAt < 700 ? hint : undefined;
      const snapPreview =
        magneticSnapEnabled && dragState.activeId && manager
          ? manager.getSnapPreviewState()
          : null;
      const snapRejectPreview = null;
      const inNearSnap =
        !!snapPreview &&
        (snapPreview.inSnapRange || snapPreview.nearSnap) &&
        snapPreview.proximity > 0.35;
      if (isDragging && inNearSnap && !nearSnapPlayedRef.current) {
        soundManager.play("hoverSnap", { proximity: snapPreview?.proximity ?? 0.5 });
        nearSnapPlayedRef.current = true;
      } else if (!isDragging || !inNearSnap) {
        nearSnapPlayedRef.current = false;
      }
      const totalPieces = st.pieces.filter((p) => !p.inTray).length;
      const placedCount = st.pieces.filter((p) => !p.inTray && p.isPlaced).length;
      const fogAlphaForUnplaced =
        dailyVisualModifier === "fog" && totalPieces > 0
          ? Math.max(0.15, 0.6 * (1 - placedCount / totalPieces))
          : 0;
      const hoveredId = selectedIdRef.current;
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
          hoveredPieceId: hoveredId,
          selectedPieceId: hoveredId,
          isComplete: st.isComplete,
          completedAtMs: completedAtRef.current,
          showGhostHint: false,
          showEdgeHighlight,
          showClusterOutline,
          showAlignmentGrid,
          dragPreviewPieceId: dragPreviewPieceIdRef.current,
          dragDisplayOverrides: isDragging ? dragDisplayOverrides : undefined,
          lockLerpOverrides,
          wrongRotationHint,
          snapPreview,
          snapRejectPreview,
          snapGlowEnabled: snapGlowEnabled && !reducedQuality,
          reducedQuality,
          fogAlphaForUnplaced: fogAlphaForUnplaced > 0 ? fogAlphaForUnplaced : undefined,
        },
        pieceCache,
        pathCacheRef.current,
        viewport,
        snapParticles,
      );

      if (SHOW_DEBUG) {
        performance.mark("render-frame-end");
        performance.measure("render-frame", "render-frame-start", "render-frame-end");
        performance.clearMarks("render-frame-start");
        performance.clearMarks("render-frame-end");
        performance.clearMeasures("render-frame");
      }

      /* During replay playback, consecutive snapshots can share placedCount / completion flags;
       * still publish so React (tray, etc.) matches the canvas every frame. */
      if (
        replayPlaybackActive ||
        shouldPublishState(st, lastCompleteRef, lastPieceCountRef)
      ) {
        setState(st);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Pause RAF when tab is hidden — saves battery/CPU
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else {
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    manager,
    undoSnapBackRef,
    debug,
    magneticSnapEnabled,
    snapGlowEnabled,
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
    replayBarOpen,
    replayPlaybackActive,
    isPaused,
    selectedIdRef,
  ]);
}
