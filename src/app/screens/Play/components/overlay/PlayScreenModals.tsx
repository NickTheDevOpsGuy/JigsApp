/**
 * Play screen modal dialogs: resume choice, help choice, theme, puzzle picker, reset stats, clear cache.
 */
import React from "react";
import { ConfirmModal } from "@/components/Modal/Modal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { ThemeModal } from "@/components/ThemeModal";
import { ChoosePuzzleModal } from "@/components/ChoosePuzzleModal";
import { PlayConfirmModals } from "./PlayConfirmModals";
import type { ResumeChoice } from "@/screens/Play/hooks/manager/usePlayScreenManager";

export type PlayScreenModalsProps = {
  awaitingResumeChoice: boolean;
  resumeChoice: ResumeChoice | null;
  setResumeChoice: (choice: ResumeChoice) => void;
  showHelpChoice: boolean;
  setShowHelpChoice: (show: boolean) => void;
  setShowHowToPlay: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  showThemeModal: boolean;
  setShowThemeModal: (show: boolean) => void;
  onOpenFeedback: () => void;
  hapticsEnabled: boolean;
  showNewGameModal: boolean;
  setShowNewGameModal: (show: boolean) => void;
  onConfirmNewGame: () => void;
  showChoosePuzzleModal: boolean;
  setShowChoosePuzzleModal: (show: boolean) => void;
  showResetStatsConfirm: boolean;
  setShowResetStatsConfirm: (show: boolean) => void;
  showClearCacheConfirm: boolean;
  setShowClearCacheConfirm: (show: boolean) => void;
  /** When true (replay mode), do not show resume or new-game modals. */
  replayBarOpen?: boolean;
};

export function PlayScreenModals({
  awaitingResumeChoice,
  resumeChoice,
  setResumeChoice,
  showHelpChoice,
  setShowHelpChoice,
  setShowHowToPlay,
  setShowShortcuts,
  showThemeModal,
  setShowThemeModal,
  onOpenFeedback,
  hapticsEnabled,
  showNewGameModal,
  setShowNewGameModal,
  onConfirmNewGame,
  showChoosePuzzleModal,
  setShowChoosePuzzleModal,
  showResetStatsConfirm,
  setShowResetStatsConfirm,
  showClearCacheConfirm,
  setShowClearCacheConfirm,
  replayBarOpen = false,
}: PlayScreenModalsProps) {
  const blockReplayModals = replayBarOpen;

  return (
    <>
      <ChoosePuzzleModal
        isOpen={showChoosePuzzleModal}
        onClose={() => setShowChoosePuzzleModal(false)}
      />

      <ConfirmModal
        isOpen={!blockReplayModals && awaitingResumeChoice && resumeChoice === null}
        onClose={() => setResumeChoice("resume")}
        onConfirm={() => setResumeChoice("fresh")}
        closeOnConfirm={false}
        title="Resume Your Puzzle?"
        message="You have a puzzle in progress. Would you like to continue where you left off?"
        confirmText="Start Fresh"
        cancelText="Resume"
        variant="default"
      />

      <HelpChoiceModal
        isOpen={showHelpChoice}
        onClose={() => setShowHelpChoice(false)}
        onHowToPlay={() => {
          setShowHelpChoice(false);
          setShowHowToPlay(true);
        }}
        onKeyboardShortcuts={() => {
          setShowHelpChoice(false);
          setShowShortcuts(true);
        }}
        onOpenTheme={() => {
          setShowHelpChoice(false);
          setShowThemeModal(true);
        }}
        onOpenFeedback={onOpenFeedback}
      />

      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        hapticsEnabled={hapticsEnabled}
      />

      <ConfirmModal
        isOpen={!blockReplayModals && showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onConfirm={onConfirmNewGame}
        title="Start New Puzzle?"
        message="Your current progress will be lost. Are you sure you want to start a new puzzle?"
        confirmText="New Puzzle"
        cancelText="Keep Playing"
        variant="danger"
      />

      <PlayConfirmModals
        showResetStatsConfirm={showResetStatsConfirm}
        setShowResetStatsConfirm={setShowResetStatsConfirm}
        showClearCacheConfirm={showClearCacheConfirm}
        setShowClearCacheConfirm={setShowClearCacheConfirm}
      />
    </>
  );
}
