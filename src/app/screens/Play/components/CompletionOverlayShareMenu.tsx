import React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Share2, Swords } from "lucide-react";
import styles from "./CompletionOverlay.module.css";
import { formatTime } from "../playUtils";
import { getPiecesLine } from "../shareMessages";
import type { UseCompletionOverlayDataResult } from "./useCompletionOverlayData";

const PLAY_BASE = "https://phuzzle.vercel.app";

export function CompletionOverlayShareMenu(props: {
  shareMenuOpen: boolean;
  setShareMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shareRef: React.RefObject<HTMLDivElement>;
  shareTriggerRef: React.RefObject<HTMLButtonElement>;
  dropdownPosition: { top: number; left: number; minWidth: number } | null;
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
}) {
  const {
    shareMenuOpen,
    setShareMenuOpen,
    shareRef,
    shareTriggerRef,
    dropdownPosition,
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
  } = props;

  return (
    <div className={styles.completeShareWrap} ref={shareRef}>
      <button
        ref={shareTriggerRef}
        type="button"
        className={styles.completeShareTrigger}
        onClick={() => setShareMenuOpen((o) => !o)}
        aria-expanded={shareMenuOpen}
        aria-haspopup="true"
        aria-label="Share options"
        title="Share or challenge a friend"
      >
        <Share2 size={18} aria-hidden />
        <span>{shareMenuOpen ? "Close menu" : "Share"}</span>
        <ChevronDown
          size={16}
          className={shareMenuOpen ? styles.completeShareChevronOpen : ""}
          aria-hidden
        />
      </button>
      {shareMenuOpen &&
        dropdownPosition &&
        (() => {
          const pieceCount = (grid?.rows ?? 0) * (grid?.cols ?? 0) || 0;
          const fullUrl = puzzleShareUrl.startsWith("http")
            ? puzzleShareUrl
            : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
          return createPortal(
            <div
              className={styles.completeShareDropdown}
              role="menu"
              data-complete-share-dropdown
              style={{
                position: "fixed",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                minWidth: Math.max(dropdownPosition.minWidth, 320),
                zIndex: 3000,
              }}
            >
              <div className={styles.completeShareMessagePreview}>
                <div
                  className={`${styles.completeShareBubble} ${styles.completeShareBubbleResult}`}
                >
                  <p className={styles.completeShareBubbleIntro}>
                    Puzzle complete! Here&apos;s my run.
                  </p>
                  <p className={styles.completeShareBubbleTitle}>
                    <span className={styles.completeShareBubbleIcon} aria-hidden>
                      🧩
                    </span>{" "}
                    PHUZZLE RESULT
                  </p>
                  <p className={styles.completeShareBubbleLine}>
                    Time: {formatTime(elapsedSeconds)}
                  </p>
                  <p className={styles.completeShareBubbleLine}>{getPiecesLine(pieceCount)}</p>
                  <p className={styles.completeShareBubbleLine}>
                    Accuracy: {Math.max(0, Math.min(100, Math.round(accuracyPercent ?? 100)))}%
                  </p>
                  <p className={styles.completeShareBubbleCta}>Try this same puzzle:</p>
                  <p className={styles.completeShareBubbleUrl}>{fullUrl}</p>
                </div>
                <div
                  className={`${styles.completeShareBubble} ${styles.completeShareBubbleChallenge}`}
                >
                  <p className={styles.completeShareBubbleIntro}>Think you can beat me?</p>
                  <p className={styles.completeShareBubbleTitle}>
                    <span className={styles.completeShareBubbleIcon} aria-hidden>
                      🧩
                    </span>{" "}
                    PUZZLE CHALLENGE
                  </p>
                  <p className={styles.completeShareBubbleLine}>
                    My Time: {formatTime(elapsedSeconds)}
                  </p>
                  <p className={styles.completeShareBubbleLine}>{getPiecesLine(pieceCount)}</p>
                  <p className={styles.completeShareBubbleCta}>Try the same puzzle:</p>
                  <p className={styles.completeShareBubbleUrl}>{fullUrl}</p>
                </div>
              </div>
              <div className={styles.completeShareDropdownActions}>
                {(onShareProgress || onCopyProgress) && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeShareDropdownItem}
                    title={canNativeShare ? "Share result" : "Copy result link"}
                    onClick={() => {
                      setShareMenuOpen(false);
                      const fn = canNativeShare ? onShareProgress : onCopyProgress;
                      if (typeof fn === "function") fn();
                    }}
                  >
                    <Share2 size={16} aria-hidden />
                    <span>{copied ? "Copied!" : "Share Result"}</span>
                  </button>
                )}
                {(onShareChallenge || onCopyChallenge) && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeShareDropdownItem}
                    title={canNativeShare ? "Challenge a friend" : "Copy challenge link"}
                    onClick={() => {
                      setShareMenuOpen(false);
                      if (canNativeShare) {
                        void completionData.handleShareChallengeCard().catch(() => {
                          if (typeof onShareChallenge === "function") onShareChallenge();
                        });
                      } else if (typeof onCopyChallenge === "function") {
                        onCopyChallenge();
                      }
                    }}
                  >
                    <Swords size={16} aria-hidden />
                    <span>{copied ? "Copied!" : "Challenge a Friend"}</span>
                  </button>
                )}
              </div>
            </div>,
            document.body,
          );
        })()}
    </div>
  );
}
