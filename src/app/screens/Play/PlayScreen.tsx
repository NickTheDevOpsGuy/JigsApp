import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PieceTray } from "@/components/PieceTray/PieceTray";
import { ConfirmModal } from "@/components/Modal/Modal";
import { TutorialOverlay, useShouldShowTutorial } from "@/components/HowToPlay";
import { savePuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";

import { STORAGE_KEY, GRID_KEY, SHOW_DEBUG, parseGrid } from "./playScreenUtils";
import { getBestTime } from "./timeMode";
import { usePlayScreenManager } from "./hooks/usePlayScreenManager";
import { usePlayScreenTimer } from "./hooks/usePlayScreenTimer";
import { usePlayScreenShortcuts } from "./hooks/usePlayScreenShortcuts";
import { usePlayScreenUI } from "./hooks/usePlayScreenUI";
import { usePlayScreenAnimation } from "./hooks/usePlayScreenAnimation";
import { useShareResults } from "./hooks/useShareResults";
import { useDownloadImage } from "./hooks/useDownloadImage";
import { usePointerHandlers } from "./hooks/usePointerHandlers";
import { useHaptics } from "./hooks/useHaptics";
import { useCoarsePointer } from "./hooks/useCoarsePointer";
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
    timeMode,
    setTimeMode,
    countdownMinutes,
    setCountdownMinutes,
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

  const lastInteractionRef = React.useRef<number>(0);
  const onPieceInteraction = React.useCallback(() => {
    lastInteractionRef.current = performance.now();
  }, []);

  const managerResult = usePlayScreenManager(
    grid,
    pieceLockingEnabled,
    onPieceInteraction,
    timeMode,
    countdownMinutes,
  );
  const {
    manager,
    state,
    setState,
    elapsedSeconds,
    setElapsedSeconds,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    imgRef,
    popMapRef,
  } = managerResult;

  usePlayScreenTimer({
    state,
    isPaused,
    setIsPaused,
    timeMode,
    elapsedSeconds,
    setElapsedSeconds,
    lastInteractionRef,
  });

  const isCoarsePointer = useCoarsePointer();
  const [showTutorial, dismissTutorial] = useShouldShowTutorial();

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

  const haptics = useHaptics();
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
    onPieceInteraction,
  });

  usePlayScreenAnimation({
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    selectedIdRef,
    dragPreviewPieceIdRef,
    debug,
    showGhostHint,
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
            onUndo={() => {
              if (manager?.canUndo()) {
                manager.undo();
                setState(manager.getState());
              }
            }}
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
            onToggleDebug={toggleDebug}
          />
          <div className={styles.title}>Phuzzle</div>
        </div>
        <div className={styles.topBarCenter}>
          <PlayHUD
            elapsedSeconds={elapsedSeconds}
            piecesLeft={left}
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
          <canvas
            className={styles.canvas}
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handleLostPointerCapture}
            onContextMenu={handleContextMenu}
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
    </div>
  );
}

export default PlayScreen;
