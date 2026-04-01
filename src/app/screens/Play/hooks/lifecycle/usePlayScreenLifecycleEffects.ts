import { useEffect, useLayoutEffect, useRef } from "react";
import posthog from "posthog-js";
import type { Piece } from "@/puzzle/core/types";
import type { UsePlayScreenLifecycleEffectsArgs } from "./usePlayScreenLifecycleEffectsTypes";
import { canvasToObjectUrl, revokeObjectUrl } from "@/utils/async";
import { subscribeViewportLayoutChanges } from "@/utils/layoutViewport";

export type { UsePlayScreenLifecycleEffectsArgs } from "./usePlayScreenLifecycleEffectsTypes";

export function usePlayScreenLifecycleEffects(args: UsePlayScreenLifecycleEffectsArgs) {
  const {
    boardRef,
    setBoardSize,
    viewport,
    state,
    completionDismissed,
    replayBarOpen,
    setReplayBarBoardRect,
    puzzleKey,
    undoCountRef,
    moveCountRef,
    rotationCountRef,
    maxGroupSizeRef,
    precisionSnapsRef,
    abandonCapturedRef,
    usedHintRef,
    showGhostHint,
    showGhostWhenIdle,
    setQuadrantTimes,
    quadrantCompleteSeenRef,
    setCompletionDismissed,
    setShowWinOverlay,
    setCompletionImageUrl,
    setLives,
    dynamicDifficultyEnabled,
    grid,
    dynamicDifficultyMultiplierRef,
    getToleranceMultiplier,
    isHost,
    sessionIdFromUrl,
    session,
    sessionLoading,
    isCoarsePointer,
    setShowStreakToast,
    setShareToast,
    isPaused,
    audioManager,
    manager,
    recordSnapshotRef,
    replay,
    initialSnapshotRecordedRef,
    replayStateRef,
    elapsedSeconds,
    stateRef,
    canvasRef,
    completionImageUrl,
    setState: _setState,
    setReplayBarOpen: _setReplayBarOpen,
  } = args;

  const completionSnapshotRecordedRef = useRef(false);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => setBoardSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [boardRef, setBoardSize, state?.pieces?.length, completionDismissed]);

  // Mobile orientation changes can briefly report stale layout metrics; re-center viewport
  // and re-measure board after the new orientation settles.
  useEffect(() => {
    const onOrientationOrResize = () => {
      const measure = () => {
        const el = boardRef.current;
        if (!el) return;
        setBoardSize({ w: el.clientWidth, h: el.clientHeight });
      };
      requestAnimationFrame(() => {
        measure();
        viewport?.reset?.();
      });
      setTimeout(() => {
        measure();
      }, 320);
    };
    window.addEventListener("orientationchange", onOrientationOrResize);
    return () => {
      window.removeEventListener("orientationchange", onOrientationOrResize);
    };
  }, [boardRef, setBoardSize, viewport]);

  useLayoutEffect(() => {
    if (!replayBarOpen) {
      setReplayBarBoardRect(null);
      return;
    }
    const el = boardRef.current;
    if (!el) return;
    // Anchor replay controls to the board progress frame (outer visual edge), not the inner board.
    const anchor = el.parentElement instanceof HTMLElement ? el.parentElement : el;
    let raf = 0;
    const measure = () => {
      const r = anchor.getBoundingClientRect();
      setReplayBarBoardRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(anchor);
    const unsubViewport = subscribeViewportLayoutChanges(schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsubViewport();
    };
  }, [
    replayBarOpen,
    boardRef,
    setReplayBarBoardRect,
    args.boardSize?.w,
    args.boardSize?.h,
  ]);

  useEffect(() => {
    undoCountRef.current = 0;
    moveCountRef.current = 0;
    rotationCountRef.current = 0;
    maxGroupSizeRef.current = 0;
    precisionSnapsRef.current = [];
    abandonCapturedRef.current = false;
    usedHintRef.current = showGhostHint || showGhostWhenIdle;
    setQuadrantTimes({ 0: null, 1: null, 2: null, 3: null });
    quadrantCompleteSeenRef.current.clear();
    setCompletionDismissed(false);
    setShowWinOverlay?.(false);
    setCompletionImageUrl(undefined);
    setLives(3);
  }, [
    puzzleKey,
    showGhostHint,
    showGhostWhenIdle,
    undoCountRef,
    moveCountRef,
    rotationCountRef,
    maxGroupSizeRef,
    precisionSnapsRef,
    abandonCapturedRef,
    usedHintRef,
    setQuadrantTimes,
    quadrantCompleteSeenRef,
    setCompletionDismissed,
    setCompletionImageUrl,
    setLives,
  ]);

  useEffect(() => {
    if (!dynamicDifficultyEnabled || !grid) {
      dynamicDifficultyMultiplierRef.current = 1;
      return;
    }
    dynamicDifficultyMultiplierRef.current = getToleranceMultiplier(grid.rows, grid.cols);
  }, [
    dynamicDifficultyEnabled,
    grid?.rows,
    grid?.cols,
    dynamicDifficultyMultiplierRef,
    getToleranceMultiplier,
  ]);

  useEffect(() => {
    if (state?.isComplete) return;
    if (showGhostHint || showGhostWhenIdle) {
      usedHintRef.current = true;
    }
  }, [showGhostHint, showGhostWhenIdle, state?.isComplete, usedHintRef]);

  useEffect(() => {
    if (!isHost && sessionIdFromUrl && session && !sessionLoading) {
      posthog.capture("coop_join_success", {
        grid_size: session.grid ? `${session.grid.rows}x${session.grid.cols}` : "unknown",
        device_type: isCoarsePointer ? "mobile" : "desktop",
      });
    }
  }, [isHost, sessionIdFromUrl, session, sessionLoading, isCoarsePointer]);

  useEffect(() => {
    if (!isHost && sessionIdFromUrl && sessionLoading) {
      posthog.capture("coop_join_opened", { retry: false });
    }
  }, [isHost, sessionIdFromUrl, sessionLoading]);

  useEffect(() => {
    if (state?.isComplete) {
      setShowStreakToast(false);
      setShareToast(null);
    }
  }, [state?.isComplete, setShowStreakToast, setShareToast]);

  /** After completion, run brief animation (glow/pulse) then show win overlay.
   * Guard: never re-show the win overlay while replay is active — restoring the
   * final completed state at the end of replay would otherwise re-trigger this.
   * Guard: if the player already dismissed the win UI, do not schedule a timer that
   * would flip `showWinOverlay` back on (fixes flicker / overlay popping back). */
  const COMPLETION_ANIMATION_MS = 600;
  useEffect(() => {
    if (!state?.isComplete || replayBarOpen) {
      setShowWinOverlay?.(false);
      return;
    }
    if (completionDismissed) {
      setShowWinOverlay?.(false);
      return;
    }
    const t = setTimeout(() => setShowWinOverlay?.(true), COMPLETION_ANIMATION_MS);
    return () => clearTimeout(t);
  }, [state?.isComplete, replayBarOpen, completionDismissed, setShowWinOverlay]);

  useEffect(() => {
    audioManager.setPaused(isPaused);
  }, [audioManager, isPaused]);

  useEffect(() => {
    audioManager.tryStartAmbientIfEnabled();
    return () => {
      audioManager.leavePlayScreen();
    };
  }, [audioManager]);

  useEffect(() => {
    if (!state?.isComplete || completionDismissed || !state) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      void (async () => {
        const canvas = canvasRef.current;
        if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
        try {
          const url = await canvasToObjectUrl(canvas, "image/png");
          if (!url || cancelled) {
            revokeObjectUrl(url);
            return;
          }
          revokeObjectUrl(completionImageUrl);
          setCompletionImageUrl(url);
        } catch {
          // ignore snapshot failures
        }
      })();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [
    state?.isComplete,
    completionDismissed,
    state,
    canvasRef,
    setCompletionImageUrl,
    completionImageUrl,
  ]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(completionImageUrl);
    };
  }, [completionImageUrl]);

  useEffect(() => {
    return () => {
      if (stateRef.current && !stateRef.current.isComplete) {
        posthog.capture("exit_before_completion");
      }
    };
  }, [stateRef]);

  useEffect(() => {
    replayStateRef.current = {
      getState: () => manager?.getState() ?? null,
      elapsedSeconds,
      moveCount: moveCountRef.current,
    };
  }, [replayStateRef, manager, elapsedSeconds, moveCountRef]);

  useEffect(() => {
    recordSnapshotRef.current = replay.recordSnapshot;
  }, [recordSnapshotRef, replay.recordSnapshot]);

  useEffect(() => {
    const pieces = state?.pieces;
    if (pieces?.length) {
      const boardPieces = pieces.filter((p: Piece) => !p.inTray);
      if (boardPieces.length > 0) {
        const byGroup = new Map<string, number>();
        for (const p of boardPieces) {
          const g = p.groupId ?? p.id;
          byGroup.set(g, (byGroup.get(g) ?? 0) + 1);
        }
        const max = Math.max(...byGroup.values(), 0);
        if (max > maxGroupSizeRef.current) maxGroupSizeRef.current = max;
      }
    }
    if (
      state?.placedCount === 0 &&
      (state?.pieces?.length ?? 0) > 0 &&
      !initialSnapshotRecordedRef.current
    ) {
      initialSnapshotRecordedRef.current = true;
      replay.recordSnapshot();
    }
    if (
      state?.isComplete &&
      (state?.pieces?.length ?? 0) > 0 &&
      !completionSnapshotRecordedRef.current
    ) {
      completionSnapshotRecordedRef.current = true;
      replay.recordSnapshot();
    }
  }, [
    state?.placedCount,
    state?.pieces,
    state?.isComplete,
    replay.recordSnapshot,
    maxGroupSizeRef,
    initialSnapshotRecordedRef,
  ]);

  useEffect(() => {
    if (puzzleKey != null) {
      initialSnapshotRecordedRef.current = false;
      completionSnapshotRecordedRef.current = false;
    }
  }, [puzzleKey, initialSnapshotRecordedRef]);
}
