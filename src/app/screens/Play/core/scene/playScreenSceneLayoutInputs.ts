/**
 * Build layout inputs (completion, replay, visuals) for play screen. Split out to keep playScreenSceneLayout under 300 lines.
 */
import { isDailyPuzzleSession } from "@/daily/dailyPuzzleCore";
import { SHOW_DEBUG } from "@/screens/Play/core/utils/playScreenUtils";
import {
  buildCompletionProps,
  buildPlayScreenPageVisuals,
  buildReplayPortalProps,
  getCompletionImageFallback,
} from "@/screens/Play/core/scene/playScreenSceneOverlays";
import { usePlayScreenTopBarPropsFromCtx } from "./playScreenSceneLayoutTopBar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ctx shape is large and shared
export function usePlayScreenLayoutInputs(ctx: any) {
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
  } = behavior;
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
    handleDownloadImage,
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

  const topBarProps = usePlayScreenTopBarPropsFromCtx(ctx);

  const { pageClassName, pageStyle } = buildPlayScreenPageVisuals({
    zenModeEnabled: ui.zenModeEnabled,
    dailyVisualModifier,
    fogStrength,
  });

  const showCompletionOverlay = (isComplete && scene.showWinOverlay) || showE2ECompletion;
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
      copied: share.copied,
      canNativeShare: share.canNativeShare,
      handleCopyResults: share.handleCopyResults,
      handleNativeShare: share.handleNativeShare,
      handleCopyChallenge: share.handleCopyChallenge,
      handleNativeChallengeShare: share.handleNativeChallengeShare,
    },
    onDownloadImage: handleDownloadImage,
    onClose: () => {
      scene.setCompletionDismissed(true);
      scene.setShowWinOverlay?.(false);
      scene.setCompletionImageUrl(undefined);
      scene.viewport.reset();
    },
    usedHint: scene.usedHintRef.current,
    precisionModeEnabled: ui.precisionModeEnabled,
    precisionSnaps: scene.precisionSnapsRef.current,
    adaptivePersonalityEnabled: ui.adaptivePersonalityEnabled,
    canReplay: behavior.replay.canReplay,
    onReplayClick: () => {
      behavior.replay.startReplay();
      scene.setCompletionDismissed(true);
      scene.setShowWinOverlay?.(false);
      scene.setReplayBarOpen(true);
    },
    onNextPuzzle: handleNewGame,
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
    totalSnapshots: behavior.replay.snapshots.length,
    elapsedSeconds: behavior.replay.replayElapsedSeconds,
    totalSeconds:
      behavior.replay.snapshots.length > 0
        ? behavior.replay.snapshots[behavior.replay.snapshots.length - 1].elapsedSeconds
        : 0,
    onSeek: behavior.replay.seekToIndex,
    boardRect: scene.replayBarBoardRect ?? undefined,
    speedExplicitlyChosen: behavior.replay.speedExplicitlyChosen,
    onClose: () => {
      behavior.replay.stopReplay();
      scene.setReplayBarOpen(false);
      scene.setCompletionDismissed(false);
    },
  });

  const replayPortalProps =
    baseReplayProps != null
      ? {
          ...baseReplayProps,
          completionImageUrl: scene.completionImageUrl ?? undefined,
          moveCount: scene.moveCountRef.current,
          onBackToResults: () => {
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
            label: isDailyPuzzleSession()
              ? "Play today's puzzle"
              : "One more from this pack",
            onNext: handleNewGame,
          }
        : null,
    replayPortalProps,
    mainRef,
    boardRef,
    canvasRef,
    puzzleKey,
    isComplete,
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
    isPaused: ui.isPaused,
    setIsPaused: (next: boolean) => ui.setIsPaused(next),
    scheduleImmersiveHide: immersive.scheduleImmersiveHide,
    manager,
    trayRef,
    trayPieces,
    grid,
    handleTrayPieceClick,
    highlightedPieceIds: behavior.highlightedPieceIds,
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
