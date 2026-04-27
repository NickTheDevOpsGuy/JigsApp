import { getQuadrantPb } from "@/screens/Play/core/time/timeMode";
import type {
  BuildHudPropsArgs,
  BuildTopBarButtonsPropsArgs,
} from "@/screens/Play/hooks/topBar/usePlayScreenTopBarPropsBuilders.types";

export function buildHudProps(args: BuildHudPropsArgs) {
  const {
    state,
    elapsedSeconds,
    moveCount,
    adaptivePersonalityEnabled,
    piecesLeft,
    totalPieces,
    isPaused,
    isComplete,
    timeMode,
    countdownMinutes,
    bestTimeSeconds,
    quadrantTimes,
    grid,
    lives,
    setIsPaused,
    zenModeEnabled,
    challengeTargetLabel,
  } = args;
  const movesPerMin = (state?.placedCount ?? 0) / Math.max(0.1, elapsedSeconds / 60);
  const uiTone =
    adaptivePersonalityEnabled && elapsedSeconds >= 10
      ? movesPerMin >= 6
        ? ("competitive" as const)
        : ("calm" as const)
      : undefined;

  return {
    elapsedSeconds,
    moveCount,
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
    zenModeEnabled,
    uiTone,
    challengeTargetLabel,
  };
}

export function buildTopBarButtonsProps(args: BuildTopBarButtonsPropsArgs) {
  const {
    showPreview,
    soundEnabled,
    isFullscreen,
    showDebug,
    isCoarsePointer,
    setShowPreview,
    toggleSound,
    toggleFullscreen,
    setShowShortcuts,
    toggleDebug,
    setShowNewGameModal,
  } = args;
  return {
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
}
