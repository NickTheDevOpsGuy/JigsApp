/**
 * Replay Solve modal – focused replay overlay with one board stage,
 * one attached control dock, and a single clear dismiss action.
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
  const useCutout = Boolean(boardRect && boardRect.width > 0 && boardRect.height > 0);
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

    // Use the visual viewport dimensions so position:fixed elements align correctly
    // on Android Chrome (where the layout viewport != visual viewport during scroll/zoom).
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const viewWidth =
      vv?.width ?? (typeof window !== "undefined" ? window.innerWidth : 375);
    const viewHeight =
      vv?.height ?? (typeof window !== "undefined" ? window.innerHeight : 667);

    // Corner radius should match the board's actual CSS radius (16px mobile, 20px desktop).
    const isMobileVw = viewWidth < 640;
    const cutoutRadius = isMobileVw ? 16 : 20;

    // Dock: hug the board width, clamp to viewport with safe-area padding.
    const safeEdge = isMobileVw ? 8 : 12;
    const dockInsetPx = isMobileVw ? 0 : 8;
    const maxShell = Math.max(0, viewWidth - 2 * safeEdge);
    const shellWidth = Math.min(maxShell, width + dockInsetPx * 2);
    const shellLeft = Math.min(
      viewWidth - shellWidth - safeEdge,
      Math.max(safeEdge, left - dockInsetPx),
    );

    // Header gap above the board: tighter on mobile.
    const headerGap = isMobileVw ? 6 : 12;

    // Bottom panel: covers from bottom of board to bottom of visual viewport.
    const panelBottom = viewHeight;

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
        {/* Four panels that fill the screen around the board cutout */}
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
            minHeight: Math.max(0, panelBottom - bottom),
          }}
          onPointerDown={(e) => e.target === e.currentTarget && invokeMaybeAsync(onClose)}
        />

        {/* Corner masks round the cutout edges to match the board border-radius */}
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

        {/* Title + stats card above the board */}
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

        {/* Glowing frame that sits exactly over the board */}
        <div
          className={styles.stageFrame}
          style={{
            top,
            left,
            width,
            height,
            borderRadius: cutoutRadius,
          }}
          onPointerDown={stopProp}
        />

        {/* Controls dock below the board */}
        <div
          className={styles.controlDock}
          style={{
            left: shellLeft,
            width: shellWidth,
            top: bottom + (isMobileVw ? 10 : 16),
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
