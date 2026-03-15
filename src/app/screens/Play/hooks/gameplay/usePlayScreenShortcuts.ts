/**
 * usePlayScreenShortcuts – wires useKeyboardShortcuts to Play screen actions.
 */
import React, { useCallback } from "react";
import { soundManager } from "@/audio/core/sounds";
import { useKeyboardShortcuts, ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { PuzzleState } from "@/puzzle/core/types";
import { createUndoRedoHandler } from "@/screens/Play/core/utils/playUtils";

type UsePlayScreenShortcutsArgs = {
  manager: PuzzleManager | null;
  state: PuzzleState | null;
  setState: (st: PuzzleState) => void;
  isPaused: boolean;
  /** When false, Ctrl/Cmd+Z undo/redo do nothing */
  undoRedoEnabled?: boolean;
  showShortcuts: boolean;
  showHelpChoice: boolean;
  showNewGameModal: boolean;
  showTutorial: boolean;
  selectedPieceId: string | null;
  setSelectedPieceId: (id: string | null) => void;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelpChoice: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNewGameModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGhostHint: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  toggleFullscreen: () => void;
  selectCycle: (dir: 1 | -1) => void;
  selectedIdRef: React.MutableRefObject<string | null>;
  onUndoSuccess?: () => void;
  /** Called when a keyboard action uses the selection; resets the 1s auto-clear timer */
  onExtendSelection?: () => void;
  /** Trigger snap-back animation after undo/redo (Ctrl/Cmd+Z) */
  onSnapBackAnimate?: (
    fromPositions: import("@/screens/Play/core/utils/playUtils").UndoSnapBackFrom,
  ) => void;
  /** Called when user rotates a piece (for completion stats). */
  onRotate?: () => void;
};

export function usePlayScreenShortcuts(args: UsePlayScreenShortcutsArgs) {
  const {
    manager,
    state,
    setState,
    isPaused,
    undoRedoEnabled = true,
    showShortcuts,
    showHelpChoice,
    showNewGameModal,
    showTutorial,
    selectedPieceId,
    setSelectedPieceId,
    setShowShortcuts,
    setShowHelpChoice,
    setShowNewGameModal,
    setShowPreview,
    setShowGhostHint,
    setIsPaused,
    setSoundEnabled,
    setHapticsEnabled,
    toggleFullscreen,
    selectCycle,
    selectedIdRef: _selectedIdRef,
    onUndoSuccess,
    onExtendSelection,
    onSnapBackAnimate,
    onRotate,
  } = args;

  const handleShortcut = useCallback(
    (action: ShortcutAction) => {
      switch (action) {
        case "pause":
          if (!state?.isComplete) setIsPaused((p) => !p);
          break;
        case "escape":
          if (showShortcuts) setShowShortcuts(false);
          else if (showHelpChoice) setShowHelpChoice(false);
          else if (showNewGameModal) setShowNewGameModal(false);
          else if (isPaused) setIsPaused(false);
          break;
        case "preview":
          setShowPreview((p) => !p);
          break;
        case "toggleGhostHint":
          setShowGhostHint((g) => !g);
          break;
        case "fullscreen":
          toggleFullscreen();
          break;
        case "newGame":
          setShowNewGameModal(true);
          break;
        case "toggleSound": {
          const v = !soundManager.isEnabled();
          soundManager.setEnabled(v);
          setSoundEnabled(v);
          break;
        }
        case "toggleHaptics": {
          const v = !soundManager.isHapticsEnabled();
          soundManager.setHapticsEnabled(v);
          setHapticsEnabled(v);
          if (v && navigator.vibrate) navigator.vibrate(25);
          break;
        }
        case "rotateCW":
        case "rotateCCW":
          if (manager && state && !isPaused) {
            const movable = state.pieces.filter(
              (p) => !p.isPlaced && !p.inTray && !p.locked,
            );
            let piece = movable.find((p) => p.id === selectedPieceId);
            if (!piece && movable.length > 0) {
              piece = movable[0];
              setSelectedPieceId(piece.id);
            }
            if (piece) {
              manager.rotatePiece(piece.id);
              onRotate?.();
              soundManager.play("rotate");
              setState(manager.getState());
              onExtendSelection?.();
            }
          }
          break;
        case "nextPiece":
        case "prevPiece": {
          if (state && !isPaused) {
            const movable = state.pieces.filter(
              (p) => !p.isPlaced && !p.inTray && !p.locked,
            );
            if (movable.length === 0) break;
            const idx = movable.findIndex((p) => p.id === selectedPieceId);
            const nextIdx =
              action === "nextPiece"
                ? idx < 0
                  ? 0
                  : (idx + 1) % movable.length
                : idx < 0
                  ? movable.length - 1
                  : (idx - 1 + movable.length) % movable.length;
            setSelectedPieceId(movable[nextIdx].id);
          }
          break;
        }
        case "moveUp":
        case "moveDown":
        case "moveLeft":
        case "moveRight": {
          if (manager && state && !isPaused && selectedPieceId) {
            const piece = state.pieces.find((p) => p.id === selectedPieceId);
            if (piece && !piece.isPlaced && !piece.inTray && !piece.locked) {
              const d = 20;
              let dx = 0,
                dy = 0;
              if (action === "moveUp") dy = -d;
              else if (action === "moveDown") dy = d;
              else if (action === "moveLeft") dx = -d;
              else dx = d;
              manager.nudgeGroup(selectedPieceId, dx, dy);
              manager.snapGroupNow(selectedPieceId, true);
              setState(manager.getState());
              onExtendSelection?.();
            }
          }
          break;
        }
        case "undo":
          if (undoRedoEnabled) {
            createUndoRedoHandler(
              manager ?? null,
              "undo",
              setState,
              () => Boolean(manager?.canUndo() && !isPaused && !state?.isComplete),
              soundManager.play.bind(soundManager),
              onUndoSuccess,
              onSnapBackAnimate,
            )();
          }
          break;
        case "redo":
          if (undoRedoEnabled) {
            createUndoRedoHandler(
              manager ?? null,
              "redo",
              setState,
              () => Boolean(manager?.canRedo() && !isPaused && !state?.isComplete),
              soundManager.play.bind(soundManager),
              undefined,
              onSnapBackAnimate,
            )();
          }
          break;
        case "sendToTray":
          if (manager && state && !isPaused && selectedPieceId) {
            const piece = state.pieces.find((p) => p.id === selectedPieceId);
            if (piece && !piece.isPlaced && !piece.inTray && !piece.locked) {
              manager.sendToTray(selectedPieceId);
              setState(manager.getState());
              selectCycle(1);
              onExtendSelection?.();
            }
          }
          break;
        case "snap":
          if (manager && state && !isPaused && selectedPieceId) {
            const piece = state.pieces.find((p) => p.id === selectedPieceId);
            if (piece && !piece.isPlaced && !piece.inTray && !piece.locked) {
              manager.snapGroupNow(selectedPieceId);
              setState(manager.getState());
              onExtendSelection?.();
            }
          }
          break;
        case "showHelp":
          setShowHelpChoice((s) => !s);
          break;
      }
    },
    [
      state,
      isPaused,
      undoRedoEnabled,
      showShortcuts,
      showHelpChoice,
      showNewGameModal,
      manager,
      toggleFullscreen,
      selectedPieceId,
      setSelectedPieceId,
      setShowShortcuts,
      setShowHelpChoice,
      setShowNewGameModal,
      setShowPreview,
      setShowGhostHint,
      setIsPaused,
      setSoundEnabled,
      setHapticsEnabled,
      selectCycle,
      setState,
      onUndoSuccess,
      onSnapBackAnimate,
    ],
  );

  useKeyboardShortcuts({
    enabled: !showTutorial,
    onAction: handleShortcut,
  });
}
