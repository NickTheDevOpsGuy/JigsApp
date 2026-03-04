/**
 * Play screen modal dialogs: resume choice, help choice, theme, new game, reset stats, clear cache.
 */
import React from "react";
import { ConfirmModal } from "@/components/Modal/Modal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { ThemeModal } from "@/components/ThemeModal";
import { PlayConfirmModals } from "./PlayConfirmModals";
import type { ResumeChoice } from "../hooks/usePlayScreenManager";

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
  hapticsEnabled: boolean;
  showNewGameModal: boolean;
  setShowNewGameModal: (show: boolean) => void;
  onConfirmNewGame: () => void;
  showResetStatsConfirm: boolean;
  setShowResetStatsConfirm: (show: boolean) => void;
  showClearCacheConfirm: boolean;
  setShowClearCacheConfirm: (show: boolean) => void;
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
  hapticsEnabled,
  showNewGameModal,
  setShowNewGameModal,
  onConfirmNewGame,
  showResetStatsConfirm,
  setShowResetStatsConfirm,
  showClearCacheConfirm,
  setShowClearCacheConfirm,
}: PlayScreenModalsProps) {
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
      />

      <HelpChoiceModal
        isOpen={showHelpChoice}
        onClose={() => setShowHelpChoice(false)}
        onHowToPlay={() => setShowHowToPlay(true)}
        onKeyboardShortcuts={() => setShowShortcuts(true)}
      />

      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        hapticsEnabled={hapticsEnabled}
      />

      <ConfirmModal
        isOpen={showNewGameModal}
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
