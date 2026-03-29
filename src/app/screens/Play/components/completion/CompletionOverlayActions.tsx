/**
 * Win screen: one full-width Options button; portalled menu positions below the trigger
 * when there is room, otherwise above (viewport + safe layout).
 */
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, Share2, Swords, Film, ImagePlus } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import type { UseCompletionOverlayDataResult } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  getLayoutViewportSize,
  getSafeAreaInsetsHorizontal,
  subscribeViewportLayoutChanges,
} from "@/utils/layoutViewport";

export function CompletionOverlayActions(args: {
  onShareProgress?: () => void;
  onCopyProgress?: () => void;
  onShareChallenge?: (challengeUrl?: string) => void;
  onCopyChallenge?: (challengeUrl?: string) => void;
  completionData: UseCompletionOverlayDataResult;
  canReplay: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
  nextPuzzleLabel?: string;
  isDaily?: boolean;
  focusReturnRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const {
    onShareProgress,
    onCopyProgress,
    onShareChallenge,
    onCopyChallenge,
    completionData,
    canReplay,
    onReplayClick,
    onNextPuzzle,
    nextPuzzleLabel = "Next Puzzle",
  } = args;

  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<
    "challenge" | "shareResult" | "dailyShare" | "replay" | null
  >(null);
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

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wrap = menuWrapRef.current;
        const btn = wrap?.querySelector("button");
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const gap = 8;
        const edgePad = 8;
        const { width: vw, height: vh } = getLayoutViewportSize();
        const { left: safeL, right: safeR } = getSafeAreaInsetsHorizontal();
        const maxMenuW = Math.min(
          r.width,
          Math.max(120, vw - safeL - safeR - edgePad * 2),
        );
        let left = r.left;
        const minLeft = safeL + edgePad;
        const maxLeft = vw - safeR - edgePad - maxMenuW;
        if (maxLeft >= minLeft) {
          left = Math.min(Math.max(left, minLeft), maxLeft);
        }
        const maxH = Math.min(vh * 0.5, 320);
        const spaceAbove = r.top;
        const spaceBelow = vh - r.bottom;
        const minComfortableMenuSpace = 160;
        if (spaceBelow >= minComfortableMenuSpace || spaceBelow >= spaceAbove) {
          setMenuPlacement({
            mode: "below",
            top: r.bottom + gap,
            left,
            width: maxMenuW,
            maxHeight: Math.min(maxH, spaceBelow - gap),
          });
        } else {
          setMenuPlacement({
            mode: "above",
            bottom: vh - r.top + gap,
            left,
            width: maxMenuW,
            maxHeight: Math.min(maxH, spaceAbove - gap),
          });
        }
      });
    };

    measure();
    const unsubViewport = subscribeViewportLayoutChanges(measure);
    const wrap = menuWrapRef.current;
    const ro = wrap ? new ResizeObserver(measure) : null;
    if (wrap && ro) ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      unsubViewport();
      ro?.disconnect();
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

  /** Close menu on Escape first; win overlay listens on bubble — capture runs first. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [menuOpen]);

  const runBusyAction = async (
    kind: "challenge" | "shareResult" | "dailyShare" | "replay",
    action: () => Promise<void> | void,
  ) => {
    setBusyAction(kind);
    try {
      await action();
    } finally {
      setBusyAction(null);
    }
  };

  const shareMenuBusy =
    completionData.isGenerating ||
    busyAction === "challenge" ||
    busyAction === "shareResult" ||
    busyAction === "dailyShare";

  const handleChallenge = () => {
    setMenuOpen(false);
    void runBusyAction("challenge", async () => {
      await completionData.handleShareChallengeCard();
    });
  };

  const handleShareResult = () => {
    setMenuOpen(false);
    void runBusyAction("shareResult", async () => {
      await completionData.handleShareResultCard();
    });
  };

  const handleDailyShare = () => {
    setMenuOpen(false);
    void runBusyAction("dailyShare", async () => {
      await completionData.handleNativeDailyShare();
    });
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
            aria-label={isMobileActions ? "Next puzzle" : nextPuzzleLabel}
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
            disabled={busyAction === "replay" || completionData.isGenerating}
            aria-label={
              completionData.isGenerating
                ? "Wait for share to finish"
                : busyAction === "replay"
                  ? "Opening replay"
                  : "Replay solve"
            }
            title={
              completionData.isGenerating
                ? "Wait for share to finish"
                : busyAction === "replay"
                  ? "Opening replay"
                  : "Replay solve"
            }
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
            disabled={shareMenuBusy || busyAction === "replay"}
            aria-label={
              busyAction === "challenge"
                ? "Preparing share"
                : completionData.isGenerating
                  ? "Preparing share"
                  : "Challenge a friend"
            }
            title={
              busyAction === "challenge"
                ? "Preparing share…"
                : completionData.isGenerating
                  ? "Preparing share…"
                  : "Challenge a friend"
            }
          >
            <Swords size={18} aria-hidden />
            {busyAction === "challenge"
              ? "Sharing…"
              : isMobileActions
                ? "Challenge a friend"
                : "Challenge Friend"}
          </button>
        )}

        {(onShareProgress || onCopyProgress) && (
          <button
            type="button"
            role="menuitem"
            className={styles.completeMenuItem}
            onClick={() => void handleShareResult()}
            disabled={shareMenuBusy || busyAction === "replay"}
            aria-label={
              busyAction === "shareResult"
                ? "Preparing share"
                : completionData.isGenerating
                  ? "Preparing share"
                  : "Share your result"
            }
            title={
              busyAction === "shareResult"
                ? "Preparing share…"
                : completionData.isGenerating
                  ? "Preparing share…"
                  : "Share your result"
            }
          >
            <Share2 size={18} aria-hidden />
            {busyAction === "shareResult"
              ? "Sharing…"
              : isMobileActions
                ? "Share your result"
                : "Share Result"}
          </button>
        )}

        {args.isDaily && (
          <button
            type="button"
            role="menuitem"
            className={styles.completeMenuItem}
            onClick={() => void handleDailyShare()}
            disabled={shareMenuBusy || busyAction === "replay"}
            aria-label={
              busyAction === "dailyShare"
                ? "Sharing daily summary"
                : "Daily share summary"
            }
            title={
              busyAction === "dailyShare" ? "Sharing…" : "Wordle-style daily summary"
            }
          >
            <Calendar size={18} aria-hidden />
            {busyAction === "dailyShare" ? "Sharing…" : "Daily Share"}
          </button>
        )}
      </div>,
      document.body,
    );

  if (!hasAnyOptions) {
    return <section className={styles.completeActionsPhased} aria-label="Actions" />;
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
    </section>
  );
}
