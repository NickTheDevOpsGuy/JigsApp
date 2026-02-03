import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import type { PuzzleState } from "@/puzzle/types";
import { PieceTray } from "@/components/PieceTray/PieceTray";
import { ConfirmModal } from "@/components/Modal/Modal";
import { TutorialOverlay, useShouldShowTutorial } from "@/components/HowToPlay";
import { savePuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";

import { formatTime } from "./playUtils";
import { STORAGE_KEY, GRID_KEY, SHOW_DEBUG, parseGrid } from "./playScreenUtils";
import { usePlayScreenManager } from "./hooks/usePlayScreenManager";
import { usePlayScreenShortcuts } from "./hooks/usePlayScreenShortcuts";
import { usePlayScreenUI } from "./hooks/usePlayScreenUI";
import { usePlayScreenAnimation } from "./hooks/usePlayScreenAnimation";
import { useShareResults } from "./hooks/useShareResults";
import { usePointerHandlers } from "./hooks/usePointerHandlers";
import { useHaptics } from "./hooks/useHaptics";
import { useCoarsePointer } from "./hooks/useCoarsePointer";
import {
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

  const managerResult = usePlayScreenManager(grid, pieceLockingEnabled);
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
    if (state?.isComplete || isPaused) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state?.isComplete, isPaused, setElapsedSeconds]);

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
  const { handlePointerDown, handlePointerMove, handlePointerUp, handleContextMenu } =
    usePointerHandlers({
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
    });

  usePlayScreenAnimation({
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    selectedIdRef,
    debug,
    showGhostHint,
  });

  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
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

  const handleDownloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const shareCanvas = document.createElement("canvas");
    const padding = 40;
    const textHeight = 80;
    shareCanvas.width = canvas.width + padding * 2;
    shareCanvas.height = canvas.height + padding * 2 + textHeight;
    const ctx = shareCanvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);
    ctx.drawImage(canvas, padding, padding);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `🧩 Phuzzle - ${state?.totalCount ?? 0} pieces in ${formatTime(elapsedSeconds)}`,
      shareCanvas.width / 2,
      shareCanvas.height - textHeight / 2 + 10,
    );
    const link = document.createElement("a");
    link.download = `phuzzle-${formatTime(elapsedSeconds).replace(":", "m")}s.png`;
    link.href = shareCanvas.toDataURL("image/png");
    link.click();
  }, [elapsedSeconds, state?.totalCount, canvasRef, imgRef]);

  const trayPieces = useMemo(
    () => (state ? state.pieces.filter((p) => p.inTray) : []),
    [state],
  );
  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;

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
            onPointerCancel={handlePointerUp}
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
          {isPaused && <PauseOverlay onResume={() => setIsPaused(false)} />}
          {isComplete && (
            <CompletionOverlay
              elapsedSeconds={elapsedSeconds}
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
    </div>
  );
}

export default PlayScreen;
