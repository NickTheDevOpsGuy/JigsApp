/**
 * Replay Solve modal – focused replay overlay with one board stage,
 * one attached control dock, and a single clear dismiss action.
 */
import React, { useEffect, useRef, useState } from "react";
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
  const useCutout = Boolean(boardRect && boardRect.width > 0 && boardRect.height > 0);
  const progressPct =
    totalSnapshots > 1 ? (currentIndex / Math.max(1, totalSnapshots - 1)) * 100 : 0;
  const effectiveSpeed = speedExplicitlyChosen ? speed : 1;
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

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
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, isPaused, onPlay, onPause, onSeek, totalSnapshots, currentIndex]);

  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  const showPuzzleImage = !useCutout && completionImageUrl && !imageError;

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.target === e.currentTarget) invokeMaybeAsync(onClose);
    }
  };

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

  if (useCutout && boardRect) {
    const { top, left, width, height } = boardRect;
    const right = left + width;
    const bottom = top + height;
    const cutoutRadius = 20;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : width + 24;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : bottom + 220;
    const dockInsetPx = 8;
    const shellWidth = Math.min(viewportWidth - 24, width + dockInsetPx * 2);
    const shellLeft = Math.min(
      viewportWidth - shellWidth - 12,
      Math.max(12, left - dockInsetPx),
    );
    /* Tight gap under board chrome; dock has its own inner padding */
    const controlsGapPx = 3;
    const controlsTopPx = bottom + controlsGapPx;
    const controlsMaxHeight = Math.max(
      120,
      viewportHeight - controlsTopPx - 12 - Number.parseFloat("0"),
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
          style={{ top: 0, left: 0, right: 0, height: top }}
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
        />
        <div
          data-cutout-panel
          style={{ top, left: 0, width: left, height }}
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
        />
        <div
          data-cutout-panel
          style={{ top, left: right, right: 0, height }}
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
        />
        <div
          data-cutout-panel
          style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
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
        {/* Title + stats sit above the board (not on the canvas) with a small gap */}
        <div
          className={styles.cutoutBoardHeaderWrap}
          style={{
            top,
            left,
            width,
            transform: "translateY(calc(-100% - 10px))",
          }}
          onPointerDown={stopProp}
        >
          {boardHeader}
        </div>
        <div
          className={styles.stageFrame}
          style={{ top, left, width, height }}
          onPointerDown={stopProp}
        />
        <div
          className={styles.controlDock}
          style={{
            left: shellLeft,
            width: shellWidth,
            top: controlsTopPx,
            maxHeight: `calc(${controlsMaxHeight}px - env(safe-area-inset-bottom, 0px))`,
          }}
          onPointerDown={stopProp}
        >
          <div className={`${styles.controlDockInner} ${styles.controlDockInnerCutout}`}>
            {seekAndControls}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppModal isOpen onClose={onClose} surface="bare" size="xl" showCloseButton={false}>
      <div className={styles.modalSurface} onPointerDown={stopProp}>
        <div className={styles.modalStageStack}>
          <div className={styles.modalStageFrame}>
            {boardHeader}
            <div className={styles.puzzleArea}>
              {showPuzzleImage ? (
                <img
                  src={completionImageUrl ?? ""}
                  alt="Puzzle completion"
                  className={styles.puzzleImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={styles.puzzlePlaceholder}>Puzzle view</div>
              )}
            </div>
          </div>
          <div className={styles.controlDockInner}>{seekAndControls}</div>
        </div>
      </div>
    </AppModal>
  );
}
