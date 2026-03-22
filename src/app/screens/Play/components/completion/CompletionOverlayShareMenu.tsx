import React, { useState } from "react";
import { Share2, Swords, Copy, Image } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { AppModal } from "@/components/AppModal";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import { buildChallengePlayUrl } from "@/screens/Play/core/share/shareMessages";

export function CompletionOverlayShareMenu(props: {
  shareMenuOpen: boolean;
  setShareMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shareRef: React.RefObject<HTMLDivElement>;
  shareTriggerRef: React.RefObject<HTMLButtonElement>;
  dropdownPosition: { top: number; left: number; minWidth: number } | null;
  grid?: { rows: number; cols: number };
  puzzleShareUrl: string;
  challengeShareReady: boolean;
  ensureChallengeShareUrl?: () => Promise<string>;
  elapsedSeconds: number;
  moveCount?: number;
  accuracyPercent: number;
  copied: boolean;
  canNativeShare: boolean;
  onShareProgress?: () => void;
  onCopyProgress?: () => void;
  onShareChallenge?: (challengeUrl?: string) => void;
  onCopyChallenge?: (challengeUrl?: string) => void;
  shareProgressText?: string;
  shareChallengeText?: string;
  completionData: UseCompletionOverlayDataResult;
  isDaily?: boolean;
  /** When true, only render the share modal (opened by Share Puzzle button) */
  hideTrigger?: boolean;
}) {
  const {
    shareRef,
    shareTriggerRef,
    copied,
    canNativeShare,
    challengeShareReady,
    ensureChallengeShareUrl,
    onShareProgress,
    onCopyProgress,
    onShareChallenge,
    onCopyChallenge,
    completionData,
    hideTrigger = false,
  } = props;

  const sharePopupOpen = completionData.sharePopupOpen;
  const setSharePopupOpen = completionData.setSharePopupOpen;
  const shareProgressText = props.shareProgressText?.trim() ?? "";
  const shareChallengeText = props.shareChallengeText?.trim() ?? "";
  const [busyAction, setBusyAction] = useState<
    "card" | "share" | "copy" | "challenge" | null
  >(null);

  const runBusyAction = async (
    kind: "card" | "share" | "copy" | "challenge",
    action: () => Promise<void> | void,
  ) => {
    setBusyAction(kind);
    try {
      await action();
    } finally {
      setBusyAction(null);
    }
  };

  const progressPreviewLines = shareProgressText
    ? shareProgressText
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 4)
    : [];
  const challengePreviewLines =
    challengeShareReady && shareChallengeText
      ? shareChallengeText
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .slice(0, 3)
      : [];

  return (
    <div className={styles.completeShareWrap} ref={shareRef}>
      {!hideTrigger && (
        <button
          ref={shareTriggerRef}
          type="button"
          className={styles.completeActionBtn}
          onClick={() => setSharePopupOpen(true)}
          aria-expanded={sharePopupOpen}
          aria-haspopup="dialog"
          aria-label="Share your solve"
          title="Share your result, copy link, or challenge a friend"
        >
          <span className={styles.completeActionLead}>
            <Share2 size={18} aria-hidden />
            Share
          </span>
        </button>
      )}
      <AppModal
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        title="Share Your Solve"
        subtitle="Share your result, copy the link, or challenge a friend."
        size="wide"
        bodyClassName={styles.shareModalBody}
      >
        <div className={styles.completeShareSheet}>
          <div className={styles.completeShareSummaryCard}>
            <div className={styles.completeSharePreviewHeader}>
              <span className={styles.completeSharePreviewBrand}>Phuzzle</span>
              <span className={styles.completeSharePreviewTag}>Solve summary</span>
            </div>
            <div className={styles.completeSharePreviewStats}>
              <span>Time: {formatTime(props.elapsedSeconds)}</span>
              {props.grid ? (
                <span>
                  Grid: {props.grid.rows}×{props.grid.cols}
                </span>
              ) : null}
              <span>Accuracy: {Math.round(props.accuracyPercent)}%</span>
            </div>
          </div>
          <div className={styles.completeShareActionsGroup}>
            <span className={styles.completeShareGroupLabel}>Share</span>
            {progressPreviewLines.length > 0 && (
              <div className={styles.completeSharePreviewBlock}>
                <span className={styles.completeSharePreviewLabel}>Includes</span>
                <div className={styles.completeSharePreviewList}>
                  {progressPreviewLines.map((line) => (
                    <span key={line} className={styles.completeSharePreviewLine}>
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div
              className={styles.completeShareDropdown}
              role="menu"
              aria-label="Share actions"
            >
              <div className={styles.completeShareDropdownActions}>
                {props.isDaily && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeShareDropdownItem}
                    title="Copy or share the daily Wordle-style summary"
                    onClick={() =>
                      void runBusyAction("share", async () => {
                        await completionData.handleNativeDailyShare();
                      })
                    }
                    disabled={busyAction !== null}
                  >
                    <Share2 size={16} aria-hidden />
                    <span>
                      {busyAction === "share"
                        ? "Sharing..."
                        : completionData.dailyCopied
                          ? "Copied!"
                          : "Daily Share"}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  className={styles.completeShareDropdownItem}
                  title="Download or share result card image"
                  onClick={() =>
                    void runBusyAction("card", async () => {
                      await completionData.handleShareCard().catch(() => {});
                    })
                  }
                  disabled={completionData.isGenerating || busyAction !== null}
                >
                  <Image size={16} aria-hidden />
                  <span className={styles.completeShareActionCopy}>
                    {completionData.isGenerating || busyAction === "card"
                      ? "Preparing card..."
                      : "Share card image"}
                    <small>Adds the puzzle image</small>
                  </span>
                </button>
                {(onShareProgress || onCopyProgress) && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeShareDropdownItem}
                    title={
                      canNativeShare
                        ? "Share result via social or apps"
                        : "Copy result link"
                    }
                    onClick={() =>
                      void runBusyAction(canNativeShare ? "share" : "copy", async () => {
                        const fn = canNativeShare ? onShareProgress : onCopyProgress;
                        if (typeof fn === "function") {
                          await fn();
                        }
                      })
                    }
                    disabled={busyAction !== null}
                  >
                    <Share2 size={16} aria-hidden />
                    <span className={styles.completeShareActionCopy}>
                      {busyAction === "share"
                        ? "Opening Share..."
                        : busyAction === "copy"
                          ? "Copying..."
                          : copied
                            ? "Copied!"
                            : canNativeShare
                              ? "Share result"
                              : "Copy link"}
                      <small>Time, moves, turns, and link</small>
                    </span>
                  </button>
                )}
                {canNativeShare && onCopyProgress && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeShareDropdownItem}
                    title="Copy result link to clipboard"
                    onClick={() =>
                      void runBusyAction("copy", async () => {
                        if (typeof onCopyProgress === "function") {
                          await onCopyProgress();
                        }
                      })
                    }
                    disabled={busyAction !== null}
                  >
                    <Copy size={16} aria-hidden />
                    <span className={styles.completeShareActionCopy}>
                      {busyAction === "copy"
                        ? "Copying..."
                        : copied
                          ? "Copied!"
                          : "Copy link"}
                      <small>Send the exact puzzle URL</small>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {(onShareChallenge || onCopyChallenge) && (
            <div className={styles.completeShareActionsGroup}>
              <span className={styles.completeShareGroupLabel}>Challenge</span>
              {challengeShareReady && challengePreviewLines.length > 0 ? (
                <div className={styles.completeSharePreviewBlock}>
                  <span className={styles.completeSharePreviewLabel}>
                    Challenge includes
                  </span>
                  <div className={styles.completeSharePreviewList}>
                    {challengePreviewLines.map((line) => (
                      <span key={line} className={styles.completeSharePreviewLine}>
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.completeSharePreviewBlock}>
                  <span className={styles.completeSharePreviewLabel}>
                    Challenge status
                  </span>
                  <div className={styles.completeSharePreviewList}>
                    <span className={styles.completeSharePreviewLine}>
                      Preparing an exact challenge link for this puzzle.
                    </span>
                  </div>
                </div>
              )}
              <div
                className={styles.completeShareDropdown}
                role="menu"
                aria-label="Challenge actions"
              >
                <div className={styles.completeShareDropdownActions}>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeShareDropdownItem}
                    title={
                      challengeShareReady
                        ? canNativeShare
                          ? "Challenge a friend"
                          : "Copy challenge link"
                        : "Create exact challenge link"
                    }
                    onClick={() =>
                      void runBusyAction("challenge", async () => {
                        const baseChallengeUrl = ensureChallengeShareUrl
                          ? await ensureChallengeShareUrl()
                          : props.puzzleShareUrl;
                        const challengeUrl = buildChallengePlayUrl(
                          baseChallengeUrl,
                          props.elapsedSeconds,
                          props.moveCount ?? 0,
                        );
                        if (canNativeShare) {
                          if (typeof onShareChallenge === "function") {
                            await onShareChallenge(challengeUrl);
                          }
                        } else if (typeof onCopyChallenge === "function") {
                          await onCopyChallenge(challengeUrl);
                        }
                      })
                    }
                    disabled={busyAction !== null}
                  >
                    <Swords size={16} aria-hidden />
                    <span className={styles.completeShareActionCopy}>
                      {busyAction === "challenge"
                        ? canNativeShare
                          ? "Opening Share..."
                          : "Copying..."
                        : copied
                          ? "Copied!"
                          : "Challenge friend"}
                      <small>
                        {challengeShareReady
                          ? "Same puzzle, same difficulty, your score to beat"
                          : "Creates the exact puzzle link, then shares it"}
                      </small>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppModal>
    </div>
  );
}
