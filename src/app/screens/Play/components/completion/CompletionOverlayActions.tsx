/**
 * Win screen actions: one primary Next Puzzle; two dropdowns (More Options, Share Results).
 * No X close; no individual action buttons outside the menus.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Sparkles,
  MoreHorizontal,
  Share2,
  Swords,
  Film,
  ImagePlus,
} from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { CompletionOverlayShareMenu } from "@/screens/Play/components/completion/CompletionOverlayShareMenu";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { AppModal } from "@/components/AppModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { buildChallengePlayUrl } from "@/screens/Play/core/share/shareMessages";

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
  shareProgressText?: string;
  shareChallengeText?: string;
  completionData: UseCompletionOverlayDataResult;
  canReplay: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
  onClose: () => void;
  isDaily?: boolean;
  focusReturnRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const {
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
    onClose: _onClose, // ← FIXED: rename unused variable
    grid,
  } = args;

  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"challenge" | "replay" | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const isMobileActions = useMediaQuery("(max-width: 600px)");

  useEffect(() => {
    if (isMobileActions) return;
    const close = (e: MouseEvent) => {
      if (
        moreRef.current &&
        !moreRef.current.contains(e.target as Node) &&
        shareRef.current &&
        !shareRef.current.contains(e.target as Node)
      ) {
        setMoreOpen(false);
        setShareOpen(false);
      }
    };

    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isMobileActions]);

  const runBusyAction = async (
    kind: "challenge" | "replay",
    action: () => Promise<void> | void,
  ) => {
    setBusyAction(kind);
    try {
      await action();
    } finally {
      setBusyAction(null);
    }
  };

  const handleChallenge = async () => {
    setShareOpen(false);

    const challengeUrl = buildChallengePlayUrl(
      puzzleShareUrl,
      elapsedSeconds,
      moveCount ?? 0,
    );
    await onShareChallenge?.(challengeUrl);
  };

  const handleShareResult = () => {
    setShareOpen(false);
    completionData.setSharePopupOpen(true);
  };

  const hasMoreOptions = !!onNextPuzzle || (canReplay && onReplayClick);
  const hasShareOptions = !!(
    onShareChallenge ||
    onCopyChallenge ||
    onShareProgress ||
    onCopyProgress
  );
  const moreDialogOpen = isMobileActions && moreOpen;
  const shareDialogOpen = isMobileActions && shareOpen;

  return (
    <section className={styles.completeActionsPhased} aria-label="Actions">
      {onNextPuzzle && (
        <button
          ref={args.focusReturnRef as React.RefObject<HTMLButtonElement>}
          type="button"
          className={styles.completePrimaryBtn}
          onClick={onNextPuzzle}
          title="Next Puzzle"
        >
          <Sparkles size={22} aria-hidden />
          Next Puzzle
        </button>
      )}

      <div className={styles.completeMenusRow}>
        {hasMoreOptions && (
          <div className={styles.completeMenuWrap} ref={moreRef}>
            <button
              type="button"
              className={styles.completeMenuTrigger}
              onClick={() => {
                setMoreOpen((o) => !o);
                setShareOpen(false);
              }}
              aria-expanded={moreOpen}
              aria-haspopup={isMobileActions ? "dialog" : "true"}
              aria-label="More options"
            >
              <MoreHorizontal size={18} aria-hidden />
              More Options
              <ChevronDown
                size={16}
                className={moreOpen ? styles.completeMenuChevronOpen : ""}
                aria-hidden
              />
            </button>

            {!isMobileActions && moreOpen && (
              <div className={styles.completeMenuDropdown} role="menu">
                {onNextPuzzle && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeMenuItem}
                    onClick={() => {
                      setMoreOpen(false);
                      onNextPuzzle();
                    }}
                  >
                    <ImagePlus size={18} aria-hidden />
                    New Puzzle
                  </button>
                )}

                {canReplay && onReplayClick && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeMenuItem}
                    onClick={() =>
                      void runBusyAction("replay", async () => {
                        setMoreOpen(false);
                        await onReplayClick();
                      })
                    }
                    disabled={busyAction === "replay"}
                  >
                    <Film size={18} aria-hidden />
                    {busyAction === "replay" ? "Opening Replay..." : "Replay Solve"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {hasShareOptions && (
          <div className={styles.completeMenuWrap} ref={shareRef}>
            <button
              type="button"
              className={styles.completeMenuTrigger}
              onClick={() => {
                setShareOpen((o) => !o);
                setMoreOpen(false);
              }}
              aria-expanded={shareOpen}
              aria-haspopup={isMobileActions ? "dialog" : "true"}
              aria-label="Share results"
            >
              <Share2 size={18} aria-hidden />
              Share Results
              <ChevronDown
                size={16}
                className={shareOpen ? styles.completeMenuChevronOpen : ""}
                aria-hidden
              />
            </button>

            {!isMobileActions && shareOpen && (
              <div className={styles.completeMenuDropdown} role="menu">
                {(onShareChallenge || onCopyChallenge) && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeMenuItem}
                    onClick={() => void runBusyAction("challenge", handleChallenge)}
                    disabled={busyAction === "challenge"}
                  >
                    <Swords size={18} aria-hidden />
                    {busyAction === "challenge" ? "Opening Share..." : "Challenge Friend"}
                  </button>
                )}

                {(onShareProgress || onCopyProgress) && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.completeMenuItem}
                    onClick={handleShareResult}
                  >
                    <Share2 size={18} aria-hidden />
                    Share Result
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <CompletionOverlayShareMenu
        shareMenuOpen={args.shareMenuOpen}
        setShareMenuOpen={args.setShareMenuOpen}
        shareRef={args.shareRef}
        shareTriggerRef={args.shareTriggerRef}
        dropdownPosition={args.dropdownPosition}
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
        shareProgressText={args.shareProgressText}
        shareChallengeText={args.shareChallengeText}
        completionData={completionData}
        hideTrigger
      />

      <AppModal
        isOpen={moreDialogOpen}
        onClose={() => setMoreOpen(false)}
        title="More Options"
        subtitle="Keep going or review this solve."
        size="wide"
        bodyClassName={styles.completeActionSheetBody}
      >
        <div className={styles.completeActionSheet}>
          {onNextPuzzle && (
            <button
              type="button"
              className={styles.completeActionSheetItem}
              onClick={() => {
                setMoreOpen(false);
                onNextPuzzle();
              }}
            >
              <ImagePlus size={18} aria-hidden />
              New Puzzle
            </button>
          )}
          {canReplay && onReplayClick && (
            <button
              type="button"
              className={styles.completeActionSheetItem}
              onClick={() =>
                void runBusyAction("replay", async () => {
                  setMoreOpen(false);
                  await onReplayClick();
                })
              }
              disabled={busyAction === "replay"}
            >
              <Film size={18} aria-hidden />
              {busyAction === "replay" ? "Opening Replay..." : "Replay Solve"}
            </button>
          )}
        </div>
      </AppModal>

      <AppModal
        isOpen={shareDialogOpen}
        onClose={() => setShareOpen(false)}
        title="Share Results"
        subtitle="Share your run or challenge a friend."
        size="wide"
        bodyClassName={styles.completeActionSheetBody}
      >
        <div className={styles.completeActionSheet}>
          {(onShareChallenge || onCopyChallenge) && (
            <button
              type="button"
              className={styles.completeActionSheetItem}
              onClick={() => void runBusyAction("challenge", handleChallenge)}
              disabled={busyAction === "challenge"}
            >
              <Swords size={18} aria-hidden />
              {busyAction === "challenge" ? "Opening Share..." : "Challenge Friend"}
            </button>
          )}
          {(onShareProgress || onCopyProgress) && (
            <button
              type="button"
              className={styles.completeActionSheetItem}
              onClick={() => {
                setShareOpen(false);
                handleShareResult();
              }}
            >
              <Share2 size={18} aria-hidden />
              Share Result
            </button>
          )}
        </div>
      </AppModal>
    </section>
  );
}
