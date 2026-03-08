import React, { useCallback } from "react";

import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import { createUndoRedoHandler } from "./playUtils";
import { soundManager } from "@/audio/sounds";
import { usePlayScreenBoardInteractions } from "./hooks/usePlayScreenBoardInteractions";
import { usePlayScreenAnimation } from "./hooks/usePlayScreenAnimation";
import {
  isDailyPuzzleSession,
  getDailyVisualModifier,
  getDailyPreferredModifier,
} from "@/daily/dailyPuzzleCore";
import { usePlayScreenShareSession } from "./hooks/usePlayScreenShareSession";
import { useShareResults } from "./hooks/useShareResults";
import { usePlayScreenSharePuzzle } from "./hooks/usePlayScreenSharePuzzle";
import { useDownloadImage } from "./hooks/useDownloadImage";
import { usePlayScreenTrayPieces } from "./hooks/usePlayScreenTrayPieces";
import { usePlayScreenImmersiveControls } from "./hooks/usePlayScreenImmersiveControls";
import { getBestTime } from "./timeMode";
import { STORAGE_KEY } from "./playScreenUtils";
import { SESSION_ID_PARAM } from "./hooks/usePuzzleSession";
const DAILY_PARAM = "daily";
const GRID_PARAM = "grid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ctx shape is large and shared across layout/behavior
export function usePlayScreenInteractions(ctx: any) {
  const { setup, behavior } = ctx;
  const { navigate, sessionId, session: _session, createSession, copyShareLink, nativeShare, grid, ui, scene, sessionResult: _sessionResult } = setup;
  const { manager, state, setState, elapsedSeconds, puzzleKey, boardRef, canvasRef, trayRef, imgRef, popMapRef, replay } = behavior;

  const handleNewGame = useCallback(() => {
    clearPuzzleState();
    navigate("/new");
  }, [navigate]);

  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, handleLostPointerCapture, handleContextMenu, dragPreview, dragPreviewPiece, dragPreviewPieceIdRef, undoSnapBackRef, isDraggingBoard, handleTrayPieceClick } = usePlayScreenBoardInteractions({
    manager,
    state: state ?? null,
    setState,
    boardRef,
    canvasRef,
    trayRef,
    selectedIdRef: ui.selectedIdRef,
    setSelectedPieceId: ui.setSelectedPieceId,
    bump: ui.bump,
    clearHighlight: behavior.clearHighlight,
    hapticsVibrate: scene.haptics.vibrate,
    moveCountRef: scene.moveCountRef,
    dragStartTimeRef: scene.dragStartTimeRef,
    rotationCountRef: scene.rotationCountRef,
    stateRef: scene.stateRef,
    isCoarsePointer: scene.isCoarsePointer,
    viewport: scene.viewport,
    selectCycle: behavior.selectCycle,
    lastInteractionRef: scene.lastInteractionRef,
    popMapRef,
  });

  usePlayScreenAnimation({
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    lockMapRef: behavior.lockMapRef,
    selectedIdRef: ui.selectedIdRef,
    dragPreviewPieceIdRef,
    snapParticlesRef: behavior.snapParticlesRef,
    debug: ui.debug,
    magneticSnapEnabled: ui.magneticSnapEnabled,
    snapGlowEnabled: ui.snapGlowEnabled,
    showGhostHint: ui.showGhostHint,
    showAlignmentGrid: ui.showAlignmentGrid,
    showGhostWhenIdle: ui.showGhostWhenIdle,
    showEdgeHighlight: ui.showEdgeHighlight,
    showClusterOutline: ui.showClusterOutline,
    lastInteractionRef: scene.lastInteractionRef,
    viewport: scene.viewport.viewport,
    perfStatsRef: scene.perfStatsRef,
    wrongRotationHintRef: scene.wrongRotationHintRef,
    batterySaverMode: scene.batterySaverMode,
    undoSnapBackRef,
    onUndoSnapBackComplete: () => {
      undoSnapBackRef.current = null;
    },
    dailyVisualModifier: isDailyPuzzleSession()
      ? getDailyVisualModifier()
      : (ui.dailyPreferredModifier ?? getDailyPreferredModifier()),
  });

  const { puzzleShareUrl } = usePlayScreenShareSession({
    isComplete: state?.isComplete ?? false,
    sessionId,
    grid,
    storageKey: STORAGE_KEY,
    sessionIdParam: SESSION_ID_PARAM,
    dailyParam: DAILY_PARAM,
    gridParam: GRID_PARAM,
  });

  const shareAccuracyPercent =
    state?.totalCount && state.totalCount > 0
      ? Math.round((state.totalCount / Math.max(scene.moveCountRef.current, state.totalCount)) * 100)
      : 100;
  const share = useShareResults({
    elapsedSeconds,
    state,
    progressShareUrl: puzzleShareUrl,
    challengeShareUrl: puzzleShareUrl,
    accuracyPercent: shareAccuracyPercent,
  });

  const handleSharePuzzle = usePlayScreenSharePuzzle({
    sessionId,
    nativeShare,
    copyShareLink,
    createSession,
    grid,
    isCoarsePointer: scene.isCoarsePointer,
    stateRef: scene.stateRef,
    elapsedSecondsRef: scene.elapsedSecondsRef,
    setShareToast: scene.setShareToast,
  });

  const handleDownloadImage = useDownloadImage({ canvasRef, imgRef, state, elapsedSeconds });
  const trayPieces = usePlayScreenTrayPieces(state ?? null, scene.trayPiecesKeyRef);

  React.useEffect(() => {
    scene.trayPiecesKeyRef.current = { key: "", pieces: [] };
  }, [puzzleKey]);

  const displayElapsedSeconds = replay.isReplaying ? replay.replayElapsedSeconds : elapsedSeconds;
  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;

  const dailyVisualModifier = isDailyPuzzleSession()
    ? getDailyVisualModifier()
    : (ui.dailyPreferredModifier ?? getDailyPreferredModifier());
  const fogStrength = dailyVisualModifier === "fog" && total > 0 ? (1 - placed / total) * 0.45 : 0;
  const immersive = usePlayScreenImmersiveControls({
    immersiveMode: ui.immersiveMode,
    immersiveReveal: scene.immersiveReveal,
    setImmersiveReveal: scene.setImmersiveReveal,
    immersiveHideTimerRef: scene.immersiveHideTimerRef,
    toggleImmersiveMode: ui.toggleImmersiveMode,
  });

  const bestTimeSeconds =
    setup.timeMode === "best" && state?.grid ? getBestTime(state.grid.rows, state.grid.cols) : null;

  const handleUndo = createUndoRedoHandler(
    manager ?? null,
    "undo",
    setState,
    () => Boolean(manager?.canUndo() && !ui.isPaused && !state?.isComplete),
    soundManager.play.bind(soundManager),
    () => {
      scene.undoCountRef.current += 1;
    },
    (fromPositions) => {
      undoSnapBackRef.current = { fromPositions, startMs: performance.now() };
    },
  );

  const handleRedo = createUndoRedoHandler(
    manager ?? null,
    "redo",
    setState,
    () => Boolean(manager?.canRedo() && !ui.isPaused && !state?.isComplete),
    soundManager.play.bind(soundManager),
    undefined,
    (fromPositions) => {
      undoSnapBackRef.current = { fromPositions, startMs: performance.now() };
    },
  );

  return {
    handleNewGame,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
    dragPreview,
    dragPreviewPiece,
    undoSnapBackRef,
    isDraggingBoard,
    handleTrayPieceClick,
    puzzleShareUrl,
    share,
    handleSharePuzzle,
    handleDownloadImage,
    trayPieces,
    displayElapsedSeconds,
    placed,
    total,
    left,
    isComplete,
    dailyVisualModifier,
    fogStrength,
    immersive,
    bestTimeSeconds,
    handleUndo,
    handleRedo,
  };
}
