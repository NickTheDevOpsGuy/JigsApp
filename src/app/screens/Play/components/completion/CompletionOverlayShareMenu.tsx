import React, { useState } from "react";
import { Share2, Swords, Image } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { AppModal } from "@/components/AppModal";
import { buildChallengePlayUrl } from "@/screens/Play/core/share/shareMessages";

export function CompletionOverlayShareMenu(props: {
  shareMenuOpen: boolean;
  setShareMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shareRef: React.RefObject<HTMLDivElement>;
  shareTriggerRef: React.RefObject<HTMLButtonElement>;
  dropdownPosition: { top: number; left: number; minWidth: number } | null;
  grid?: { rows: number; cols: number };
  puzzleShareUrl: string;
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
    ensureChallengeShareUrl,
    onShareProgress,
    onCopyProgress,
    onShareChallenge,
    onCopyChallenge,
    completionData,
    hideTrigger = false,
  } = props;

  const sharePopupOpen = completionData.sharePopupOpen;
  const sharePopupMode = completionData.sharePopupMode;
  const closeSharePopup = completionData.closeSharePopup;
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

  return (
    <div className={styles.completeShareWrap} ref={shareRef}>
      {!hideTrigger && (
        <button
          ref={shareTriggerRef}
          type="button"
          className={styles.completeActionBtn}
          onClick={() => completionData.openSharePopup("result")}
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
        isOpen={sharePopupOpen && sharePopupMode != null}
        onClose={closeSharePopup}
        title={sharePopupMode === "challenge" ? "Challenge Friend" : "Share Result"}
        subtitle={
          sharePopupMode === "challenge"
            ? "Pick how to share — both include your puzzle image and stats."
            : "Pick how to share — image card or text with time, moves, and link."
        }
        size="default"
        bodyClassName={styles.sharePopupCompact}
      >
        <div className={styles.sharePopupPanel} role="group" aria-label="Share options">
          <div className={styles.sharePopupActions} role="menu">
            <button
              type="button"
              role="menuitem"
              className={styles.sharePopupAction}
              title="Image card with puzzle picture and stats"
              onClick={() =>
                void runBusyAction("card", async () => {
                  const handler =
                    sharePopupMode === "challenge"
                      ? completionData.handleShareChallengeCard
                      : completionData.handleShareCard;
                  await handler().catch(() => {});
                })
              }
              disabled={completionData.isGenerating || busyAction === "card"}
            >
              <Image size={18} aria-hidden />
              <span>
                {completionData.isGenerating || busyAction === "card"
                  ? "Preparing card…"
                  : "Share card"}
              </span>
              <small>Puzzle image + time, moves, link</small>
            </button>

            {sharePopupMode === "challenge" && (onShareChallenge || onCopyChallenge) && (
              <button
                type="button"
                role="menuitem"
                className={styles.sharePopupAction}
                title={
                  canNativeShare
                    ? "Native share with challenge link and score to beat"
                    : "Copy challenge link and message"
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
                    if (canNativeShare && onShareChallenge) {
                      await onShareChallenge(challengeUrl);
                    } else if (onCopyChallenge) {
                      await onCopyChallenge(challengeUrl);
                    }
                  })
                }
                disabled={busyAction === "challenge" || busyAction === "card"}
              >
                <Swords size={18} aria-hidden />
                <span>
                  {busyAction === "challenge"
                    ? canNativeShare
                      ? "Sharing…"
                      : "Copying…"
                    : copied
                      ? "Copied!"
                      : canNativeShare
                        ? "Share link & message"
                        : "Copy link & message"}
                </span>
                <small>Text with time, moves, score to beat, play link</small>
              </button>
            )}

            {sharePopupMode === "result" && (onShareProgress || onCopyProgress) && (
              <button
                type="button"
                role="menuitem"
                className={styles.sharePopupAction}
                title={
                  canNativeShare
                    ? "Native share with your result text"
                    : "Copy result text and link"
                }
                onClick={() =>
                  void runBusyAction(canNativeShare ? "share" : "copy", async () => {
                    const fn = canNativeShare ? onShareProgress : onCopyProgress;
                    if (typeof fn === "function") {
                      await fn();
                    }
                  })
                }
                disabled={
                  busyAction === "share" || busyAction === "copy" || busyAction === "card"
                }
              >
                <Share2 size={18} aria-hidden />
                <span>
                  {busyAction === "share"
                    ? "Sharing…"
                    : busyAction === "copy"
                      ? "Copying…"
                      : copied
                        ? "Copied!"
                        : canNativeShare
                          ? "Share link & message"
                          : "Copy link & message"}
                </span>
                <small>Text with time, moves, rotations, link</small>
              </button>
            )}

            {props.isDaily && (
              <button
                type="button"
                role="menuitem"
                className={styles.sharePopupAction}
                title="Daily share"
                onClick={() =>
                  void runBusyAction("share", async () => {
                    await completionData.handleNativeDailyShare();
                  })
                }
                disabled={busyAction !== null}
              >
                <Share2 size={18} aria-hidden />
                <span>
                  {busyAction === "share"
                    ? "Sharing…"
                    : completionData.dailyCopied
                      ? "Copied!"
                      : "Daily Share"}
                </span>
              </button>
            )}
          </div>
        </div>
      </AppModal>
    </div>
  );
}
