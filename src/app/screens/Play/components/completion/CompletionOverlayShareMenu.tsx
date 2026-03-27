import React, { useState } from "react";
import { Share2, Swords, Image } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { AppModal } from "@/components/AppModal";
import { buildChallengePlayUrl } from "@/screens/Play/core/share/shareMessages";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function CompletionOverlayShareMenu(props: {
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
  completionData: UseCompletionOverlayDataResult;
  isDaily?: boolean;
  /** When true, only render the share modal (opened by Share Puzzle button) */
  hideTrigger?: boolean;
}) {
  const {
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
  const isMobileShare = useMediaQuery("(max-width: 600px)");

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
    <div className={styles.completeShareWrap}>
      {!hideTrigger && (
        <button
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
          isMobileShare
            ? undefined
            : sharePopupMode === "challenge"
              ? "Share your puzzle image with a challenge link, or copy the challenge text if sharing files is unavailable."
              : "Share your puzzle image with your result, or copy the result text if sharing files is unavailable."
        }
        size="default"
        bodyClassName={styles.sharePopupCompact}
        backdropClassName={styles.sharePopupBackdropFit}
        dialogClassName={styles.sharePopupDialogFit}
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
                      : completionData.handleShareResultCard;
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
                  void runBusyAction(canNativeShare ? "card" : "challenge", async () => {
                    if (canNativeShare) {
                      await completionData.handleShareChallengeCard().catch(() => {});
                      return;
                    }
                    const baseChallengeUrl = ensureChallengeShareUrl
                      ? await ensureChallengeShareUrl()
                      : props.puzzleShareUrl;
                    const challengeUrl = buildChallengePlayUrl(
                      baseChallengeUrl,
                      props.elapsedSeconds,
                      props.moveCount ?? 0,
                    );
                    if (onCopyChallenge) {
                      await onCopyChallenge(challengeUrl);
                    }
                  })
                }
                disabled={busyAction === "challenge" || busyAction === "card"}
              >
                <Swords size={18} aria-hidden />
                <span>
                  {busyAction === "card"
                    ? "Preparing…"
                    : busyAction === "challenge"
                      ? canNativeShare
                        ? "Sharing…"
                        : "Copying…"
                      : copied
                        ? "Copied!"
                        : canNativeShare
                          ? "Share image & challenge"
                          : "Copy link & message"}
                </span>
                <small>
                  {canNativeShare
                    ? "Puzzle image + challenge text + play link"
                    : "Copy challenge text if image sharing is unavailable"}
                </small>
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
                  void runBusyAction(canNativeShare ? "card" : "copy", async () => {
                    if (canNativeShare) {
                      await completionData.handleShareResultCard().catch(() => {});
                      return;
                    }
                    if (typeof onCopyProgress === "function") {
                      await onCopyProgress();
                    }
                  })
                }
                disabled={
                  busyAction === "share" || busyAction === "copy" || busyAction === "card"
                }
              >
                <Share2 size={18} aria-hidden />
                <span>
                  {busyAction === "card"
                    ? "Preparing…"
                    : busyAction === "share"
                      ? "Sharing…"
                      : busyAction === "copy"
                        ? "Copying…"
                        : copied
                          ? "Copied!"
                          : canNativeShare
                            ? "Share image & result"
                            : "Copy link & message"}
                </span>
                <small>
                  {canNativeShare
                    ? "Puzzle image + result text + play link"
                    : "Copy result text if image sharing is unavailable"}
                </small>
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
