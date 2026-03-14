import React from "react";
import { Film, Sparkles } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { CompletionOverlayShareMenu } from "@/screens/Play/components/completion/CompletionOverlayShareMenu";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";

export function CompletionOverlayActions(args: {
  shareMenuOpen: boolean;
  setShareMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shareRef: React.RefObject<HTMLDivElement>;
  shareTriggerRef: React.RefObject<HTMLButtonElement>;
  dropdownPosition: { top: number; left: number; minWidth: number } | null;
  replayNextMenuOpen: boolean;
  setReplayNextMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  replayNextRef: React.RefObject<HTMLDivElement>;
  replayNextTriggerRef: React.RefObject<HTMLButtonElement>;
  replayNextDropdownPosition: { top: number; left: number; minWidth: number } | null;
  grid?: { rows: number; cols: number };
  puzzleShareUrl: string;
  elapsedSeconds: number;
  accuracyPercent: number;
  copied: boolean;
  canNativeShare: boolean;
  onShareProgress?: () => void;
  onCopyProgress?: () => void;
  onShareChallenge?: () => void;
  onCopyChallenge?: () => void;
  completionData: UseCompletionOverlayDataResult;
  canReplay: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
}) {
  const {
    shareMenuOpen,
    setShareMenuOpen,
    shareRef,
    shareTriggerRef,
    dropdownPosition,
    replayNextMenuOpen: _replayNextMenuOpen,
    setReplayNextMenuOpen: _setReplayNextMenuOpen,
    replayNextRef: _replayNextRef,
    replayNextTriggerRef: _replayNextTriggerRef,
    replayNextDropdownPosition: _replayNextDropdownPosition,
    grid,
    puzzleShareUrl,
    elapsedSeconds,
    accuracyPercent,
    copied,
    canNativeShare,
    onShareProgress,
    onCopyProgress,
    onShareChallenge,
    onCopyChallenge,
    completionData,
    canReplay,
    onReplayClick,
    onNextPuzzle,
  } = args;

  const showShareResult = !!(onShareProgress || onCopyProgress);
  const showShare = showShareResult || !!(onShareChallenge || onCopyChallenge);
  const showReplayNext = !!(canReplay && onReplayClick) || !!onNextPuzzle;

  if (!showShare && !showReplayNext) return null;

  return (
    <section className={styles.completeShareSection} aria-label="Actions">
      <div className={styles.completeShareDivider} aria-hidden>
        Actions
      </div>
      <div className={styles.completeActionsRow}>
        {onNextPuzzle && (
          <button
            type="button"
            className={`${styles.completeActionBtn} ${styles.completeActionBtnPrimary}`}
            onClick={onNextPuzzle}
            title="Start the next puzzle"
          >
            <span className={styles.completeActionLead}>
              <Sparkles size={18} aria-hidden="true" />
              Next Puzzle
            </span>
          </button>
        )}
        {canReplay && onReplayClick && (
          <button
            type="button"
            className={styles.completeActionBtn}
            onClick={onReplayClick}
            title="Review your solve"
          >
            <span className={styles.completeActionLead}>
              <Film size={18} aria-hidden="true" />
              Review Solve
            </span>
          </button>
        )}
        {showShare && (
          <CompletionOverlayShareMenu
            shareMenuOpen={shareMenuOpen}
            setShareMenuOpen={setShareMenuOpen}
            shareRef={shareRef}
            shareTriggerRef={shareTriggerRef}
            dropdownPosition={dropdownPosition}
            grid={grid}
            puzzleShareUrl={puzzleShareUrl}
            elapsedSeconds={elapsedSeconds}
            accuracyPercent={accuracyPercent}
            copied={copied}
            canNativeShare={canNativeShare}
            onShareProgress={onShareProgress}
            onCopyProgress={onCopyProgress}
            onShareChallenge={onShareChallenge}
            onCopyChallenge={onCopyChallenge}
            completionData={completionData}
          />
        )}
      </div>
    </section>
  );
}
