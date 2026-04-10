/**
 * Replay Solve modal – focused replay overlay with one board stage,
 * one attached control dock, and a single clear dismiss action.
 *
 * On desktop: cutout mode — the live canvas shows through a hole in the backdrop.
 * On mobile (< 640px): full-screen modal — clean card with completion image + controls.
 * The canvas is still playing back behind the modal on mobile; we just show the image
 * as a poster so the UI looks polished rather than showing a dark empty board.
 */
import React, { useEffect, useReducer, useRef, useState } from "react";
import { Trophy, X } from "lucide-react";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import baseStyles from "@/screens/Play/components/replay/ReplaySolveModal.module.css";
import controlStyles from "@/screens/Play/components/replay/ReplaySolveModal.controls.module.css";
import { ReplaySolveModalControls } from "./ReplaySolveModalControls";
import { AppModal } from "@/components/AppModal";
import {
  invokeMaybeAsync,
  invokeMaybeAsyncIndex,
  type ReplaySeekCb,
  type ReplaySpeedCb,
  type ReplayVoidCb,
} from "@/screens/Play/components/replay/replayInvoke";

const styles = { ...baseStyles, ...controlStyles };

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
  completionImageUrl,
  boardRect,
  moveCount,
  packRemainingLabel,
}: ReplaySolveModalProps) {
  // On mobile (< 640px) always use the modal path — the cutout looks terrible on small screens.
  const [isMobileVw, setIsMobileVw] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobileVw(e.matches);
    setIsMobileVw(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Only use cutout on desktop where the board is large and the UI has room
  const useCutout =
    !isMobileVw && Boolean(boardRect && boardRect.width > 0 && boardRect.height > 0);

  const progressPct =
    totalSnapshots > 1 ? (currentIndex / Math.max(1, totalSnapshots - 1)) * 100 : 0;
  const effectiveSpeed = speedExplicitlyChosen ? speed : 1;
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
        invokeMaybeAsync(onClose);
      }
      if (e.key === " ") {
        e.preventDefault();
        if (isPaused) invokeMaybeAsync(onPlay);
        else invokeMaybeAsync(onPause);
      }
      if (onSeek && totalSnapshots > 1) {
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
  }, [onClose, isPaused, onPlay, onPause, onSeek, totalSnapshots, currentIndex]);

  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.target === e.currentTarget) invokeMaybeAsync(onClose);
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
      effectiveSpeed={effectiveSpeed}
      onSpeedChange={onSpeedChange}
      currentIndex={currentIndex}
      totalSnapshots={totalSnapshots}
      elapsedSeconds={elapsedSeconds}
      totalSeconds={totalSeconds}
      onSeek={onSeek}
      progressPct={progressPct}
    />
  );

  // ─── Mobile: clean full-screen modal ────────────────────────────────────────
  if (!useCutout) {
    const showImage = Boolean(completionImageUrl && !imageError);
    return (
      <AppModal
        isOpen
        onClose={onClose}
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
              onClick={() => invokeMaybeAsync(onClose)}
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
    const maxShell = Math.max(0, viewWidth - 2 * safeEdge);
    const shellWidth = Math.min(maxShell, width + dockInsetPx * 2);
    const shellLeft = Math.min(
      viewLeft + viewWidth - shellWidth - safeEdge,
      Math.max(viewLeft + safeEdge, left - dockInsetPx),
    );
    const headerGap = 12;
    const panelBottom = viewTop + viewHeight;

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
          onClick={() => invokeMaybeAsync(onClose)}
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
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
        />
        <div
          data-cutout-panel
          style={{ top, left: 0, width: Math.max(0, left), height }}
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
        />
        <div
          data-cutout-panel
          style={{ top, left: right, right: 0, height }}
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
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
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
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
            top,
            left,
            width,
            transform: `translateY(calc(-100% - ${headerGap}px))`,
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
          style={{ left: shellLeft, width: shellWidth, top: bottom + 16 }}
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
