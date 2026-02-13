import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import styles from "./PlayScreen.module.css";

import { PieceTray } from "@/components/PieceTray/PieceTray";
import { ConfirmModal } from "@/components/Modal/Modal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { TutorialOverlay, useShouldShowTutorial } from "@/components/HowToPlay";
import { savePuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";

import { STORAGE_KEY, GRID_KEY, SHOW_DEBUG, parseGrid } from "./playScreenUtils";
import { createUndoRedoHandler } from "./playUtils";
import { getBestTime } from "./timeMode";
import { isDailyPuzzleSession } from "@/daily/dailyPuzzle";
import { usePlayScreenManager, type ResumeChoice } from "./hooks/usePlayScreenManager";
import { usePlayScreenShortcuts } from "./hooks/usePlayScreenShortcuts";
import { usePlayScreenUI } from "./hooks/usePlayScreenUI";
import { usePlayScreenAnimation } from "./hooks/usePlayScreenAnimation";
import { usePlayScreenTimer } from "./hooks/usePlayScreenTimer";
import { useTimeModeConfig } from "./hooks/useTimeModeConfig";
import { useShareResults } from "./hooks/useShareResults";
import { useDownloadImage } from "./hooks/useDownloadImage";
import { usePointerHandlers } from "./hooks/usePointerHandlers";
import { useViewport } from "./hooks/useViewport";
import { useHaptics } from "./hooks/useHaptics";
import { useCoarsePointer } from "./hooks/useCoarsePointer";
import { useTheme } from "@/hooks/useTheme";
import {
  DragPreview,
  PlayHUD,
  CompletionOverlay,
  PauseOverlay,
  TopBarButtons,
  HeaderMenu,
} from "./components";

export function PlayScreen() {
  const navigate = useNavigate();
  const grid = useMemo(() => parseGrid(localStorage.getItem(GRID_KEY)), []);

  const ui = usePlayScreenUI();
  const {
    pieceLockingEnabled,
    setPieceLockingEnabled,
    showGhostHint,
    setShowGhostHint,
    debug,
    showPreview,
    setShowPreview,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    isPaused,
    setIsPaused,
    showShortcuts,
    setShowShortcuts,
    showHowToPlay,
    setShowHowToPlay,
    showHelpChoice,
    setShowHelpChoice,
    showNewGameModal,
    setShowNewGameModal,
    selectedPieceId,
    setSelectedPieceId,
    pageRef,
    selectedIdRef,
    bump,
    toggleFullscreen,
    toggleSound,
    toggleHaptics,
    toggleDebug,
  } = ui;

  const { timeMode, setTimeMode, countdownMinutes, setCountdownMinutes } =
    useTimeModeConfig();
  const lastInteractionRef = React.useRef(performance.now());
  const [resumeChoice, setResumeChoice] = React.useState<ResumeChoice>(null);
  const { theme } = useTheme();
  const themeRef = React.useRef(theme);
  themeRef.current = theme;
  const haptics = useHaptics();
  const [showStreakToast, setShowStreakToast] = React.useState(false);
  const [milestoneMessage, setMilestoneMessage] = React.useState<string | null>(null);
  const lastMilestoneRef = React.useRef<number>(0);

  const managerResult = usePlayScreenManager(
    grid,
    pieceLockingEnabled,
    timeMode,
    countdownMinutes,
    lastInteractionRef,
    resumeChoice,
    {
      haptic: hapticsEnabled ? haptics.vibrate : undefined,
      themeRef,
      onPlacementStreak: () => setShowStreakToast(true),
    },
  );
  const {
    manager,
    state,
    puzzleKey,
    setState,
    elapsedSeconds,
    setElapsedSeconds,
    awaitingResumeChoice,
    isLoading,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    imgRef,
    popMapRef,
    lockMapRef,
    snapParticlesRef,
  } = managerResult;

  // Milestone callouts at 25%, 50%, 75%
  useEffect(() => {
    if (!state || state.isComplete) return;
    const placed = state.placedCount ?? 0;
    const total = state.totalCount ?? 0;
    if (total === 0) return;
    const pct = placed / total;
    const milestones: { threshold: number; message: string }[] = [
      { threshold: 0.25, message: "🥉 25% — Early win." },
      { threshold: 0.5, message: "🥈 50% — Big motivation spike." },
      { threshold: 0.75, message: "🥇 75% — Momentum moment." },
      { threshold: 1, message: "🏁 100%" },
    ];
    const hit = milestones.find(
      (m) => pct >= m.threshold && lastMilestoneRef.current < m.threshold,
    );
    if (hit) {
      lastMilestoneRef.current = hit.threshold;
      setMilestoneMessage(hit.message);
    }
  }, [state?.placedCount, state?.totalCount, state?.isComplete]);

  useEffect(() => {
    if (!milestoneMessage) return;
    const t = setTimeout(() => setMilestoneMessage(null), 2000);
    return () => clearTimeout(t);
  }, [milestoneMessage]);

  useEffect(() => {
    if (!state) return;
    if (state.placedCount === 0) lastMilestoneRef.current = 0;
  }, [state?.placedCount, puzzleKey]);

  useEffect(() => {
    if (!showStreakToast) return;
    const t = setTimeout(() => setShowStreakToast(false), 2000);
    return () => clearTimeout(t);
  }, [showStreakToast]);

  // Auto-clear piece selection after 1s so the blue border doesn’t stay until another click
  useEffect(() => {
    if (selectedPieceId == null) return;
    const t = setTimeout(() => {
      setSelectedPieceId(null);
      selectedIdRef.current = null;
      bump();
    }, 1000);
    return () => clearTimeout(t);
  }, [selectedPieceId, setSelectedPieceId, selectedIdRef, bump]);

  const isCoarsePointer = useCoarsePointer();
  const [showTutorial, dismissTutorial] = useShouldShowTutorial();
  const viewport = useViewport();

  useEffect(() => {
    viewport.reset();
  }, [puzzleKey, viewport.reset]);

  const getSelectable = useCallback(() => {
    if (!manager) return [];
    return manager.getState().pieces.filter((p) => !p.inTray && !p.isPlaced);
  }, [manager]);

  const selectCycle = useCallback(
    (dir: 1 | -1) => {
      if (!manager) return;
      const pieces = getSelectable().sort((a, b) => b.z - a.z);
      if (!pieces.length) {
        selectedIdRef.current = null;
        bump();
        return;
      }
      const idx = selectedIdRef.current
        ? pieces.findIndex((p) => p.id === selectedIdRef.current)
        : -1;
      const next = pieces[(idx + dir + pieces.length) % pieces.length];
      selectedIdRef.current = next.id;
      bump();
    },
    [manager, getSelectable, selectedIdRef, bump],
  );

  usePlayScreenShortcuts({
    manager,
    state,
    setState,
    isPaused,
    showShortcuts,
    showNewGameModal,
    showTutorial,
    selectedPieceId,
    setSelectedPieceId,
    setShowShortcuts,
    setShowNewGameModal,
    setShowPreview,
    setShowGhostHint,
    setIsPaused,
    setSoundEnabled,
    setHapticsEnabled,
    toggleFullscreen,
    selectCycle,
    selectedIdRef,
  });

  usePlayScreenTimer({
    state,
    isPaused,
    setIsPaused,
    timeMode,
    elapsedSeconds,
    setElapsedSeconds,
    lastInteractionRef,
  });

  useEffect(() => {
    if (!state || state.isComplete) return;
    const url = localStorage.getItem(STORAGE_KEY) || "";
    if (!url) return;
    const id = setTimeout(
      () => savePuzzleState(url, state.grid, state.pieces, elapsedSeconds),
      500,
    );
    return () => clearTimeout(id);
  }, [state, elapsedSeconds]);

  // Analytics: time to first snap (first piece placed)
  const firstSnapCapturedRef = useRef(false);
  useEffect(() => {
    if (!state || firstSnapCapturedRef.current) return;
    const placed = state.placedCount ?? 0;
    if (placed >= 1) {
      firstSnapCapturedRef.current = true;
      posthog.capture("time_to_first_snap", {
        time_to_first_snap_seconds: elapsedSeconds,
      });
    }
  }, [state?.placedCount, elapsedSeconds]);

  // Analytics: exit before completion (on unmount)
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    return () => {
      if (stateRef.current && !stateRef.current.isComplete) {
        posthog.capture("exit_before_completion");
      }
    };
  }, []);

  const didDragRef = React.useRef(false);
  const [dragPreview, setDragPreview] = React.useState<{
    clientX: number;
    clientY: number;
    pieceId: string;
  } | null>(null);
  const dragPreviewPieceIdRef = React.useRef<string | null>(null);
  dragPreviewPieceIdRef.current = dragPreview?.pieceId ?? null;

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  } = usePointerHandlers({
    manager,
    canvasRef,
    boardRef,
    trayRef,
    setState,
    selectCycle,
    setSelectedPieceId,
    selectedIdRef,
    bump,
    didDragRef,
    haptic: haptics.vibrate,
    onDragPreview: setDragPreview,
    onPieceInteraction: () => {
      lastInteractionRef.current = performance.now();
    },
    screenToBoard: viewport.screenToBoard,
    viewport,
  });

  usePlayScreenAnimation({
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    lockMapRef,
    selectedIdRef,
    dragPreviewPieceIdRef,
    snapParticlesRef,
    debug,
    showGhostHint,
    viewport: viewport.viewport,
  });

  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      lastInteractionRef.current = performance.now();
      manager.movePieceFromTray(pieceId);
      setState(manager.getState());
      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
    },
    [manager, setState, selectedIdRef, setSelectedPieceId, bump],
  );

  const handleNewGame = useCallback(() => {
    clearPuzzleState();
    navigate("/new");
  }, [navigate]);

  const share = useShareResults({ elapsedSeconds, state });
  const handleDownloadImage = useDownloadImage({
    canvasRef,
    imgRef,
    state,
    elapsedSeconds,
  });

  const trayPieces = useMemo(
    () => (state ? state.pieces.filter((p) => p.inTray) : []),
    [state],
  );
  const dragPreviewPiece =
    dragPreview && state ? state.pieces.find((p) => p.id === dragPreview.pieceId) : null;
  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;
  const bestTimeSeconds =
    timeMode === "best" && state?.grid
      ? getBestTime(state.grid.rows, state.grid.cols)
      : null;

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <HeaderMenu
            title="Phuzzle"
            canUndo={!!(manager?.canUndo() && !isPaused && !state?.isComplete)}
            onUndo={createUndoRedoHandler(
              manager ?? null,
              "undo",
              setState,
              () => Boolean(manager?.canUndo()),
              soundManager.play.bind(soundManager),
            )}
            canRedo={!!(manager?.canRedo() && !isPaused && !state?.isComplete)}
            onRedo={createUndoRedoHandler(
              manager ?? null,
              "redo",
              setState,
              () => Boolean(manager?.canRedo()),
              soundManager.play.bind(soundManager),
            )}
            timeMode={timeMode}
            setTimeMode={setTimeMode}
            countdownMinutes={countdownMinutes}
            setCountdownMinutes={setCountdownMinutes}
            showPreview={showPreview}
            soundEnabled={soundEnabled}
            hapticsEnabled={hapticsEnabled}
            pieceLockingEnabled={pieceLockingEnabled}
            showGhostHint={showGhostHint}
            isFullscreen={ui.isFullscreen}
            canShowHaptics={isCoarsePointer && typeof navigator?.vibrate === "function"}
            canShowFullscreen={!!document.fullscreenEnabled}
            canShowShortcuts={!isCoarsePointer}
            canShowDebug={SHOW_DEBUG}
            debug={debug}
            onNewPuzzle={() => setShowNewGameModal(true)}
            onTogglePreview={() => setShowPreview((p) => !p)}
            onToggleSound={toggleSound}
            onToggleHaptics={toggleHaptics}
            onTogglePieceLocking={() => setPieceLockingEnabled((p) => !p)}
            onToggleGhostHint={() => setShowGhostHint((g) => !g)}
            onToggleFullscreen={toggleFullscreen}
            onShowShortcuts={() => setShowShortcuts(true)}
            onShowHowToPlay={() => setShowHowToPlay(true)}
            onShowHelpChoice={() => setShowHelpChoice(true)}
            onToggleDebug={toggleDebug}
          />
          <div className={styles.title}>Phuzzle</div>
        </div>
        <div className={styles.topBarCenter}>
          <PlayHUD
            elapsedSeconds={elapsedSeconds}
            piecesLeft={left}
            totalPieces={total}
            isPaused={isPaused}
            isComplete={isComplete}
            timeMode={timeMode}
            countdownMinutes={countdownMinutes}
            bestTimeSeconds={bestTimeSeconds}
            onTogglePause={() => setIsPaused((p) => !p)}
          />
        </div>
        <TopBarButtons
          showPreview={showPreview}
          soundEnabled={soundEnabled}
          isFullscreen={ui.isFullscreen}
          showDebug={SHOW_DEBUG}
          isCoarsePointer={isCoarsePointer}
          onTogglePreview={() => setShowPreview((p) => !p)}
          onToggleSound={toggleSound}
          onToggleFullscreen={toggleFullscreen}
          onShowShortcuts={() => setShowShortcuts(true)}
          onToggleDebug={toggleDebug}
          onNewPuzzle={() => setShowNewGameModal(true)}
        />
      </div>

      <ConfirmModal
        isOpen={awaitingResumeChoice && resumeChoice === null}
        onClose={() => setResumeChoice("fresh")}
        onConfirm={() => setResumeChoice("resume")}
        title="Resume Your Puzzle?"
        message="You have a puzzle in progress. Would you like to continue where you left off?"
        confirmText="Resume"
        cancelText="Start Fresh"
        variant="default"
        primaryOnlyConfirm
      />

      <HelpChoiceModal
        isOpen={showHelpChoice}
        onClose={() => setShowHelpChoice(false)}
        onHowToPlay={() => setShowHowToPlay(true)}
        onKeyboardShortcuts={() => setShowShortcuts(true)}
      />

      <ConfirmModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onConfirm={handleNewGame}
        title="Start New Puzzle?"
        message="Your current progress will be lost. Are you sure you want to start a new puzzle?"
        confirmText="New Puzzle"
        cancelText="Keep Playing"
        variant="danger"
      />

      <div className={styles.main} ref={mainRef}>
        <div className={styles.board} ref={boardRef}>
          {isLoading && (
            <div className={styles.loadingOverlay} aria-label="Loading puzzle">
              <div className={styles.spinner} />
              <span>Loading puzzle…</span>
            </div>
          )}
          <canvas
            key={puzzleKey}
            className={styles.canvas}
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handleLostPointerCapture}
            onContextMenu={handleContextMenu}
            onWheel={(e) => viewport.handleWheel(e, boardRef.current)}
          />
          {showPreview && imgRef.current && (
            <div className={styles.previewOverlay}>
              <img
                src={imgRef.current.src}
                alt="Puzzle preview"
                className={styles.previewImage}
              />
            </div>
          )}
          {isPaused && (
            <PauseOverlay
              onResume={() => setIsPaused(false)}
              isCountdownExpired={
                timeMode === "countdown" && elapsedSeconds <= 0 && !isComplete && isPaused
              }
              onNewPuzzle={
                timeMode === "countdown" && elapsedSeconds <= 0 && !isComplete && isPaused
                  ? handleNewGame
                  : undefined
              }
            />
          )}
          {isComplete && (
            <CompletionOverlay
              elapsedSeconds={elapsedSeconds}
              grid={state?.grid}
              isNewBest={
                timeMode === "best" &&
                state?.grid != null &&
                (bestTimeSeconds == null || elapsedSeconds < bestTimeSeconds)
              }
              isDaily={isDailyPuzzleSession()}
              shareUrls={share.shareUrls}
              copied={share.copied}
              canNativeShare={share.canNativeShare}
              onOpenShareWindow={share.openShareWindow}
              onCopyResults={share.handleCopyResults}
              onNativeShare={share.handleNativeShare}
              onDownloadImage={handleDownloadImage}
              onNewPuzzle={handleNewGame}
              onMenu={() => navigate("/")}
            />
          )}
        </div>
      </div>

      <PieceTray
        ref={trayRef}
        pieces={trayPieces}
        image={imgRef.current}
        grid={state?.grid ?? grid}
        onPieceClick={handleTrayPieceClick}
        isCoarsePointer={isCoarsePointer}
      />

      <TutorialOverlay
        isOpen={showTutorial || showHowToPlay}
        onComplete={() => {
          if (showTutorial) dismissTutorial();
          setShowHowToPlay(false);
        }}
        showSkipLink={showTutorial}
      />

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {dragPreviewPiece && dragPreview && imgRef.current && (
        <DragPreview
          clientX={dragPreview.clientX}
          clientY={dragPreview.clientY}
          piece={dragPreviewPiece}
          image={imgRef.current}
          grid={state!.grid}
        />
      )}

      {showStreakToast && (
        <div className={styles.engagementToast} role="status">
          🔥 On fire!
        </div>
      )}
      {milestoneMessage && (
        <div className={styles.engagementToast} role="status">
          {milestoneMessage}
        </div>
      )}
    </div>
  );
}

export default PlayScreen;
