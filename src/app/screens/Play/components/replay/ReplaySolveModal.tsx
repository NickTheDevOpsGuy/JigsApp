/**
 * Replay Solve modal – focused replay overlay with one board stage,
 * one attached control dock, and a single clear dismiss action.
 *
 * When the board can be measured, the live canvas shows through a hole in the backdrop.
 * The static completion image is only a fallback for cases where the board rect is unavailable.
 */
import React, { useEffect, useReducer, useRef, useState } from "react";
import { Trophy, X } from "lucide-react";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import baseStyles from "@/screens/Play/components/replay/ReplaySolveModal.module.css";
import controlStyles from "@/screens/Play/components/replay/ReplaySolveModal.controls.module.css";
import { ReplaySolveModalControls } from "./ReplaySolveModalControls";
import { AppModal } from "@/components/AppModal";
import type { ReplaySnapshot } from "@/screens/Play/hooks/gameplay/useReplay";
import {
  invokeMaybeAsync,
  invokeMaybeAsyncIndex,
  type ReplaySeekCb,
  type ReplaySpeedCb,
  type ReplayVoidCb,
} from "@/screens/Play/components/replay/replayInvoke";

const styles = { ...baseStyles, ...controlStyles };

function eventTargetInsideReplaySeekSlider(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('[role="slider"][aria-label="Replay progress"]'))
  );
}

/** Space should activate the focused control (e.g. Close) instead of global play/pause. */
function keyboardTargetShouldReceiveSpaceFirst(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (
    tag === "BUTTON" ||
    tag === "A" ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  ) {
    return true;
  }
  const role = target.getAttribute("role");
  return role === "button" || role === "link";
}

export interface ReplaySolveModalProps {
  isPaused: boolean;
  onPlay: ReplayVoidCb;
  onPause: ReplayVoidCb;
  onRewind: ReplayVoidCb;
  onFastForward: ReplayVoidCb;
  onSkipBack15?: ReplayVoidCb;
  onSkipForward15?: ReplayVoidCb;
  speed: number;
  onSpeedChange: ReplaySpeedCb;
  speedExplicitlyChosen?: boolean;
  currentIndex: number;
  totalSnapshots: number;
  elapsedSeconds: number;
  totalSeconds: number;
  onSeek?: ReplaySeekCb;
  onClose: ReplayVoidCb;
  /** Optional completion/snapshot image when no board cutout (fallback only) */
  completionImageUrl?: string | null;
  /** When set, backdrop has a cutout so the live canvas shows through for playback */
  boardRect?: { top: number; left: number; width: number; height: number } | null;
  onBackToResults?: ReplayVoidCb;
  onNextPuzzle?: ReplayVoidCb;
  /** For result header: "26 moves" (optional) */
  moveCount?: number;
  /** Shown in top-right of cutout bar when in pack flow, e.g. "One more from this pack" */
  packRemainingLabel?: string | null;
  /** Data for saving / sharing replay as a JSON file */
  replayExport?: {
    snapshots: ReplaySnapshot[];
    puzzleKey: number | null;
    puzzleName?: string;
    totalSeconds: number;
  } | null;
  /** Toast / inline feedback after save or share */
  onReplayExportFeedback?: (message: string) => void;
}

export function ReplaySolveModal({
  isPaused,
  onPlay,
  onPause,
  onRewind,
  onFastForward,
  onSkipBack15,
  onSkipForward15,
  speed,
  onSpeedChange,
  speedExplicitlyChosen = false,
  currentIndex,
  totalSnapshots,
  elapsedSeconds,
  totalSeconds,
  onSeek,
  onClose,
  onBackToResults,
  completionImageUrl,
  boardRect,
  moveCount,
  packRemainingLabel,
  replayExport = null,
  onReplayExportFeedback,
}: ReplaySolveModalProps) {
  const handleClose = React.useCallback(() => {
    invokeMaybeAsync(onBackToResults ?? onClose);
  }, [onBackToResults, onClose]);
  const prefersSheetOnShortTouchViewport =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-height: 500px)").matches;
  const useCutout = Boolean(
    boardRect &&
    boardRect.width > 0 &&
    boardRect.height > 0 &&
    !prefersSheetOnShortTouchViewport,
  );

  const progressPct =
    totalSnapshots > 1 ? (currentIndex / Math.max(1, totalSnapshots - 1)) * 100 : 0;
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  const [, bumpViewportLayout] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!useCutout) return;
    const onLayout = () => {
      bumpViewportLayout();
    };
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onLayout);
    vv?.addEventListener("scroll", onLayout);
    window.addEventListener("resize", onLayout);
    return () => {
      vv?.removeEventListener("resize", onLayout);
      vv?.removeEventListener("scroll", onLayout);
      window.removeEventListener("resize", onLayout);
    };
  }, [useCutout]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === " ") {
        if (keyboardTargetShouldReceiveSpaceFirst(e.target)) return;
        e.preventDefault();
        if (isPaused) invokeMaybeAsync(onPlay);
        else invokeMaybeAsync(onPause);
        return;
      }
      if (onSeek && totalSnapshots > 1) {
        const isSeekKey =
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "Home" ||
          e.key === "End";
        if (isSeekKey && eventTargetInsideReplaySeekSlider(e.target)) return;
        const maxIdx = totalSnapshots - 1;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          invokeMaybeAsyncIndex(onSeek, Math.max(0, currentIndex - 1));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          invokeMaybeAsyncIndex(onSeek, Math.min(maxIdx, currentIndex + 1));
        } else if (e.key === "Home") {
          e.preventDefault();
          invokeMaybeAsyncIndex(onSeek, 0);
        } else if (e.key === "End") {
          e.preventDefault();
          invokeMaybeAsyncIndex(onSeek, maxIdx);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [handleClose, isPaused, onPlay, onPause, onSeek, totalSnapshots, currentIndex]);

  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.target === e.currentTarget) handleClose();
    }
  };

  const seekAndControls = (
    <ReplaySolveModalControls
      isPaused={isPaused}
      onPlay={onPlay}
      onPause={onPause}
      onRewind={onRewind}
      onFastForward={onFastForward}
      onSkipBack15={onSkipBack15}
      onSkipForward15={onSkipForward15}
      speed={speed}
      speedExplicitlyChosen={speedExplicitlyChosen}
      onSpeedChange={onSpeedChange}
      currentIndex={currentIndex}
      totalSnapshots={totalSnapshots}
      elapsedSeconds={elapsedSeconds}
      totalSeconds={totalSeconds}
      onSeek={onSeek}
      progressPct={progressPct}
      replayExport={replayExport}
      onExportFeedback={onReplayExportFeedback}
    />
  );

  // ─── Mobile: clean full-screen modal ────────────────────────────────────────
  if (!useCutout) {
    const showImage = Boolean(completionImageUrl && !imageError);
    return (
      <AppModal
        isOpen
        onClose={handleClose}
        surface="bare"
        size="xl"
        showCloseButton={false}
        closeOnEscape={false}
      >
        <div className={styles.mobileSheet} onPointerDown={stopProp}>
          {/* ── Header ── */}
          <div className={styles.mobileHeader}>
            <div className={styles.mobileHeaderInfo}>
              <h2 className={styles.mobileTitle}>Replay Solve</h2>
              <div className={styles.mobileSubtitle}>
                <Trophy size={14} className={styles.mobileTrophyIcon} aria-hidden />
                <span>Solved in {formatTime(totalSeconds)}</span>
                {typeof moveCount === "number" && (
                  <span className={styles.mobileMoves}>{moveCount} moves</span>
                )}
              </div>
            </div>
            {packRemainingLabel && (
              <span className={styles.mobilePackLabel}>{packRemainingLabel}</span>
            )}
            <button
              ref={closeBtnRef}
              type="button"
              className={styles.mobileCloseBtn}
              onClick={handleClose}
              onPointerDown={stopProp}
              aria-label="Close replay"
              title="Close"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {/* ── Puzzle image ── */}
          {showImage && (
            <div className={styles.mobilePuzzleWrap}>
              <img
                src={completionImageUrl ?? ""}
                alt="Completed puzzle"
                className={styles.mobilePuzzleImg}
                onError={() => setImageError(true)}
                draggable={false}
              />
              {/* Progress overlay on the image */}
              <div
                className={styles.mobileProgressOverlay}
                aria-label={`${Math.round(progressPct)}% through replay`}
              >
                <div
                  className={styles.mobileProgressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Controls ── */}
          <div className={styles.mobileControls}>{seekAndControls}</div>
        </div>
      </AppModal>
    );
  }

  // ─── Desktop: cutout mode ────────────────────────────────────────────────────
  if (useCutout && boardRect) {
    const { top, left, width, height } = boardRect;
    const right = left + width;
    const bottom = top + height;

    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const viewLeft = vv?.offsetLeft ?? 0;
    const viewTop = vv?.offsetTop ?? 0;
    const viewWidth =
      vv?.width ?? (typeof window !== "undefined" ? window.innerWidth : 1024);
    const viewHeight =
      vv?.height ?? (typeof window !== "undefined" ? window.innerHeight : 768);

    const cutoutRadius = 20;
    const safeEdge = 12;
    const dockInsetPx = 8;
    const estimatedDockHeight = 214;
    const minSideDockWidth = 288;
    const maxShell = Math.max(0, viewWidth - 2 * safeEdge);
    const shellWidth = Math.min(maxShell, width + dockInsetPx * 2);
    const shellLeft = Math.min(
      viewLeft + viewWidth - shellWidth - safeEdge,
      Math.max(viewLeft + safeEdge, left - dockInsetPx),
    );
    const isNarrowViewport = viewWidth <= 600;
    const headerGap = isNarrowViewport ? 10 : 12;
    const estimatedHeaderHeight = isNarrowViewport ? 62 : 82;
    const headerTop = Math.max(
      viewTop + safeEdge,
      top - estimatedHeaderHeight - headerGap,
    );
    const panelBottom = viewTop + viewHeight;
    const availableBelow = panelBottom - (bottom + 16) - safeEdge;
    const availableLeft = left - (viewLeft + safeEdge) - 12;
    const availableRight = viewLeft + viewWidth - right - safeEdge - 12;
    const preferredSideDockWidth = Math.min(
      360,
      Math.max(minSideDockWidth, Math.round(viewWidth * 0.28)),
    );
    const canUseSideDock =
      availableBelow < estimatedDockHeight &&
      viewWidth >= 900 &&
      Math.max(availableLeft, availableRight) >= minSideDockWidth;
    const useRightSideDock = availableRight >= Math.max(availableLeft, minSideDockWidth);
    const useSideDock =
      canUseSideDock && (useRightSideDock || availableLeft >= minSideDockWidth);
    const sideDockWidth = Math.min(
      preferredSideDockWidth,
      Math.max(0, useRightSideDock ? availableRight : availableLeft),
    );
    const compactDock =
      availableBelow < estimatedDockHeight + 28 ||
      (viewHeight <= 820 && viewWidth <= 1180);
    const dockTop = useSideDock
      ? Math.min(
          panelBottom - estimatedDockHeight - safeEdge,
          Math.max(
            viewTop + safeEdge,
            top + Math.max(12, (height - estimatedDockHeight) / 2),
          ),
        )
      : Math.min(
          panelBottom - estimatedDockHeight - safeEdge,
          Math.max(viewTop + safeEdge, bottom + 16),
        );
    const dockLeft = useSideDock
      ? useRightSideDock
        ? right + 12
        : left - sideDockWidth - 12
      : shellLeft;
    const dockWidth = useSideDock ? sideDockWidth : shellWidth;

    const boardHeader = (
      <div className={styles.boardHeader}>
        <div className={styles.boardHeaderMain}>
          <div className={styles.boardHeaderText}>
            <h2 id="replay-solve-title" className={styles.headerTitle}>
              Replay Solve
            </h2>
            {totalSeconds >= 0 && (
              <div id="replay-solve-subtitle" className={styles.resultHeader}>
                <span className={styles.resultTime}>
                  <Trophy size={16} className={styles.resultTimeIcon} aria-hidden />
                  Solved in {formatTime(totalSeconds)}
                </span>
                {typeof moveCount === "number" && (
                  <span className={styles.resultMoves}>
                    {moveCount} {moveCount === 1 ? "move" : "moves"}
                  </span>
                )}
              </div>
            )}
          </div>
          {packRemainingLabel && (
            <span className={styles.packRemainingLabel}>{packRemainingLabel}</span>
          )}
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          className={styles.boardCloseBtn}
          onClick={handleClose}
          onPointerDown={stopProp}
          aria-label="Close replay (Esc)"
          title="Close (Esc)"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    );

    return (
      <div
        className={styles.backdropCutout}
        role="dialog"
        aria-modal="true"
        aria-labelledby="replay-solve-title"
        aria-describedby="replay-solve-subtitle"
        tabIndex={-1}
        onKeyDown={handleBackdropKeyDown}
      >
        <div
          data-cutout-panel
          style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }}
          onPointerDown={(e) => e.target === e.currentTarget && handleClose()}
        />
        <div
          data-cutout-panel
          style={{ top, left: 0, width: Math.max(0, left), height }}
          onPointerDown={(e) => e.target === e.currentTarget && handleClose()}
        />
        <div
          data-cutout-panel
          style={{ top, left: right, right: 0, height }}
          onPointerDown={(e) => e.target === e.currentTarget && handleClose()}
        />
        <div
          data-cutout-panel
          style={{
            top: bottom,
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: panelBottom - bottom,
          }}
          onPointerDown={(e) => e.target === e.currentTarget && handleClose()}
        />

        <div
          className={`${styles.cutoutCornerMask} ${styles.cutoutCornerMaskTopLeft}`}
          style={{ top, left, width: cutoutRadius, height: cutoutRadius }}
          aria-hidden="true"
        />
        <div
          className={`${styles.cutoutCornerMask} ${styles.cutoutCornerMaskTopRight}`}
          style={{
            top,
            left: right - cutoutRadius,
            width: cutoutRadius,
            height: cutoutRadius,
          }}
          aria-hidden="true"
        />
        <div
          className={`${styles.cutoutCornerMask} ${styles.cutoutCornerMaskBottomLeft}`}
          style={{
            top: bottom - cutoutRadius,
            left,
            width: cutoutRadius,
            height: cutoutRadius,
          }}
          aria-hidden="true"
        />
        <div
          className={`${styles.cutoutCornerMask} ${styles.cutoutCornerMaskBottomRight}`}
          style={{
            top: bottom - cutoutRadius,
            left: right - cutoutRadius,
            width: cutoutRadius,
            height: cutoutRadius,
          }}
          aria-hidden="true"
        />

        <div
          className={styles.cutoutBoardHeaderWrap}
          style={{
            top: headerTop,
            left,
            width,
          }}
          onPointerDown={stopProp}
        >
          {boardHeader}
        </div>

        <div
          className={styles.stageFrame}
          style={{ top, left, width, height, borderRadius: cutoutRadius }}
          onPointerDown={stopProp}
        />

        <div
          className={styles.controlDock}
          data-replay-dock="true"
          data-dock-placement={useSideDock ? "side" : "bottom"}
          data-dock-compact={compactDock ? "true" : "false"}
          style={{ left: dockLeft, width: dockWidth, top: dockTop }}
          onPointerDown={stopProp}
        >
          <div className={`${styles.controlDockInner} ${styles.controlDockInnerCutout}`}>
            {seekAndControls}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
