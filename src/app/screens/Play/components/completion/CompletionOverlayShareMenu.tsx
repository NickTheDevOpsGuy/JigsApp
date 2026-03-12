import React from "react";
import { ChevronDown, Share2, Swords, Copy, Play } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { Modal } from "@/components/Modal/Modal";

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
  canReplay?: boolean;
  onReplayClick?: () => void;
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
    canReplay,
    onReplayClick,
  } = props;

  const sharePopupOpen = completionData.sharePopupOpen;
  const setSharePopupOpen = completionData.setSharePopupOpen;

  return (
    <div className={styles.completeShareWrap} ref={shareRef}>
      <button
        ref={shareTriggerRef}
        type="button"
        className={styles.completeShareTrigger}
        onClick={() => setSharePopupOpen(true)}
        aria-expanded={sharePopupOpen}
        aria-haspopup="true"
        aria-label="Share options"
        title="Share or challenge a friend"
      >
        <Share2 size={18} aria-hidden />
        <span>{sharePopupOpen ? "Close menu" : "Share"}</span>
        <ChevronDown
          size={16}
          className={sharePopupOpen ? styles.completeShareChevronOpen : ""}
          aria-hidden
        />
      </button>
      <Modal
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        title="Share"
        showCloseButton
        variant="compact"
      >
        <div
          className={styles.completeShareDropdown}
          role="menu"
          aria-label="Share options"
        >
          <div className={styles.completeShareDropdownActions}>
            {(onShareProgress || onCopyProgress) && (
              <button
                type="button"
                role="menuitem"
                className={styles.completeShareDropdownItem}
                title={
                  canNativeShare ? "Share result via social or apps" : "Copy result link"
                }
                onClick={() => {
                  const fn = canNativeShare ? onShareProgress : onCopyProgress;
                  if (typeof fn === "function") fn();
                }}
              >
                <Share2 size={16} aria-hidden />
                <span>
                  {copied ? "Copied!" : canNativeShare ? "Social share" : "Share Result"}
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
            {(onShareChallenge || onCopyChallenge) && (
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
                <span>{copied ? "Copied!" : "Challenge a Friend"}</span>
              </button>
            )}
            {canReplay && onReplayClick && (
              <button
                type="button"
                role="menuitem"
                className={styles.completeShareDropdownItem}
                title="Open replay viewer to watch your solve"
                onClick={() => {
                  completionData.setSharePopupOpen(false);
                  onReplayClick();
                }}
              >
                <Play size={16} aria-hidden />
                <span>Replay viewer</span>
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
