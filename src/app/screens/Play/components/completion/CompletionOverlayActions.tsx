/**
 * Win screen: one full-width Options button; popover menu on desktop (opens upward)
 * and mobile (opens downward) with Next, Replay, then Share actions.
 */
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Share2, Swords, Film, ImagePlus } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { CompletionOverlayShareMenu } from "@/screens/Play/components/completion/CompletionOverlayShareMenu";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function CompletionOverlayActions(args: {
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
  canReplay: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
  nextPuzzleLabel?: string;
  onClose: () => void;
  isDaily?: boolean;
  focusReturnRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const {
    puzzleShareUrl,
    ensureChallengeShareUrl,
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
    nextPuzzleLabel = "Next Puzzle",
    onClose: _onClose,
    grid,
  } = args;

  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"challenge" | "replay" | null>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const [menuPlacement, setMenuPlacement] = useState<
    | { mode: "below"; top: number; left: number; width: number; maxHeight: number }
    | { mode: "above"; bottom: number; left: number; width: number; maxHeight: number }
    | null
  >(null);
  const isMobileActions = useMediaQuery("(max-width: 600px)");

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuPlacement(null);
      return;
    }
    const measure = () => {
      const wrap = menuWrapRef.current;
      const btn = wrap?.querySelector("button");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const gap = 8;
      const maxH = isMobileActions
        ? Math.min(window.innerHeight * 0.45, 280)
        : Math.min(window.innerHeight * 0.62, 340);
      if (isMobileActions) {
        setMenuPlacement({
          mode: "below",
          top: r.bottom + gap,
          left: r.left,
          width: r.width,
          maxHeight: maxH,
        });
      } else {
        setMenuPlacement({
          mode: "above",
          bottom: window.innerHeight - r.top + gap,
          left: r.left,
          width: r.width,
          maxHeight: maxH,
        });
      }
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [menuOpen, isMobileActions]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuWrapRef.current?.contains(t)) return;
      if ((e.target as Element).closest?.("[data-complete-options-menu]")) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

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

  const handleChallenge = () => {
    setMenuOpen(false);
    completionData.openSharePopup("challenge");
  };

  const handleShareResult = () => {
    setMenuOpen(false);
    completionData.openSharePopup("result");
  };

  const hasGameActions = Boolean(onNextPuzzle || (canReplay && onReplayClick));
  const hasShareOptions = Boolean(
    onShareChallenge || onCopyChallenge || onShareProgress || onCopyProgress,
  );
  const hasAnyOptions = hasGameActions || hasShareOptions;
  const showShareHeading = hasShareOptions && hasGameActions;

  const optionsMenuPortal =
    menuOpen &&
    menuPlacement &&
    createPortal(
      <div
        data-complete-options-menu
        className={styles.completeMenuDropdownPortal}
        style={
          menuPlacement.mode === "below"
            ? {
                top: menuPlacement.top,
                left: menuPlacement.left,
                width: menuPlacement.width,
                maxHeight: menuPlacement.maxHeight,
              }
            : {
                bottom: menuPlacement.bottom,
                left: menuPlacement.left,
                width: menuPlacement.width,
                maxHeight: menuPlacement.maxHeight,
              }
        }
        role="menu"
      >
        {onNextPuzzle && (
          <button
            type="button"
            role="menuitem"
            className={styles.completeMenuItem}
            onClick={() => {
              setMenuOpen(false);
              onNextPuzzle();
            }}
            title={nextPuzzleLabel}
          >
            <ImagePlus size={18} aria-hidden />
            {isMobileActions ? "Next puzzle" : nextPuzzleLabel}
          </button>
        )}

        {canReplay && onReplayClick && (
          <button
            type="button"
            role="menuitem"
            className={styles.completeMenuItem}
            onClick={() =>
              void runBusyAction("replay", async () => {
                setMenuOpen(false);
                await onReplayClick();
              })
            }
            disabled={busyAction === "replay"}
            title={busyAction === "replay" ? "Opening replay" : "Replay solve"}
          >
            <Film size={18} aria-hidden />
            {busyAction === "replay"
              ? "Opening…"
              : isMobileActions
                ? "Replay solve"
                : "Replay Solve"}
          </button>
        )}

        {showShareHeading && (
          <hr
            className={styles.completeMenuDivider}
            role="separator"
            aria-orientation="horizontal"
          />
        )}

        {(onShareChallenge || onCopyChallenge) && (
          <button
            type="button"
            role="menuitem"
            className={styles.completeMenuItem}
            onClick={() => void handleChallenge()}
          >
            <Swords size={18} aria-hidden />
            {isMobileActions ? "Challenge a friend" : "Challenge Friend"}
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
            {isMobileActions ? "Share your result" : "Share Result"}
          </button>
        )}
      </div>,
      document.body,
    );

  if (!hasAnyOptions) {
    return (
      <section className={styles.completeActionsPhased} aria-label="Actions">
        <CompletionOverlayShareMenu
          shareMenuOpen={args.shareMenuOpen}
          setShareMenuOpen={args.setShareMenuOpen}
          shareRef={args.shareRef}
          shareTriggerRef={args.shareTriggerRef}
          dropdownPosition={args.dropdownPosition}
          grid={grid}
          puzzleShareUrl={puzzleShareUrl}
          ensureChallengeShareUrl={ensureChallengeShareUrl}
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
          isDaily={args.isDaily}
          hideTrigger
        />
      </section>
    );
  }

  return (
    <section className={styles.completeActionsPhased} aria-label="Actions">
      <div className={styles.completeMenusRow}>
        <div className={styles.completeMenuWrap} ref={menuWrapRef}>
          <button
            ref={args.focusReturnRef as React.RefObject<HTMLButtonElement>}
            type="button"
            className={styles.completeOptionsTrigger}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Options: next puzzle, replay, share"
            title="Options"
          >
            <span className={styles.completeOptionsTriggerSpacer} aria-hidden />
            <span className={styles.completeOptionsTriggerLabel}>Options</span>
            <span className={styles.completeOptionsTriggerChevronWrap} aria-hidden>
              <ChevronDown
                size={18}
                className={menuOpen ? styles.completeMenuChevronOpen : ""}
              />
            </span>
          </button>
        </div>
      </div>

      {optionsMenuPortal}

      <CompletionOverlayShareMenu
        shareMenuOpen={args.shareMenuOpen}
        setShareMenuOpen={args.setShareMenuOpen}
        shareRef={args.shareRef}
        shareTriggerRef={args.shareTriggerRef}
        dropdownPosition={args.dropdownPosition}
        grid={grid}
        puzzleShareUrl={puzzleShareUrl}
        ensureChallengeShareUrl={ensureChallengeShareUrl}
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
        isDaily={args.isDaily}
        hideTrigger
      />
    </section>
  );
}
