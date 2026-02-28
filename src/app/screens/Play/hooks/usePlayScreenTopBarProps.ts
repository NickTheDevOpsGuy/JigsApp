/**
 * Builds headerMenuProps, hudProps, and topBarButtonsProps for PlayScreenTopBar.
 * Extracted from PlayScreen to keep the main component smaller.
 */
import { useMemo } from "react";
import type { MutableRefObject } from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { createUndoRedoHandler } from "../playUtils";
import { getQuadrantPb } from "../timeMode";
import { isSupabaseConfigured } from "@/supabase/client";
import type { HeaderMenuProps } from "../components/headerMenuConfigTypes";
import type { DebugFlags } from "../components/headerMenuConfigTypes";
import type { TimeMode } from "../timeMode";
import type { Theme } from "@/hooks/useTheme";
import type { RealtimeStatus } from "./usePuzzleSession";

/** Minimal viewport API needed for top bar (reset, zoom). */
export type ViewportHandle = {
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export type UsePlayScreenTopBarPropsParams = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  timeMode: TimeMode;
  setTimeMode: (m: TimeMode | ((prev: TimeMode) => TimeMode)) => void;
  countdownMinutes: number;
  setCountdownMinutes: (n: number | ((prev: number) => number)) => void;
  showPreview: boolean;
  setShowPreview: (fn: (p: boolean) => boolean) => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  pieceLockingEnabled: boolean;
  setPieceLockingEnabled: (fn: (p: boolean) => boolean) => void;
  showGhostHint: boolean;
  setShowGhostHint: (fn: (g: boolean) => boolean) => void;
  showGhostWhenIdle: boolean;
  showEdgeHighlight: boolean;
  showClusterOutline: boolean;
  deliberateDetachEnabled: boolean;
  showAlignmentGrid: boolean;
  setShowAlignmentGrid: (fn: (a: boolean) => boolean) => void;
  toggleRelaxedMode: () => void;
  toggleDriftMode: () => void;
  toggleShowClusterOutline: () => void;
  toggleDeliberateDetach: () => void;
  toggleShowGhostWhenIdle: () => void;
  toggleShowEdgeHighlight: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleHaptics: () => void;
  toggleFullscreen: () => void;
  toggleDebug: () => void;
  togglePerfOverlay: () => void;
  isFullscreen: boolean;
  isCoarsePointer: boolean;
  showDebug: boolean;
  debug: DebugFlags;
  setShowNewGameModal: (v: boolean) => void;
  setShowShortcuts: (v: boolean) => void;
  setShowHowToPlay: (v: boolean) => void;
  setShowThemeModal: (v: boolean) => void;
  setShowResetStatsConfirm: (v: boolean) => void;
  setShowClearCacheConfirm: (v: boolean) => void;
  manager: PuzzleManager | null;
  state: PuzzleState | null;
  setState: (s: PuzzleState) => void;
  isPaused: boolean;
  setIsPaused: (fn: (p: boolean) => boolean) => void;
  playUndo: (s: "undo") => void;
  undoCountRef: MutableRefObject<number>;
  undoSnapBackRef: MutableRefObject<{
    fromPositions: import("../playUtils").UndoSnapBackFrom;
    startMs: number;
  } | null>;
  viewport: ViewportHandle;
  relaxedModeEnabled: boolean;
  driftModeEnabled: boolean;
  immersiveMode: boolean;
  handleToggleImmersiveMode: () => void;
  progressiveRevealMode: boolean;
  setProgressiveRevealMode: (fn: (v: boolean) => boolean) => void;
  pieceCutType: "classic" | "irregular" | "hard";
  setPieceCutType: (cut: "classic" | "irregular" | "hard") => void;
  handleSharePuzzle: (() => void | Promise<void>) | undefined;
  creatingSession: boolean;
  dailyPreferredModifier:
    | import("@/daily/dailyPuzzleCore").DailyVisualModifier
    | undefined;
  setDailyPreferredModifier: (
    m: import("@/daily/dailyPuzzleCore").DailyVisualModifier,
  ) => void;
  snapToleranceOverride: number;
  setSnapToleranceOverride: (value: number) => void;
  // HUD
  elapsedSeconds: number;
  piecesLeft: number;
  totalPieces: number;
  isComplete: boolean;
  grid: { rows: number; cols: number } | null;
  quadrantTimes: Record<0 | 1 | 2 | 3, number | null>;
  bestTimeSeconds: number | null;
  lives: number;
  // Top bar meta
  sessionId: string | null;
  realtimeStatus: RealtimeStatus;
  connectedCount: number;
  showImmersiveUi: boolean;
  scheduleImmersiveHide: () => void;
};

export type PlayScreenTopBarPropsResult = {
  headerMenuProps: HeaderMenuProps;
  hudProps: {
    elapsedSeconds: number;
    piecesLeft: number;
    totalPieces: number;
    isPaused: boolean;
    isComplete: boolean;
    timeMode: TimeMode;
    countdownMinutes?: number;
    bestTimeSeconds?: number | null;
    quadrantTimes?: Record<0 | 1 | 2 | 3, number | null>;
    quadrantPbs?: Record<0 | 1 | 2 | 3, number | null>;
    lives?: number;
    onTogglePause: () => void;
  };
  topBarButtonsProps: {
    showPreview: boolean;
    soundEnabled: boolean;
    isFullscreen: boolean;
    showDebug: boolean;
    isCoarsePointer: boolean;
    onTogglePreview: () => void;
    onToggleSound: () => void;
    onToggleFullscreen: () => void;
    onShowShortcuts: () => void;
    onToggleDebug: () => void;
    onNewPuzzle: () => void;
  };
  sessionId: string | null;
  realtimeStatus: RealtimeStatus;
  connectedCount: number;
  showHud: boolean;
  immersiveMode: boolean;
  showImmersiveUi: boolean;
  onPointerLeave: (() => void) | undefined;
};

function withHaptic(hapticsEnabled: boolean, fn: () => void): () => void {
  return () => {
    if (hapticsEnabled && typeof navigator?.vibrate === "function") navigator.vibrate(10);
    fn();
  };
}

export function usePlayScreenTopBarProps(
  params: UsePlayScreenTopBarPropsParams,
): PlayScreenTopBarPropsResult {
  const {
    theme,
    setTheme,
    timeMode,
    setTimeMode,
    countdownMinutes,
    setCountdownMinutes,
    showPreview,
    setShowPreview,
    soundEnabled,
    musicEnabled,
    hapticsEnabled,
    pieceLockingEnabled,
    setPieceLockingEnabled,
    showGhostHint,
    setShowGhostHint,
    showGhostWhenIdle,
    showEdgeHighlight,
    showClusterOutline,
    deliberateDetachEnabled,
    showAlignmentGrid,
    setShowAlignmentGrid,
    toggleRelaxedMode,
    toggleDriftMode,
    toggleShowClusterOutline,
    toggleDeliberateDetach,
    toggleShowGhostWhenIdle,
    toggleShowEdgeHighlight,
    toggleSound,
    toggleMusic,
    toggleHaptics,
    toggleFullscreen,
    toggleDebug,
    togglePerfOverlay,
    isFullscreen,
    isCoarsePointer,
    showDebug,
    debug,
    setShowNewGameModal,
    setShowShortcuts,
    setShowHowToPlay,
    setShowThemeModal,
    setShowResetStatsConfirm,
    setShowClearCacheConfirm,
    manager,
    state,
    setState,
    isPaused,
    setIsPaused,
    playUndo,
    undoCountRef,
    undoSnapBackRef,
    viewport,
    relaxedModeEnabled,
    driftModeEnabled,
    immersiveMode,
    handleToggleImmersiveMode,
    progressiveRevealMode,
    setProgressiveRevealMode,
    pieceCutType,
    setPieceCutType,
    handleSharePuzzle,
    creatingSession,
    dailyPreferredModifier,
    setDailyPreferredModifier,
    snapToleranceOverride,
    setSnapToleranceOverride,
    elapsedSeconds,
    piecesLeft,
    totalPieces,
    isComplete,
    grid,
    quadrantTimes,
    bestTimeSeconds,
    lives,
    sessionId,
    realtimeStatus,
    connectedCount,
    showImmersiveUi,
    scheduleImmersiveHide,
  } = params;

  return useMemo(() => {
    const headerMenuProps: HeaderMenuProps = {
      title: "Phuzzle",
      theme,
      setTheme,
      timeMode,
      setTimeMode: (modeOrFn) => {
        if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
        setTimeMode(modeOrFn);
      },
      countdownMinutes,
      setCountdownMinutes,
      showPreview,
      soundEnabled,
      musicEnabled,
      hapticsEnabled,
      pieceLockingEnabled,
      showGhostHint,
      showGhostWhenIdle,
      showEdgeHighlight,
      showClusterOutline,
      onToggleClusterOutline: withHaptic(hapticsEnabled, toggleShowClusterOutline),
      deliberateDetachEnabled,
      onToggleDeliberateDetach: withHaptic(hapticsEnabled, toggleDeliberateDetach),
      showAlignmentGrid,
      isFullscreen,
      canShowHaptics: isCoarsePointer && typeof navigator?.vibrate === "function",
      canShowFullscreen: typeof document !== "undefined" && !!document.fullscreenEnabled,
      canShowShortcuts: !isCoarsePointer,
      canShowDebug: showDebug,
      debug,
      onNewPuzzle: () => setShowNewGameModal(true),
      canUndo: !!(manager?.canUndo() && !isPaused && !state?.isComplete),
      onUndo: createUndoRedoHandler(
        manager ?? null,
        "undo",
        setState,
        () => Boolean(manager?.canUndo() && !isPaused && !state?.isComplete),
        playUndo,
        () => {
          undoCountRef.current += 1;
        },
        (fromPositions) => {
          undoSnapBackRef.current = { fromPositions, startMs: performance.now() };
        },
      ),
      canRedo: !!(manager?.canRedo() && !isPaused && !state?.isComplete),
      onRedo: createUndoRedoHandler(
        manager ?? null,
        "redo",
        setState,
        () => Boolean(manager?.canRedo() && !isPaused && !state?.isComplete),
        playUndo,
        undefined,
        (fromPositions) => {
          undoSnapBackRef.current = { fromPositions, startMs: performance.now() };
        },
      ),
      onResetView: () => viewport.reset(),
      onTogglePreview: withHaptic(hapticsEnabled, () => setShowPreview((p) => !p)),
      onToggleSound: toggleSound,
      onToggleMusic: toggleMusic,
      onToggleHaptics: toggleHaptics,
      onTogglePieceLocking: withHaptic(hapticsEnabled, () =>
        setPieceLockingEnabled((p) => !p),
      ),
      relaxedModeEnabled,
      onToggleRelaxedMode: withHaptic(hapticsEnabled, toggleRelaxedMode),
      driftModeEnabled,
      onToggleDriftMode: withHaptic(hapticsEnabled, toggleDriftMode),
      onToggleGhostHint: withHaptic(hapticsEnabled, () => setShowGhostHint((g) => !g)),
      onToggleGhostWhenIdle: withHaptic(hapticsEnabled, toggleShowGhostWhenIdle),
      onToggleEdgeHighlight: withHaptic(hapticsEnabled, toggleShowEdgeHighlight),
      onToggleAlignmentGrid: withHaptic(hapticsEnabled, () =>
        setShowAlignmentGrid((a) => !a),
      ),
      onToggleFullscreen: toggleFullscreen,
      onZoomIn: () => viewport.zoomIn(),
      onZoomOut: () => viewport.zoomOut(),
      onShowShortcuts: () => setShowShortcuts(true),
      onShowHowToPlay: () => setShowHowToPlay(true),
      onToggleDebug: toggleDebug,
      onTogglePerfOverlay: togglePerfOverlay,
      immersiveMode,
      onToggleImmersiveMode: withHaptic(hapticsEnabled, handleToggleImmersiveMode),
      progressiveRevealMode,
      onToggleProgressiveReveal: withHaptic(hapticsEnabled, () =>
        setProgressiveRevealMode((v) => !v),
      ),
      pieceCutType,
      onPieceCutTypeChange: (cut) => {
        if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
        setPieceCutType(cut);
      },
      onSharePuzzle: isSupabaseConfigured() ? handleSharePuzzle : undefined,
      shareDisabled: creatingSession,
      onOpenThemeModal: withHaptic(hapticsEnabled, () => setShowThemeModal(true)),
      dailyPreferredModifier,
      onDailyPreferredModifierChange: (m) => {
        if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
        setDailyPreferredModifier(m);
      },
      onResetStats: () => setShowResetStatsConfirm(true),
      onClearCache: () => setShowClearCacheConfirm(true),
      snapToleranceOverride,
      onSnapToleranceOverrideChange: setSnapToleranceOverride,
    };

    const hudProps = {
      elapsedSeconds,
      piecesLeft,
      totalPieces,
      isPaused,
      isComplete,
      timeMode,
      countdownMinutes,
      bestTimeSeconds,
      quadrantTimes: timeMode === "speedrun" ? quadrantTimes : undefined,
      quadrantPbs:
        timeMode === "speedrun" && grid
          ? {
              0: getQuadrantPb(grid.rows, grid.cols, 0),
              1: getQuadrantPb(grid.rows, grid.cols, 1),
              2: getQuadrantPb(grid.rows, grid.cols, 2),
              3: getQuadrantPb(grid.rows, grid.cols, 3),
            }
          : undefined,
      lives: timeMode === "timeattack" ? lives : undefined,
      onTogglePause: () => setIsPaused((p) => !p),
    };

    const topBarButtonsProps = {
      showPreview,
      soundEnabled,
      isFullscreen,
      showDebug,
      isCoarsePointer,
      onTogglePreview: () => setShowPreview((p) => !p),
      onToggleSound: toggleSound,
      onToggleFullscreen: toggleFullscreen,
      onShowShortcuts: () => setShowShortcuts(true),
      onToggleDebug: toggleDebug,
      onNewPuzzle: () => setShowNewGameModal(true),
    };

    return {
      headerMenuProps,
      hudProps,
      topBarButtonsProps,
      sessionId,
      realtimeStatus,
      connectedCount,
      showHud: !isComplete && !isPaused,
      immersiveMode,
      showImmersiveUi,
      onPointerLeave: immersiveMode ? scheduleImmersiveHide : undefined,
    };
  }, [
    theme,
    setTheme,
    timeMode,
    setTimeMode,
    countdownMinutes,
    setCountdownMinutes,
    showPreview,
    setShowPreview,
    soundEnabled,
    musicEnabled,
    hapticsEnabled,
    pieceLockingEnabled,
    setPieceLockingEnabled,
    showGhostHint,
    setShowGhostHint,
    showGhostWhenIdle,
    showEdgeHighlight,
    showClusterOutline,
    deliberateDetachEnabled,
    showAlignmentGrid,
    setShowAlignmentGrid,
    toggleRelaxedMode,
    toggleDriftMode,
    toggleShowClusterOutline,
    toggleDeliberateDetach,
    toggleShowGhostWhenIdle,
    toggleShowEdgeHighlight,
    toggleSound,
    toggleMusic,
    toggleHaptics,
    toggleFullscreen,
    toggleDebug,
    togglePerfOverlay,
    isFullscreen,
    isCoarsePointer,
    showDebug,
    debug,
    setShowNewGameModal,
    setShowShortcuts,
    setShowHowToPlay,
    setShowThemeModal,
    setShowResetStatsConfirm,
    setShowClearCacheConfirm,
    manager,
    state,
    setState,
    isPaused,
    setIsPaused,
    playUndo,
    undoCountRef,
    undoSnapBackRef,
    viewport,
    relaxedModeEnabled,
    driftModeEnabled,
    immersiveMode,
    handleToggleImmersiveMode,
    progressiveRevealMode,
    setProgressiveRevealMode,
    pieceCutType,
    setPieceCutType,
    handleSharePuzzle,
    creatingSession,
    dailyPreferredModifier,
    setDailyPreferredModifier,
    snapToleranceOverride,
    setSnapToleranceOverride,
    elapsedSeconds,
    piecesLeft,
    totalPieces,
    isComplete,
    grid,
    quadrantTimes,
    bestTimeSeconds,
    lives,
    sessionId,
    realtimeStatus,
    connectedCount,
    showImmersiveUi,
    scheduleImmersiveHide,
  ]);
}
