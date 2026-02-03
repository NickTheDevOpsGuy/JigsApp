import React, { useCallback } from "react";
import { soundManager } from "@/audio/sounds";
import { useKeyboardShortcuts, ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";

type UsePlayScreenShortcutsArgs = {
  manager: PuzzleManager | null;
  state: PuzzleState | null;
  setState: (st: PuzzleState) => void;
  isPaused: boolean;
  showShortcuts: boolean;
  showNewGameModal: boolean;
  showTutorial: boolean;
  selectedPieceId: string | null;
  setSelectedPieceId: (id: string | null) => void;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNewGameModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGhostHint: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  toggleFullscreen: () => void;
  selectCycle: (dir: 1 | -1) => void;
  selectedIdRef: React.MutableRefObject<string | null>;
};

export function usePlayScreenShortcuts(args: UsePlayScreenShortcutsArgs) {
  const {
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
    selectedIdRef: _selectedIdRef,
  } = args;

  const handleShortcut = useCallback(
    (action: ShortcutAction) => {
      switch (action) {
        case "pause":
          if (!state?.isComplete) setIsPaused((p) => !p);
          break;
        case "escape":
          if (showShortcuts) setShowShortcuts(false);
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
              soundManager.play("rotate");
              setState(manager.getState());
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
            }
          }
          break;
        }
        case "undo":
          if (manager?.canUndo() && !isPaused && !state?.isComplete) {
            manager.undo();
            setState(manager.getState());
          }
          break;
        case "sendToTray":
          if (manager && state && !isPaused && selectedPieceId) {
            const piece = state.pieces.find((p) => p.id === selectedPieceId);
            if (piece && !piece.isPlaced && !piece.inTray && !piece.locked) {
              manager.sendToTray(selectedPieceId);
              setState(manager.getState());
              selectCycle(1);
            }
          }
          break;
        case "snap":
          if (manager && state && !isPaused && selectedPieceId) {
            const piece = state.pieces.find((p) => p.id === selectedPieceId);
            if (piece && !piece.isPlaced && !piece.inTray && !piece.locked) {
              manager.snapGroupNow(selectedPieceId);
              setState(manager.getState());
            }
          }
          break;
        case "showHelp":
          setShowShortcuts((s) => !s);
          break;
      }
    },
    [
      state,
      isPaused,
      showShortcuts,
      showNewGameModal,
      manager,
      toggleFullscreen,
      selectedPieceId,
      setSelectedPieceId,
      setShowShortcuts,
      setShowNewGameModal,
      setShowPreview,
      setShowGhostHint,
      setIsPaused,
      setSoundEnabled,
      setHapticsEnabled,
      selectCycle,
      setState,
    ],
  );

  useKeyboardShortcuts({
    enabled: !showTutorial,
    onAction: handleShortcut,
  });
}
