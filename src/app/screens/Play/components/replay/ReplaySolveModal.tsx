/**
 * Replay Solve modal – full-screen overlay matching the "Replay Solve" design:
 * dark cosmic backdrop, modal with header (clapperboard, title, close), subtitle,
 * puzzle area, seek bar with time, control row (<< 5s Play 5s >> Speed 1x), nav (Back to Results | Next Puzzle).
 */
import React, { useEffect, useRef, useState } from "react";
import { Clapperboard, X } from "lucide-react";
import baseStyles from "@/screens/Play/components/replay/ReplaySolveModal.module.css";
import controlStyles from "@/screens/Play/components/replay/ReplaySolveModal.controls.module.css";
import { ReplaySolveModalControls } from "./ReplaySolveModalControls";
import { AppModal } from "@/components/AppModal";

const styles = { ...baseStyles, ...controlStyles };

export interface ReplaySolveModalProps {
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onSkipBack15?: () => void;
  onSkipForward15?: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  speedExplicitlyChosen?: boolean;
  currentIndex: number;
  totalSnapshots: number;
  elapsedSeconds: number;
  totalSeconds: number;
  onSeek?: (index: number) => void;
  onClose: () => void;
  /** Optional completion/snapshot image when no board cutout (fallback only) */
  completionImageUrl?: string | null;
  /** When set, backdrop has a cutout so the live canvas shows through for playback */
  boardRect?: { top: number; left: number; width: number; height: number } | null;
  onBackToResults?: () => void;
  onNextPuzzle?: () => void;
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
  onBackToResults,
  onNextPuzzle,
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
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  const showPuzzleImage = !useCutout && completionImageUrl && !imageError;

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.target === e.currentTarget) onClose();
    }
  };

  const closeButton = (
    <button
      ref={closeBtnRef}
      type="button"
      className={styles.closeBtn}
      onClick={onClose}
      onPointerDown={stopProp}
      aria-label="Close replay (Esc)"
      title="Close (Esc)"
    >
      <X size={18} aria-hidden />
    </button>
  );

  const headerBlock = (
    <header className={styles.header}>
      <div className={styles.headerLeft} aria-hidden />
      <div className={styles.headerCenter}>
        <Clapperboard size={20} className={styles.headerIcon} aria-hidden />
        <h2 id="replay-solve-title" className={styles.headerTitle}>
          Replay Solve
        </h2>
      </div>
      <div className={styles.headerRight}>{useCutout && closeButton}</div>
    </header>
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
      onBackToResults={onBackToResults}
      onClose={onClose}
      onNextPuzzle={onNextPuzzle}
    />
  );

  if (useCutout && boardRect) {
    const { top, left, width, height } = boardRect;
    const right = left + width;
    const bottom = top + height;
    /* Align controls with board; cutoutBottomBar has padding-left: 16px */
    const barPaddingLeft = 16;
    const controlsLeft = left - barPaddingLeft;
    /* Clamp width so controls stay usable on very narrow or very wide boards */
    const innerMinWidth = 280;
    const innerMaxWidth = typeof window !== "undefined" ? window.innerWidth - 32 : 520;
    const innerWidth = Math.min(innerMaxWidth, Math.max(innerMinWidth, width));
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
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        />
        <div
          data-cutout-panel
          style={{ top, left: 0, width: left, height }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        />
        <div
          data-cutout-panel
          style={{ top, left: right, right: 0, height }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        />
        <div
          data-cutout-panel
          style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        />
        <div className={styles.backdropCutoutContent}>
          <div className={styles.cutoutTopBar} onPointerDown={stopProp}>
            {headerBlock}
          </div>
          <div className={styles.cutoutBottomBar} onPointerDown={stopProp}>
            <div
              className={styles.cutoutBottomBarInner}
              style={{
                width: innerWidth,
                marginLeft: controlsLeft + (width - innerWidth) / 2,
              }}
            >
              <p id="replay-solve-subtitle" className={styles.subtitle}>
                Watch how the puzzle was completed
              </p>
              {seekAndControls}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Replay Solve"
      subtitle="Watch how the puzzle was completed."
      size="xl"
      closeLabel="Close replay"
    >
      <div className={styles.modal} onPointerDown={stopProp}>
        <div className={styles.puzzleAreaWrapper}>
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
        {seekAndControls}
      </div>
    </AppModal>
  );
}
