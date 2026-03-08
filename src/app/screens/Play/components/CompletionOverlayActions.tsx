import React from "react";
import styles from "./CompletionOverlay.module.css";
import type { UseCompletionOverlayDataResult } from "./useCompletionOverlayData";
import { CompletionOverlayShareMenu } from "./CompletionOverlayShareMenu";
import { CompletionOverlayReplayNextMenu } from "./CompletionOverlayReplayNextMenu";

export function CompletionOverlayActions(args: {
  hasShare: boolean;
  hasReplayNext: boolean;
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
    hasShare,
    hasReplayNext,
    shareMenuOpen,
    setShareMenuOpen,
    shareRef,
    shareTriggerRef,
    dropdownPosition,
    replayNextMenuOpen,
    setReplayNextMenuOpen,
    replayNextRef,
    replayNextTriggerRef,
    replayNextDropdownPosition,
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

  if (!hasShare && !hasReplayNext) return null;

  return (
    <section className={styles.completeShareSection} aria-label="Actions">
      <div className={styles.completeShareDivider} aria-hidden>
        Actions
      </div>
      <div className={styles.completeActionsRow}>
        {hasShare && (
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
        {hasReplayNext && (
          <CompletionOverlayReplayNextMenu
            replayNextMenuOpen={replayNextMenuOpen}
            setReplayNextMenuOpen={setReplayNextMenuOpen}
            replayNextRef={replayNextRef}
            replayNextTriggerRef={replayNextTriggerRef}
            replayNextDropdownPosition={replayNextDropdownPosition}
            canReplay={canReplay}
            onReplayClick={onReplayClick}
            onNextPuzzle={onNextPuzzle}
          />
        )}
      </div>
    </section>
  );
}
