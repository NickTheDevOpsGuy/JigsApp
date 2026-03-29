import React, { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";
import type { Piece } from "@/puzzle/core/types";

import { useReplay } from "@/screens/Play/hooks/gameplay/useReplay";
import { usePlayScreenLifecycleEffects } from "@/screens/Play/hooks/lifecycle/usePlayScreenLifecycleEffects";
import { useReferenceTapHighlight } from "@/screens/Play/hooks/gameplay/useReferenceTapHighlight";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePlayScreenMilestones } from "@/screens/Play/hooks/gameplay/usePlayScreenMilestones";
import { useBorderFrameMilestone } from "@/screens/Play/hooks/gameplay/useBorderFrameMilestone";
import { useAutoClearSelection } from "@/screens/Play/hooks/gameplay/useAutoClearSelection";
import { useShouldShowTutorial } from "@/components/HowToPlay";
import { usePlayScreenShortcutsFromSetup } from "./playScreenSceneBehaviorShortcuts";
import { usePlayScreenTimer } from "@/screens/Play/hooks/gameplay/usePlayScreenTimer";
import { audioManager } from "@/audio/manager/audioManager";
import { usePlayScreenPersistence } from "@/screens/Play/hooks/lifecycle/usePlayScreenPersistence";
import { usePlayDocumentTitle } from "@/screens/Play/hooks/lifecycle/usePlayDocumentTitle";
import { useFirstPieceCelebration } from "@/screens/Play/hooks/animation/useFirstPieceCelebration";
import { usePlayScreenSecondaryEffects } from "@/screens/Play/hooks/lifecycle/usePlayScreenSecondaryEffects";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- setup shape is large and shared across many hooks
export function usePlayScreenBehavior(setup: any) {
  const {
    grid,
    ui,
    scene,
    timeMode,
    managerResult,
    session,
    sessionLoading,
    sessionIdFromUrl,
    isHost,
    sessionId,
    pushState,
    remoteState,
    clearRemoteState,
    isDailySession,
  } = setup;

  const {
    manager,
    state,
    puzzleKey,
    setState,
    elapsedSeconds,
    setElapsedSeconds,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    snapCombo,
    announcerLine,
    imgRef,
    popMapRef,
    lockMapRef,
    snapParticlesRef,
  } = managerResult;
  const replay = useReplay(
    manager,
    setState,
    scene.replayStateRef,
    state?.isComplete ?? false,
  );
  const replayViewportBeforeOpenRef = useRef<{
    scale: number;
    panX: number;
    panY: number;
  } | null>(null);
  const wasReplayOpenRef = useRef(false);
  const zoomOnCompleteRunRef = useRef(false);
  const completionCapturedRef = useRef(false);
  const onFireCapturedRef = useRef(false);
  usePlayScreenLifecycleEffects({
    boardRef,
    setBoardSize: scene.setBoardSize,
    viewport: scene.viewport,
    state,
    completionDismissed: scene.completionDismissed,
    replayBarOpen: scene.replayBarOpen,
    setReplayBarBoardRect: scene.setReplayBarBoardRect,
    boardSize: scene.boardSize,
    puzzleKey,
    undoCountRef: scene.undoCountRef,
    moveCountRef: scene.moveCountRef,
    rotationCountRef: scene.rotationCountRef,
    maxGroupSizeRef: scene.maxGroupSizeRef,
    precisionSnapsRef: scene.precisionSnapsRef,
    abandonCapturedRef: scene.abandonCapturedRef,
    usedHintRef: scene.usedHintRef,
    showGhostHint: ui.showGhostHint,
    showGhostWhenIdle: ui.showGhostWhenIdle,
    setQuadrantTimes: scene.setQuadrantTimes,
    quadrantCompleteSeenRef: scene.quadrantCompleteSeenRef,
    setCompletionDismissed: scene.setCompletionDismissed,
    setShowWinOverlay: scene.setShowWinOverlay,
    setCompletionImageUrl: scene.setCompletionImageUrl,
    setLives: scene.setLives,
    dynamicDifficultyEnabled: ui.dynamicDifficultyEnabled,
    grid,
    dynamicDifficultyMultiplierRef: scene.dynamicDifficultyMultiplierRef,
    getToleranceMultiplier: setup.getToleranceMultiplier,
    isHost,
    sessionIdFromUrl,
    session,
    sessionLoading,
    isCoarsePointer: scene.isCoarsePointer,
    setShowStreakToast: scene.setShowStreakToast,
    setShareToast: scene.setShareToast,
    isPaused: ui.isPaused,
    audioManager,
    manager,
    recordSnapshotRef: scene.recordSnapshotRef,
    replay,
    initialSnapshotRecordedRef: scene.initialSnapshotRecordedRef,
    setState,
    replayStateRef: scene.replayStateRef,
    elapsedSeconds,
    stateRef: scene.stateRef,
    canvasRef,
    setReplayBarOpen: scene.setReplayBarOpen,
    completionImageUrl: scene.completionImageUrl,
  });

  const { highlightedPieceIds, onPreviewTap, clearHighlight } = useReferenceTapHighlight(
    state ?? null,
    scene.lastInteractionRef,
  );

  const onboarding = useOnboarding(state?.placedCount ?? 0, state?.totalCount ?? 0);
  useEffect(() => {
    if (onboarding.needsZoomTip && scene.viewport.viewport.scale !== 1)
      onboarding.dismissZoomTip();
  }, [scene.viewport.viewport.scale, onboarding.needsZoomTip, onboarding.dismissZoomTip]);

  scene.elapsedSecondsRef.current = elapsedSeconds;
  const borderFrameBonusEarnedRef = React.useRef(false);
  const milestoneMessage = usePlayScreenMilestones(
    state,
    puzzleKey,
    scene.isCoarsePointer,
    timeMode,
  );
  const borderFrameMessage = useBorderFrameMilestone(
    state,
    puzzleKey,
    scene.isCoarsePointer,
    timeMode,
    borderFrameBonusEarnedRef,
  );

  const [selectionExtendTrigger, setSelectionExtendTrigger] = React.useState(0);
  useAutoClearSelection({
    selectedPieceId: ui.selectedPieceId,
    selectionExtendTrigger,
    setSelectedPieceId: ui.setSelectedPieceId,
    selectedIdRef: ui.selectedIdRef,
    bump: ui.bump,
  });

  const [showTutorial, dismissTutorial] = useShouldShowTutorial();
  useEffect(() => {
    scene.viewport.reset();
  }, [puzzleKey, scene.viewport.reset]);

  useEffect(() => {
    const isReplayOpen = scene.replayBarOpen;

    if (isReplayOpen && !wasReplayOpenRef.current) {
      replayViewportBeforeOpenRef.current = { ...scene.viewport.viewport };
      scene.viewport.reset();
    } else if (!isReplayOpen && wasReplayOpenRef.current) {
      const previousViewport = replayViewportBeforeOpenRef.current;
      if (previousViewport) {
        scene.viewport.setViewport(previousViewport);
        replayViewportBeforeOpenRef.current = null;
      }
    }

    wasReplayOpenRef.current = isReplayOpen;
  }, [
    scene.replayBarOpen,
    scene.viewport.viewport,
    scene.viewport.reset,
    scene.viewport.setViewport,
  ]);

  const getSelectable = useCallback(
    () =>
      manager
        ? manager.getState().pieces.filter((p: Piece) => !p.inTray && !p.isPlaced)
        : [],
    [manager],
  );
  const selectCycle = useCallback(
    (dir: 1 | -1) => {
      if (!manager) return;
      const pieces = getSelectable().sort((a: Piece, b: Piece) => b.z - a.z);
      if (!pieces.length) {
        ui.selectedIdRef.current = null;
        ui.bump();
        return;
      }
      const idx = ui.selectedIdRef.current
        ? pieces.findIndex((p: Piece) => p.id === ui.selectedIdRef.current)
        : -1;
      const next = pieces[(idx + dir + pieces.length) % pieces.length];
      ui.selectedIdRef.current = next.id;
      ui.bump();
    },
    [manager, getSelectable, ui],
  );

  usePlayScreenShortcutsFromSetup(setup, {
    showTutorial,
    selectCycle,
    onExtendSelection: () => setSelectionExtendTrigger((t) => t + 1),
    onSnapBackAnimate: (fromPositions) => {
      scene.undoSnapBackRef.current = { fromPositions, startMs: performance.now() };
    },
    onRotate: () => {
      scene.rotationCountRef.current += 1;
    },
  });

  usePlayScreenTimer({
    state,
    isPaused: ui.isPaused,
    setIsPaused: ui.setIsPaused,
    timeMode,
    elapsedSeconds,
    setElapsedSeconds,
    lastInteractionRef: scene.lastInteractionRef,
  });
  useEffect(() => {
    audioManager.setPaused(ui.isPaused);
  }, [ui.isPaused]);
  useEffect(() => {
    audioManager.tryStartAmbientIfEnabled();
    return () => audioManager.leavePlayScreen();
  }, []);

  usePlayScreenPersistence({
    state,
    elapsedSeconds,
    sessionId,
    pushState,
    remoteState,
    manager,
    setState,
    setElapsedSeconds,
    clearRemoteState,
    stateRef: scene.stateRef,
    elapsedSecondsRef: scene.elapsedSecondsRef,
    undoCountRef: scene.undoCountRef,
    abandonCapturedRef: scene.abandonCapturedRef,
  });
  usePlayDocumentTitle(state, Boolean(isDailySession));
  useFirstPieceCelebration(state?.placedCount ?? 0, puzzleKey);

  const firstSnapCapturedRef = useRef(false);
  useEffect(() => {
    if (!state || firstSnapCapturedRef.current) return;
    if ((state.placedCount ?? 0) < 1) return;
    firstSnapCapturedRef.current = true;
    posthog.capture("first_piece_placed", {
      time_to_first_snap_seconds: elapsedSeconds,
      grid_size: state.grid ? `${state.grid.rows}x${state.grid.cols}` : "unknown",
      device_type: scene.isCoarsePointer ? "mobile" : "desktop",
      time_mode: timeMode,
    });
  }, [state?.placedCount, state?.grid, elapsedSeconds, scene.isCoarsePointer, timeMode]);

  usePlayScreenSecondaryEffects({
    state,
    puzzleKey: puzzleKey != null ? String(puzzleKey) : null,
    elapsedSeconds,
    sessionId,
    isCoarsePointer: scene.isCoarsePointer,
    timeMode,
    showStreakToast: scene.showStreakToast,
    setShowStreakToast: scene.setShowStreakToast,
    shareToast: scene.shareToast,
    setShareToast: scene.setShareToast,
    driftModeEnabled: ui.driftModeEnabled,
    manager,
    setState,
    isPaused: ui.isPaused,
    completionCapturedRef,
    onFireCapturedRef,
    firstSnapCapturedRef,
    zoomOnCompleteRunRef,
    stateRef: scene.stateRef,
  });

  useEffect(() => {
    return () => {
      if (scene.stateRef.current && !scene.stateRef.current.isComplete) {
        posthog.capture("exit_before_completion");
      }
    };
  }, [scene.stateRef]);
  return {
    manager,
    state,
    puzzleKey,
    setState,
    elapsedSeconds,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    snapCombo,
    announcerLine,
    imgRef,
    popMapRef,
    lockMapRef,
    snapParticlesRef,
    replay,
    highlightedPieceIds,
    onPreviewTap,
    clearHighlight,
    onboarding,
    milestoneMessage,
    borderFrameMessage,
    borderFrameBonusEarnedRef,
    showTutorial,
    dismissTutorial,
    setSelectionExtendTrigger,
    selectCycle,
  };
}
