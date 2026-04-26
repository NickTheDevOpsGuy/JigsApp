/**
 * Win screen: one full-width Options button; portalled menu positions below the trigger
 * when there is room, otherwise above (viewport + safe layout).
 */
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
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

type MenuPlacement =
  | { mode: "below"; top: number; left: number; width: number; maxHeight: number }
  | { mode: "above"; bottom: number; left: number; width: number; maxHeight: number };

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);
  const isMobileActions = useMediaQuery("(max-width: 600px)");

  const measureMenuPlacement = useCallback((triggerEl?: HTMLElement | null): boolean => {
    const btn =
      triggerEl ??
      triggerRef.current ??
      menuWrapRef.current?.querySelector<HTMLButtonElement>("button") ??
      null;
    if (!btn) return false;

    const r = btn.getBoundingClientRect();
    const gap = 8;
    const edgePad = 8;
    const { width: vw, height: vh } = getLayoutViewportSize();
    if (vw <= 0 || vh <= 0) return false;

    const { left: safeL, right: safeR } = getSafeAreaInsetsHorizontal();
    const availableWidth = Math.max(120, vw - safeL - safeR - edgePad * 2);
    const maxMenuW = Math.min(r.width > 1 ? r.width : 240, availableWidth);
    let left = r.left;
    const minLeft = safeL + edgePad;
    const maxLeft = vw - safeR - edgePad - maxMenuW;
    if (maxLeft >= minLeft) {
      left = Math.min(Math.max(left, minLeft), maxLeft);
    } else {
      left = minLeft;
    }

    const maxH = Math.min(vh * 0.5, 320);
    const fallbackMaxHeight = Math.max(120, Math.min(maxH, vh - edgePad * 2));
    const spaceAbove = r.top;
    const spaceBelow = vh - r.bottom;
    const minComfortableMenuSpace = 160;
    if (spaceBelow >= minComfortableMenuSpace || spaceBelow >= spaceAbove) {
      setMenuPlacement({
        mode: "below",
        top: r.bottom + gap,
        left,
        width: maxMenuW,
        maxHeight: Math.max(120, Math.min(maxH, spaceBelow - gap, fallbackMaxHeight)),
      });
    } else {
      setMenuPlacement({
        mode: "above",
        bottom: vh - r.top + gap,
        left,
        width: maxMenuW,
        maxHeight: Math.max(120, Math.min(maxH, spaceAbove - gap, fallbackMaxHeight)),
      });
    }

    return true;
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuPlacement(null);
      return;
    }

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measureMenuPlacement();
      });
    };

    measureMenuPlacement();
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
  }, [menuOpen, isMobileActions, measureMenuPlacement]);

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

  const hasPrimaryNext = Boolean(onNextPuzzle);
  const hasGameActions = Boolean(canReplay && onReplayClick);
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

  if (!hasAnyOptions && !hasPrimaryNext) {
    return <section className={styles.completeActionsPhased} aria-label="Actions" />;
  }

  return (
    <section className={styles.completeActionsPhased} aria-label="Actions">
      {onNextPuzzle && (
        <button
          type="button"
          className={styles.completePrimaryBtn}
          onClick={onNextPuzzle}
          aria-label={nextPuzzleLabel}
          title={nextPuzzleLabel}
        >
          <ImagePlus size={18} aria-hidden />
          {nextPuzzleLabel}
        </button>
      )}

      {hasAnyOptions && (
        <div className={styles.completeMenusRow}>
          <div className={styles.completeMenuWrap} ref={menuWrapRef}>
            <button
              ref={(el) => {
                triggerRef.current = el;
                if (args.focusReturnRef) {
                  (
                    args.focusReturnRef as React.MutableRefObject<HTMLButtonElement | null>
                  ).current = el;
                }
              }}
              type="button"
              className={styles.completeOptionsTrigger}
              onClick={(e) => {
                const nextOpen = !menuOpen;
                if (nextOpen) {
                  measureMenuPlacement(e.currentTarget);
                } else {
                  setMenuPlacement(null);
                }
                setMenuOpen(nextOpen);
              }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Options: replay and share"
              title="Options"
            >
              <span className={styles.completeOptionsTriggerSpacer} aria-hidden />
              <span className={styles.completeOptionsTriggerCopy}>
                <span className={styles.completeOptionsTriggerLabel}>Options</span>
                <span className={styles.completeOptionsTriggerHint}>
                  Replay, share, or challenge a friend
                </span>
              </span>
              <span className={styles.completeOptionsTriggerChevronWrap} aria-hidden>
                <ChevronDown
                  size={18}
                  className={menuOpen ? styles.completeMenuChevronOpen : ""}
                />
              </span>
            </button>
          </div>
        </div>
      )}

      {optionsMenuPortal}
    </section>
  );
}
