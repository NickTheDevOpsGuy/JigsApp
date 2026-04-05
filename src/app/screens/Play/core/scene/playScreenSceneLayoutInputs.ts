/**
 * Build layout inputs (completion, replay, visuals) for play screen. Split out to keep playScreenSceneLayout under 300 lines.
 */
import React from "react";
import { SHOW_DEBUG } from "@/screens/Play/core/utils/playScreenUtils";
import {
  buildCompletionProps,
  buildPlayScreenPageVisuals,
  buildReplayPortalProps,
  getCompletionImageFallback,
} from "@/screens/Play/core/scene/playScreenSceneOverlays";
import { usePlayScreenTopBarPropsFromCtx } from "./playScreenSceneLayoutTopBar";
import type { PlayScreenSceneLayoutContext } from "./playScreenSceneLayoutContext.types";

export function usePlayScreenLayoutInputs(ctx: PlayScreenSceneLayoutContext) {
  const { setup, behavior, interactions } = ctx;
  const {
    ui,
    scene,
    timeMode,
    grid,
    isHost,
    sessionIdFromUrl,
    sessionLoading,
    session,
    joinError,
    retryJoin,
    navigate,
    sessionId,
    searchParams,
    showE2ECompletion,
    sessionResult,
    lastEventTimestamp,
    lastDbWriteMs,
    channelName,
    isDailySession,
  } = setup;
  const {
    manager,
    state,
    setState: _setState,
    puzzleKey,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    elapsedSeconds,
    snapCombo,
    announcerLine,
    imgRef,
    borderFrameBonusEarnedRef,
  } = behavior;
  const onChoosePuzzleDismissWithoutStart = React.useCallback(() => {
    if (state?.isComplete && scene.completionDismissed) {
      navigate("/", { replace: true });
    }
  }, [state?.isComplete, scene.completionDismissed, navigate]);

  const {
    displayElapsedSeconds,
    left: _left,
    total: _total,
    isComplete,
    dailyVisualModifier,
    fogStrength,
    immersive,
    bestTimeSeconds,
    trayPieces,
    dragPreview,
    dragPreviewPiece,
    handleUndo,
    handleRedo,
    handleSharePuzzle: _handleSharePuzzle,
    handleNewGame,
    puzzleShareUrl,
    puzzleName,
    share,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
    isDraggingBoard,
    handleTrayPieceClick,
  } = interactions;

  const hoverPreviewPieceIdRef = ui.hoverPreviewPieceIdRef;
  const handleCanvasPointerLeave = React.useCallback(() => {
    hoverPreviewPieceIdRef.current = null;
  }, [hoverPreviewPieceIdRef]);
  const onTrayPieceHover = React.useCallback(
    (pieceId: string | null) => {
      hoverPreviewPieceIdRef.current = pieceId;
    },
    [hoverPreviewPieceIdRef],
  );

  /** Win modal + share popups are open; until then keep playing chrome so the board frame / tray do not jump on the last snap. */
  const winCelebrationModalVisible =
    (isComplete && scene.showWinOverlay && !scene.completionDismissed) ||
    showE2ECompletion;

  const topBarProps = usePlayScreenTopBarPropsFromCtx(ctx, winCelebrationModalVisible);

  const { pageClassName, pageStyle } = buildPlayScreenPageVisuals({
    zenModeEnabled: ui.zenModeEnabled,
    dailyVisualModifier,
    fogStrength,
  });

  const completionDailyRef = React.useRef(false);
  if (isDailySession) {
    completionDailyRef.current = true;
  } else if (!state?.isComplete) {
    completionDailyRef.current = false;
  }
  const completionIsDaily = isDailySession || completionDailyRef.current;

  const showCompletionOverlay = (isComplete && scene.showWinOverlay) || showE2ECompletion;
  const nextPuzzleLabel = completionIsDaily
    ? "Play today's puzzle"
    : searchParams?.get("pack")
      ? "One more from this pack"
      : "New puzzle";
  const completionProps = buildCompletionProps({
    focusReturnRef: scene.completionFocusRef,
    showCompletionOverlay,
    completionDismissed: scene.completionDismissed,
    state,
    displayElapsedSeconds,
    completionImageUrl: scene.completionImageUrl,
    fallbackImageUrl: getCompletionImageFallback(),
    imageRefUrl: imgRef.current?.src,
    undoCount: scene.undoCountRef.current,
    moveCount: scene.moveCountRef.current,
    rotationCount: scene.rotationCountRef.current,
    maxGroupSize: scene.maxGroupSizeRef.current,
    dailyVisualModifier,
    pieceCutType: ui.pieceCutType,
    isNewBest:
      timeMode === "best" &&
      state?.grid != null &&
      (bestTimeSeconds == null || elapsedSeconds < bestTimeSeconds),
    puzzleShareUrl,
    puzzleName,
    share: {
      handleCopyResults: share.handleCopyResults,
      handleNativeShare: share.handleNativeShare,
      handleCopyChallenge: share.handleCopyChallenge,
      handleNativeChallengeShare: share.handleNativeChallengeShare,
      setShareToast: scene.setShareToast,
    },
    onClose: () => {
      scene.setCompletionDismissed(true);
      scene.setShowWinOverlay?.(false);
      scene.setCompletionImageUrl(undefined);
      scene.viewport.reset();
    },
    usedHint: scene.usedHintRef.current,
    isDaily: completionIsDaily,
    // E2E completion mode does not play through a full solve, so it only has the
    // seeded initial snapshot. Still expose the replay shell there so browser tests
    // can verify the mobile replay overlay/cutout path without solving a puzzle first.
    canReplay: behavior.replay.canReplay || showE2ECompletion,
    onReplayClick: () => {
      behavior.replay.startReplay();
      scene.setCompletionDismissed(true);
      scene.setShowWinOverlay?.(false);
      scene.setReplayBarOpen(true);
      scene.setShowStreakToast(false);
      scene.setShareToast(null);
    },
    onNextPuzzle: handleNewGame,
    nextPuzzleLabel,
    onCompletionRecorded: (stats) => {
      if (stats.dailyStreak === 7) {
        scene.setShareToast("7-day streak! 🔥");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([30, 50, 30, 50, 80]);
        }
      }
    },
    onNewBest: () => {
      if (ui.hapticsEnabled && typeof navigator?.vibrate === "function") {
        navigator.vibrate([20, 30, 20]);
      }
    },
    boardAnchorRef: boardRef,
    borderFrameBonus: borderFrameBonusEarnedRef.current,
    quadrantTimes: scene.quadrantTimes,
  });

  const baseReplayProps = buildReplayPortalProps({
    replayBarOpen: scene.replayBarOpen,
    isReplayPaused: behavior.replay.isReplayPaused,
    onPlay: behavior.replay.resumeReplay,
    onPause: behavior.replay.pauseReplay,
    onRewind: behavior.replay.goToStart,
    onFastForward: behavior.replay.goToEnd,
    onSkipBack15: () => behavior.replay.seekBySeconds(-5),
    onSkipForward15: () => behavior.replay.seekBySeconds(5),
    speed: behavior.replay.replaySpeed,
    onSpeedChange: behavior.replay.setReplaySpeed,
    currentIndex: behavior.replay.replayIndex,
    totalSnapshots: behavior.replay.replaySnapshots.length,
    elapsedSeconds: behavior.replay.replayElapsedSeconds,
    totalSeconds:
      behavior.replay.snapshots.length > 0
        ? behavior.replay.snapshots[behavior.replay.snapshots.length - 1].elapsedSeconds
        : 0,
    onSeek: behavior.replay.seekToIndex,
    boardRect: scene.replayBarBoardRect ?? undefined,
    speedExplicitlyChosen: behavior.replay.speedExplicitlyChosen,
    onClose: () => {
      // Plain dismiss (X button): the user already closed the win screen to start
      // replay, so keep completionDismissed=true — do NOT reset it or the win
      // overlay will flash back on screen.
      behavior.replay.stopReplay();
      scene.setReplayBarOpen(false);
    },
    onPrepareClose: () => {
      behavior.replay.goToEnd();
    },
  });

  const replayPortalProps =
    baseReplayProps != null
      ? {
          ...baseReplayProps,
          completionImageUrl:
            scene.completionImageUrl ??
            behavior.imgRef.current?.src ??
            getCompletionImageFallback() ??
            undefined,
          moveCount: scene.moveCountRef.current,
          onBackToResults: () => {
            // "Back to results" explicitly navigates back to the win screen — reset
            // dismissal so the overlay becomes visible again.
            behavior.replay.stopReplay();
            scene.setReplayBarOpen(false);
            scene.setCompletionDismissed(false);
            requestAnimationFrame(() => {
              scene.completionFocusRef.current?.focus();
            });
          },
          onNextPuzzle: handleNewGame,
          packRemainingLabel: searchParams?.get("pack")
            ? "One more from this pack"
            : undefined,
        }
      : null;

  return {
    isHost,
    sessionIdFromUrl,
    sessionLoading,
    session,
    joinError,
    retryJoin,
    navigate,
    pageClassName,
    pageStyle,
    pageRef: ui.pageRef,
    immersiveMode: ui.immersiveMode,
    handleImmersiveReveal: immersive.handleImmersiveReveal,
    topBarProps,
    replayBarOpen: scene.replayBarOpen,
    showImmersiveUi: immersive.showImmersiveUi,
    awaitingResumeChoice: setup.managerResult.awaitingResumeChoice,
    resumeChoice: scene.resumeChoice,
    setResumeChoice: scene.setResumeChoice,
    showHelpChoice: ui.showHelpChoice,
    setShowHelpChoice: ui.setShowHelpChoice,
    setShowHowToPlay: ui.setShowHowToPlay,
    setShowShortcuts: ui.setShowShortcuts,
    showShortcuts: ui.showShortcuts,
    showThemeModal: ui.showThemeModal,
    setShowThemeModal: ui.setShowThemeModal,
    setShowFeedbackChoice: ui.setShowFeedbackChoice,
    hapticsEnabled: ui.hapticsEnabled,
    showNewGameModal: ui.showNewGameModal,
    setShowNewGameModal: ui.setShowNewGameModal,
    showChoosePuzzleModal: ui.showChoosePuzzleModal,
    setShowChoosePuzzleModal: ui.setShowChoosePuzzleModal,
    onChoosePuzzleDismissWithoutStart,
    handleNewGame,
    showResetStatsConfirm: scene.showResetStatsConfirm,
    setShowResetStatsConfirm: scene.setShowResetStatsConfirm,
    showClearCacheConfirm: scene.showClearCacheConfirm,
    setShowClearCacheConfirm: scene.setShowClearCacheConfirm,
    showFeedbackChoice: ui.showFeedbackChoice,
    state,
    completionProps,
    postCompletionCta:
      scene.completionDismissed && state?.isComplete
        ? {
            label: nextPuzzleLabel,
            onNext: handleNewGame,
          }
        : null,
    replayPortalProps,
    mainRef,
    boardRef,
    canvasRef,
    puzzleKey,
    isComplete,
    winCelebrationModalVisible,
    isLoading: setup.managerResult.isLoading,
    elapsedSeconds,
    moveCount: scene.moveCountRef.current,
    snapCombo,
    minimapVisible: ui.minimapVisible,
    minimapSuppressed: scene.isCoarsePointer && isDraggingBoard,
    minimapPosition: ui.minimapPosition,
    boardSize: scene.boardSize,
    cycleMinimapPosition: ui.cycleMinimapPosition,
    viewport: scene.viewport,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
    handleCanvasPointerLeave,
    isPaused: ui.isPaused,
    setIsPaused: (next: boolean) => ui.setIsPaused(next),
    scheduleImmersiveHide: immersive.scheduleImmersiveHide,
    manager,
    trayRef,
    trayPieces,
    grid,
    handleTrayPieceClick,
    highlightedPieceIds: behavior.highlightedPieceIds,
    onTrayPieceHover,
    handleUndo,
    handleRedo,
    showPreview: ui.showPreview,
    mysteryModeEnabled: ui.mysteryModeEnabled,
    progressiveRevealMode: ui.progressiveRevealMode,
    imgRef,
    onPreviewTap: behavior.onPreviewTap,
    showTutorial: behavior.showTutorial,
    showHowToPlay: ui.showHowToPlay,
    dismissTutorial: behavior.dismissTutorial,
    dragPreviewPiece,
    dragPreview,
    onboarding: behavior.onboarding,
    showStreakToast: scene.showStreakToast,
    milestoneMessage: behavior.milestoneMessage,
    borderFrameMessage: behavior.borderFrameMessage,
    announcerLine,
    shareToast: scene.shareToast,
    searchParams,
    SHOW_DEBUG,
    debug: ui.debug,
    sessionId,
    sessionResultConnectedCount: sessionResult.connectedCount,
    lastEventTimestamp,
    lastDbWriteMs,
    channelName,
    perfStatsRef: scene.perfStatsRef,
  };
}
