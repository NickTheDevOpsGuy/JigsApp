import React from "react";
import { Calendar, Film, Sparkles, Share2, Swords } from "lucide-react";
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
  moveCount?: number;
  accuracyPercent: number;
  copied: boolean;
  canNativeShare: boolean;
  onShareProgress?: () => void;
  onCopyProgress?: () => void;
  onShareChallenge?: (challengeUrl?: string) => void;
  onCopyChallenge?: (challengeUrl?: string) => void;
  completionData: UseCompletionOverlayDataResult;
  canReplay: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
  isDaily?: boolean;
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
    moveCount,
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
    isDaily,
  } = args;

  const showShareResult = !!(onShareProgress || onCopyProgress);
  const showDailyShare =
    !!isDaily &&
    !!completionData.handleCopyDailyShare &&
    !!completionData.handleNativeDailyShare;
  const showShare = showShareResult || !!(onShareChallenge || onCopyChallenge);
  const showReplayNext = !!(canReplay && onReplayClick) || !!onNextPuzzle;

  if (!showShare && !showReplayNext && !showDailyShare) return null;

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
        {showDailyShare && (
          <button
            type="button"
            className={styles.completeActionBtn}
            onClick={() => {
              if (canNativeShare) {
                void completionData.handleNativeDailyShare();
              } else {
                void completionData.handleCopyDailyShare();
              }
            }}
            title="Share daily result (Wordle-style)"
          >
            <span className={styles.completeActionLead}>
              <Calendar size={18} aria-hidden="true" />
              {completionData.dailyCopied ? "Copied!" : "Daily Share"}
            </span>
          </button>
        )}
        {showShareResult && (
          <button
            type="button"
            className={styles.completeActionBtn}
            onClick={() => completionData.setSharePopupOpen(true)}
            title="Share your result (link and stats)"
          >
            <span className={styles.completeActionLead}>
              <Share2 size={18} aria-hidden="true" />
              Share Result
            </span>
          </button>
        )}
        {(onShareChallenge || onCopyChallenge) && (
          <button
            type="button"
            className={styles.completeActionBtn}
            onClick={async () => {
              const challengeUrl =
                puzzleShareUrl +
                (puzzleShareUrl.includes("?") ? "&" : "?") +
                `ct=${elapsedSeconds}&cm=${moveCount ?? 0}`;
              await completionData.handleShareChallengeCard().catch(() => {});
              onShareChallenge?.(challengeUrl);
            }}
            title="Challenge a friend to beat your puzzle"
          >
            <span className={styles.completeActionLead}>
              <Swords size={18} aria-hidden="true" />
              Beat My Puzzle
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
            moveCount={moveCount}
            accuracyPercent={accuracyPercent}
            copied={copied}
            canNativeShare={canNativeShare}
            onShareProgress={onShareProgress}
            onCopyProgress={onCopyProgress}
            onShareChallenge={onShareChallenge}
            onCopyChallenge={onCopyChallenge}
            completionData={completionData}
            hideTrigger
          />
        )}
      </div>
    </section>
  );
}
