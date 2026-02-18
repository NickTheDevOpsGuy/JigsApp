/**
 * PlayScreenModals – ConfirmModal, HelpChoiceModal, ThemeModal for play screen.
 */
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "@/components/Modal/Modal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { ThemeModal } from "@/components/ThemeModal";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import { BEST_TIME_PREFIX } from "../timeMode";

type Props = {
  awaitingResumeChoice: boolean;
  resumeChoice: "resume" | "fresh" | null;
  setResumeChoice: (c: "resume" | "fresh") => void;
  showHelpChoice: boolean;
  setShowHelpChoice: (v: boolean) => void;
  onShowHowToPlay: () => void;
  onShowShortcuts: () => void;
  showThemeModal: boolean;
  setShowThemeModal: (v: boolean) => void;
  showNewGameModal: boolean;
  setShowNewGameModal: (v: boolean) => void;
  showResetStatsConfirm: boolean;
  setShowResetStatsConfirm: (v: boolean) => void;
  showClearCacheConfirm: boolean;
  setShowClearCacheConfirm: (v: boolean) => void;
  hapticsEnabled: boolean;
  onNewGame: () => void;
};


function clearLocalStorageByPrefix(prefix: string) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function PlayScreenModals({
  awaitingResumeChoice,
  resumeChoice,
  setResumeChoice,
  showHelpChoice,
  setShowHelpChoice,
  onShowHowToPlay,
  onShowShortcuts,
  showThemeModal,
  setShowThemeModal,
  showNewGameModal,
  setShowNewGameModal,
  showResetStatsConfirm,
  setShowResetStatsConfirm,
  showClearCacheConfirm,
  setShowClearCacheConfirm,
  hapticsEnabled,
  onNewGame,
}: Props) {
  const navigate = useNavigate();

  return (
    <>
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
        onHowToPlay={onShowHowToPlay}
        onKeyboardShortcuts={onShowShortcuts}
      />
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        hapticsEnabled={hapticsEnabled}
      />
      <ConfirmModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onConfirm={onNewGame}
        title="Start New Puzzle?"
        message="Your current progress will be lost. Are you sure you want to start a new puzzle?"
        confirmText="New Puzzle"
        cancelText="Keep Playing"
        variant="danger"
      />
      <ConfirmModal
        isOpen={showResetStatsConfirm}
        onClose={() => setShowResetStatsConfirm(false)}
        onConfirm={() => {
          clearLocalStorageByPrefix(BEST_TIME_PREFIX);
          setShowResetStatsConfirm(false);
        }}
        title="Reset Local Stats?"
        message="This will clear all local best times. This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="danger"
      />
      <ConfirmModal
        isOpen={showClearCacheConfirm}
        onClose={() => setShowClearCacheConfirm(false)}
        onConfirm={() => {
          clearPuzzleState();
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (
                k?.startsWith("phuzzle:viewport:") ||
                k === "phuzzle:puzzleState" ||
                k === "phuzzle:puzzleStateBackup"
              )
                keysToRemove.push(k);
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
          } catch {
            /* ignore */
          }
          setShowClearCacheConfirm(false);
          navigate("/");
        }}
        title="Clear Cache?"
        message="This will clear saved puzzle state and viewport settings. You will return to the menu."
        confirmText="Clear"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
