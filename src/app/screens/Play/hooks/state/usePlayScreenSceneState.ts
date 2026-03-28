import React from "react";
import type { Piece, PuzzleState } from "@/puzzle/core/types";
import type { ResumeChoice } from "@/screens/Play/hooks/manager/usePlayScreenManager";
import type { ReplayStateRef } from "@/screens/Play/hooks/gameplay/useReplay";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "@/hooks/useBatterySaver";
import { useHaptics } from "@/screens/Play/hooks/system/useHaptics";
import { useCoarsePointer } from "@/screens/Play/hooks/system/useCoarsePointer";
import { useViewport } from "@/screens/Play/hooks/viewport/useViewport";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";

export function usePlayScreenSceneState(grid: { rows: number; cols: number } | null) {
  const lastInteractionRef = React.useRef(performance.now());
  const [resumeChoice, setResumeChoice] = React.useState<ResumeChoice>(null);
  const [restartSamePuzzleKey, setRestartSamePuzzleKey] = React.useState(0);
  const { theme, setTheme } = useTheme();
  const detectedBatterySaver = useBatterySaver();
  const themeRef = React.useRef(theme);
  themeRef.current = theme;
  const haptics = useHaptics();
  const isCoarsePointer = useCoarsePointer();
  const batterySaverMode = React.useMemo(() => {
    if (detectedBatterySaver) return true;
    if (!isCoarsePointer || typeof navigator === "undefined") return false;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
    };
    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
    const lowCpu =
      typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 6;
    return lowMemory || lowCpu;
  }, [detectedBatterySaver, isCoarsePointer]);

  const [showStreakToast, setShowStreakToast] = React.useState(false);
  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [immersiveReveal, setImmersiveReveal] = React.useState(false);
  const immersiveHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = React.useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = React.useState(false);
  const [completionDismissed, setCompletionDismissed] = React.useState(false);
  /** True after completion animation (glow/pulse) has played; then win overlay is shown. */
  const [showWinOverlay, setShowWinOverlay] = React.useState(false);
  const [replayBarOpen, setReplayBarOpen] = React.useState(false);
  const [replayBarBoardRect, setReplayBarBoardRect] = React.useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [completionImageUrl, setCompletionImageUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [boardSize, setBoardSize] = React.useState({ w: 800, h: 600 });
  const [lives, setLives] = React.useState(3);

  const viewportKey = grid != null ? `vp:${grid.rows}x${grid.cols}` : null;
  const viewportBoundsRef = React.useRef<
    | (() => {
        contentW: number;
        contentH: number;
        containerW: number;
        containerH: number;
      } | null)
    | null
  >(null);
  const viewport = useViewport(viewportKey, viewportBoundsRef);
  const snapScaleRef = React.useRef(1);
  snapScaleRef.current = viewport.viewport.scale;

  const perfStatsRef = React.useRef({
    fps: 0,
    drawsPerSec: 0,
    activeGroups: 0,
    snapCheckCount: 0,
    snapChecksPerSec: 0,
  });
  const wrongRotationHintRef = React.useRef<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>(null);
  const dragStartTimeRef = React.useRef<number | null>(null);
  const stateRef = React.useRef<PuzzleState | null>(null);
  const trayPiecesKeyRef = React.useRef<{ key: string; pieces: Piece[] }>({
    key: "",
    pieces: [],
  });
  const undoCountRef = React.useRef(0);
  const moveCountRef = React.useRef(0);
  const rotationCountRef = React.useRef(0);
  const maxGroupSizeRef = React.useRef(0);
  const precisionSnapsRef = React.useRef<number[]>([]);
  const dynamicDifficultyMultiplierRef = React.useRef<number>(1);
  const usedHintRef = React.useRef(false);
  const abandonCapturedRef = React.useRef(false);
  const elapsedSecondsRef = React.useRef(0);
  const replayStateRef = React.useRef<ReplayStateRef | null>(null);
  const recordSnapshotRef = React.useRef<() => void>(() => {});
  const initialSnapshotRecordedRef = React.useRef(false);
  const [quadrantTimes, setQuadrantTimes] = React.useState<
    Record<0 | 1 | 2 | 3, number | null>
  >({ 0: null, 1: null, 2: null, 3: null });
  const quadrantCompleteSeenRef = React.useRef<Set<0 | 1 | 2 | 3>>(new Set());
  const completionFocusRef = React.useRef<HTMLButtonElement>(null);

  const startThisPuzzleOver = React.useCallback(() => {
    clearPuzzleState();
    setResumeChoice("fresh");
    setReplayBarOpen(false);
    setCompletionDismissed(false);
    setShowWinOverlay(false);
    setCompletionImageUrl(undefined);
    setShowStreakToast(false);
    setShareToast(null);
    viewport.reset();
    setRestartSamePuzzleKey((k) => k + 1);
  }, [viewport.reset]);

  return {
    lastInteractionRef,
    resumeChoice,
    setResumeChoice,
    restartSamePuzzleKey,
    startThisPuzzleOver,
    theme,
    setTheme,
    batterySaverMode,
    themeRef,
    haptics,
    isCoarsePointer,
    showStreakToast,
    setShowStreakToast,
    shareToast,
    setShareToast,
    immersiveReveal,
    setImmersiveReveal,
    immersiveHideTimerRef,
    showResetStatsConfirm,
    setShowResetStatsConfirm,
    showClearCacheConfirm,
    setShowClearCacheConfirm,
    completionDismissed,
    setCompletionDismissed,
    showWinOverlay,
    setShowWinOverlay,
    replayBarOpen,
    setReplayBarOpen,
    replayBarBoardRect,
    setReplayBarBoardRect,
    completionImageUrl,
    setCompletionImageUrl,
    boardSize,
    setBoardSize,
    lives,
    setLives,
    viewportBoundsRef,
    viewport,
    snapScaleRef,
    perfStatsRef,
    wrongRotationHintRef,
    dragStartTimeRef,
    stateRef,
    trayPiecesKeyRef,
    undoCountRef,
    moveCountRef,
    rotationCountRef,
    maxGroupSizeRef,
    precisionSnapsRef,
    dynamicDifficultyMultiplierRef,
    usedHintRef,
    abandonCapturedRef,
    elapsedSecondsRef,
    replayStateRef,
    recordSnapshotRef,
    initialSnapshotRecordedRef,
    quadrantTimes,
    setQuadrantTimes,
    quadrantCompleteSeenRef,
    completionFocusRef,
  };
}
