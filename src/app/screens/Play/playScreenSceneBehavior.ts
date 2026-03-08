import React, { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";
import type { Piece } from "@/puzzle/types";

import { useReplay } from "./hooks/useReplay";
import { usePlayScreenLifecycleEffects } from "./hooks/usePlayScreenLifecycleEffects";
import { useReferenceTapHighlight } from "./hooks/useReferenceTapHighlight";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePlayScreenMilestones } from "./hooks/usePlayScreenMilestones";
import { useAutoClearSelection } from "./hooks/useAutoClearSelection";
import { useShouldShowTutorial } from "@/components/HowToPlay";
import { usePlayScreenShortcuts } from "./hooks/usePlayScreenShortcuts";
import { usePlayScreenTimer } from "./hooks/usePlayScreenTimer";
import { audioManager } from "@/audio/audioManager";
import { usePlayScreenPersistence } from "./hooks/usePlayScreenPersistence";
import { useFirstPieceCelebration } from "./hooks/useFirstPieceCelebration";
import { usePlayScreenSecondaryEffects } from "./hooks/usePlayScreenSecondaryEffects";

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
  } = setup;

  const { manager, state, puzzleKey, setState, elapsedSeconds, setElapsedSeconds, boardRef, canvasRef, trayRef, mainRef, snapCombo, announcerLine, imgRef, popMapRef, lockMapRef, snapParticlesRef } = managerResult;

  const replay = useReplay(manager, setState, scene.replayStateRef, state?.isComplete ?? false);
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
    setCompletionDismissed: scene.setCompletionDismissed,
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

  const { highlightedPieceIds, onPreviewTap, clearHighlight } = useReferenceTapHighlight(state ?? null, scene.lastInteractionRef);

  const onboarding = useOnboarding(state?.placedCount ?? 0, state?.totalCount ?? 0);
  useEffect(() => {
    if (onboarding.needsZoomTip && scene.viewport.viewport.scale !== 1) onboarding.dismissZoomTip();
  }, [scene.viewport.viewport.scale, onboarding.needsZoomTip, onboarding.dismissZoomTip]);

  scene.elapsedSecondsRef.current = elapsedSeconds;
  const milestoneMessage = usePlayScreenMilestones(state, puzzleKey, scene.isCoarsePointer, timeMode);

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

  const getSelectable = useCallback(
    () => (manager ? manager.getState().pieces.filter((p: Piece) => !p.inTray && !p.isPlaced) : []),
    [manager],
  );
  const selectCycle = useCallback((dir: 1 | -1) => {
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
  }, [manager, getSelectable, ui]);

  usePlayScreenShortcuts({
    manager,
    state,
    setState,
    isPaused: ui.isPaused,
    showShortcuts: ui.showShortcuts,
    showHelpChoice: ui.showHelpChoice,
    showNewGameModal: ui.showNewGameModal,
    showTutorial,
    selectedPieceId: ui.selectedPieceId,
    setSelectedPieceId: ui.setSelectedPieceId,
    setShowShortcuts: ui.setShowShortcuts,
    setShowHelpChoice: ui.setShowHelpChoice,
    setShowNewGameModal: ui.setShowNewGameModal,
    setShowPreview: ui.setShowPreview,
    setShowGhostHint: ui.setShowGhostHint,
    setIsPaused: ui.setIsPaused,
    setSoundEnabled: ui.setSoundEnabled,
    setHapticsEnabled: ui.setHapticsEnabled,
    toggleFullscreen: ui.toggleFullscreen,
    selectCycle,
    selectedIdRef: ui.selectedIdRef,
    onUndoSuccess: () => { scene.undoCountRef.current += 1; },
    onExtendSelection: () => setSelectionExtendTrigger((t) => t + 1),
    onSnapBackAnimate: (fromPositions) => { scene.undoSnapBackRef.current = { fromPositions, startMs: performance.now() }; },
    onRotate: () => { scene.rotationCountRef.current += 1; },
  });

  usePlayScreenTimer({ state, isPaused: ui.isPaused, setIsPaused: ui.setIsPaused, timeMode, elapsedSeconds, setElapsedSeconds, lastInteractionRef: scene.lastInteractionRef });
  useEffect(() => { audioManager.setPaused(ui.isPaused); }, [ui.isPaused]);
  useEffect(() => { audioManager.tryStartAmbientIfEnabled(); return () => audioManager.leavePlayScreen(); }, []);

  usePlayScreenPersistence({ state, elapsedSeconds, sessionId, pushState, remoteState, manager, setState, setElapsedSeconds, clearRemoteState, stateRef: scene.stateRef, elapsedSecondsRef: scene.elapsedSecondsRef, undoCountRef: scene.undoCountRef, abandonCapturedRef: scene.abandonCapturedRef });
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
    if (!state?.isComplete || scene.completionDismissed || !state) return;
    const id = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
      try {
        scene.setCompletionImageUrl(canvas.toDataURL("image/png"));
      } catch {
        // no-op fallback
      }
    });
    return () => cancelAnimationFrame(id);
  }, [state?.isComplete, scene.completionDismissed, state, canvasRef, scene]);

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
    showTutorial,
    dismissTutorial,
    setSelectionExtendTrigger,
    selectCycle,
  };
}
