import React from "react";
import { Share2, Swords, Copy, Image } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { AppModal } from "@/components/AppModal";
import { formatTime } from "@/screens/Play/core/utils/playUtils";

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
    shareRef,
    shareTriggerRef,
    copied,
    canNativeShare,
    onShareProgress,
    onCopyProgress,
    onShareChallenge,
    onCopyChallenge,
    completionData,
  } = props;

  const sharePopupOpen = completionData.sharePopupOpen;
  const setSharePopupOpen = completionData.setSharePopupOpen;

  return (
    <div className={styles.completeShareWrap} ref={shareRef}>
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
            <div
              className={styles.completeShareDropdown}
              role="menu"
              aria-label="Share actions"
            >
              <div className={styles.completeShareDropdownActions}>
              <button
                type="button"
                role="menuitem"
                className={styles.completeShareDropdownItem}
                title="Download or share result card image"
                onClick={() => {
                  void completionData.handleShareCard().catch(() => {});
                }}
                disabled={completionData.isGenerating}
              >
                <Image size={16} aria-hidden />
                <span>{completionData.isGenerating ? "…" : "Share Card"}</span>
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
                  onClick={() => {
                    const fn = canNativeShare ? onShareProgress : onCopyProgress;
                    if (typeof fn === "function") fn();
                  }}
                >
                  <Share2 size={16} aria-hidden />
                  <span>
                    {copied ? "Copied!" : canNativeShare ? "Share result" : "Copy link"}
                  </span>
                </button>
              )}
              {canNativeShare && onCopyProgress && (
                <button
                  type="button"
                  role="menuitem"
                  className={styles.completeShareDropdownItem}
                  title="Copy result link to clipboard"
                  onClick={() => {
                    if (typeof onCopyProgress === "function") onCopyProgress();
                  }}
                >
                  <Copy size={16} aria-hidden />
                  <span>{copied ? "Copied!" : "Copy link"}</span>
                </button>
              )}
            </div>
          </div>
          {(onShareChallenge || onCopyChallenge) && (
            <div className={styles.completeShareActionsGroup}>
              <span className={styles.completeShareGroupLabel}>Challenge</span>
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
                    title={canNativeShare ? "Challenge a friend" : "Copy challenge link"}
                    onClick={() => {
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
                    <span>{copied ? "Copied!" : "Challenge friend"}</span>
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
