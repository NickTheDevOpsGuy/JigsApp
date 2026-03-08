import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import { useEffect, useLayoutEffect } from "react";
import posthog from "posthog-js";
import type { Piece, PuzzleState } from "@/puzzle/types";

export interface UsePlayScreenLifecycleEffectsArgs {
  boardRef: RefObject<HTMLDivElement | null>;
  setBoardSize: (size: { w: number; h: number }) => void;
  viewport: { reset?: () => void };
  state: PuzzleState | null;
  completionDismissed: boolean;
  replayBarOpen: boolean;
  setReplayBarBoardRect: (rect: { left: number; width: number } | null) => void;
  puzzleKey: number | null;
  undoCountRef: MutableRefObject<number>;
  moveCountRef: MutableRefObject<number>;
  rotationCountRef: MutableRefObject<number>;
  maxGroupSizeRef: MutableRefObject<number>;
  precisionSnapsRef: MutableRefObject<number[]>;
  abandonCapturedRef: MutableRefObject<boolean>;
  usedHintRef: MutableRefObject<boolean>;
  showGhostHint: boolean;
  showGhostWhenIdle: boolean;
  setQuadrantTimes: Dispatch<SetStateAction<Record<0 | 1 | 2 | 3, number | null>>>;
  setCompletionDismissed: (v: boolean) => void;
  setCompletionImageUrl: (url: string | undefined) => void;
  setLives: Dispatch<SetStateAction<number>>;
  dynamicDifficultyEnabled: boolean;
  grid: { rows: number; cols: number } | null;
  dynamicDifficultyMultiplierRef: MutableRefObject<number>;
  getToleranceMultiplier: (rows: number, cols: number) => number;
  isHost: boolean;
  sessionIdFromUrl: string | null;
  session: { grid?: { rows: number; cols: number } } | null;
  sessionLoading: boolean;
  isCoarsePointer: boolean;
  setShowStreakToast: Dispatch<SetStateAction<boolean>>;
  setShareToast: Dispatch<SetStateAction<string | null>>;
  isPaused: boolean;
  audioManager: { setPaused: (p: boolean) => void; tryStartAmbientIfEnabled: () => void; leavePlayScreen: () => void };
  manager: { getState: () => PuzzleState };
  recordSnapshotRef: MutableRefObject<() => void>;
  replay: { recordSnapshot: () => void };
  initialSnapshotRecordedRef: MutableRefObject<boolean>;
  replayStateRef: MutableRefObject<unknown>;
  elapsedSeconds: number;
  stateRef: MutableRefObject<PuzzleState | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  completionImageUrl: string | undefined;
  setState?: (st: PuzzleState) => void;
  setReplayBarOpen?: (open: boolean) => void;
  boardSize: { w: number; h: number };
}

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
    setCompletionDismissed,
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
      }, 220);
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
    const measure = () => {
      const r = el.getBoundingClientRect();
      setReplayBarBoardRect({ left: r.left, width: r.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
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
    setCompletionDismissed(false);
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
    const id = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        setCompletionImageUrl(dataUrl);
      } catch {
        // ignore toDataURL failures
      }
    });
    return () => cancelAnimationFrame(id);
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
  }, [
    state?.placedCount,
    state?.pieces,
    replay.recordSnapshot,
    maxGroupSizeRef,
    initialSnapshotRecordedRef,
  ]);

  useEffect(() => {
    if (puzzleKey != null) initialSnapshotRecordedRef.current = false;
  }, [puzzleKey, initialSnapshotRecordedRef]);
}
