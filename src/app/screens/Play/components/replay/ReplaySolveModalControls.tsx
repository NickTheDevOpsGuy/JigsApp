/**
 * Seek bar, play/pause/speed controls, and nav (Back to Results | Next Puzzle) for ReplaySolveModal.
 */
import React, { useCallback, useRef, useState } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import controlStyles from "@/screens/Play/components/replay/ReplaySolveModal.controls.module.css";
import baseStyles from "@/screens/Play/components/replay/ReplaySolveModal.module.css";

const styles = { ...baseStyles, ...controlStyles };

export interface ReplaySolveModalControlsProps {
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onSkipBack15?: () => void;
  onSkipForward15?: () => void;
  effectiveSpeed: number;
  onSpeedChange: (speed: number) => void;
  currentIndex: number;
  totalSnapshots: number;
  elapsedSeconds: number;
  totalSeconds: number;
  onSeek?: (index: number) => void;
  progressPct: number;
  onBackToResults?: () => void;
  onClose: () => void;
  onNextPuzzle?: () => void;
}

const SPEEDS = [1, 2, 3] as const;

function stopProp(e: React.PointerEvent) {
  e.stopPropagation();
}

export function ReplaySolveModalControls({
  isPaused,
  onPlay,
  onPause,
  onRewind,
  onFastForward,
  onSkipBack15,
  onSkipForward15,
  effectiveSpeed,
  onSpeedChange,
  currentIndex,
  totalSnapshots,
  elapsedSeconds,
  totalSeconds,
  onSeek,
  progressPct,
  onBackToResults,
  onClose,
  onNextPuzzle,
}: ReplaySolveModalControlsProps) {
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(effectiveSpeed as 1 | 2 | 3);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onSpeedChange(next);
  };

  const handlePlayPause = () => {
    if (isPaused) onPlay();
    else onPause();
  };

  const seekBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getIndexFromClientX = useCallback(
    (clientX: number) => {
      const el = seekBarRef.current;
      if (!el) return currentIndex;
      const rect = el.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      return Math.min(
        totalSnapshots - 1,
        Math.max(0, Math.round(x * (totalSnapshots - 1))),
      );
    },
    [totalSnapshots, currentIndex],
  );

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!onSeek || totalSnapshots <= 1) return;
      onSeek(getIndexFromClientX(clientX));
    },
    [onSeek, totalSnapshots, getIndexFromClientX],
  );

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || totalSnapshots <= 1) return;
    handleSeek(e.clientX);
  };

  const handleSeekBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onSeek || totalSnapshots <= 1) return;
    stopProp(e);
    setIsDragging(true);
    seekBarRef.current?.setPointerCapture(e.pointerId);
    handleSeek(e.clientX);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => handleSeek(e.clientX),
    [handleSeek],
  );
  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  React.useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleSeekBarKeyDown = (e: React.KeyboardEvent) => {
    if (!onSeek || totalSnapshots <= 1) return;
    const maxIdx = totalSnapshots - 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onSeek(Math.max(0, currentIndex - 1));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onSeek(Math.min(maxIdx, currentIndex + 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onSeek(maxIdx);
    }
  };

  return (
    <>
      <div className={styles.seekRow}>
        <div className={styles.seekBarWrap}>
          <div
            ref={seekBarRef}
            className={`${styles.seekBar} ${isDragging ? styles.seekBarDragging : ""}`}
            role="slider"
            tabIndex={0}
            aria-valuenow={currentIndex}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, totalSnapshots - 1)}
            aria-label="Replay progress"
            onClick={handleSeekBarClick}
            onPointerDown={handleSeekBarPointerDown}
            onKeyDown={handleSeekBarKeyDown}
          >
            <div className={styles.seekFill} style={{ width: `${progressPct}%` }} />
            <div className={styles.seekHandle} style={{ left: `${progressPct}%` }} />
          </div>
          <span className={styles.seekTime} aria-live="polite">
            {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
          </span>
          <span className={styles.speedBadge} aria-hidden="true">
            {effectiveSpeed}x
          </span>
        </div>
      </div>

      <div className={styles.controlRow}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onRewind}
          onPointerDown={stopProp}
          aria-label="Restart from beginning"
          title="Restart"
        >
          <RotateCcw size={20} aria-hidden />
        </button>
        {onSkipBack15 && (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={onSkipBack15}
            onPointerDown={stopProp}
            aria-label="Back 5 seconds"
            title="Back 5s"
          >
            <SkipBack size={20} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className={`${styles.controlBtn} ${styles.controlBtnPlay} ${!isPaused ? styles.controlBtnActive : ""}`}
          onClick={handlePlayPause}
          onPointerDown={stopProp}
          aria-label={isPaused ? "Play" : "Pause"}
          title={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? (
            <Play size={22} fill="currentColor" aria-hidden />
          ) : (
            <Pause size={22} aria-hidden />
          )}
        </button>
        {onSkipForward15 && (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={onSkipForward15}
            onPointerDown={stopProp}
            aria-label="Forward 5 seconds"
            title="Forward 5s"
          >
            <SkipForward size={20} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onFastForward}
          onPointerDown={stopProp}
          aria-label="Go to end"
          title="End"
        >
          <RotateCw size={20} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.speedTrigger}
          onClick={cycleSpeed}
          onPointerDown={stopProp}
          aria-label={`Playback speed ${effectiveSpeed}x. Click to change.`}
          title="Speed"
        >
          {effectiveSpeed}x
        </button>
      </div>

      <div className={styles.navRow}>
        <button
          type="button"
          className={styles.navBtnSecondary}
          onClick={() => {
            if (onBackToResults) onBackToResults();
            else onClose();
          }}
          onPointerDown={stopProp}
        >
          <ChevronLeft size={18} aria-hidden />
          Back to Results
        </button>
        {onNextPuzzle && (
          <button
            type="button"
            className={styles.navBtnPrimary}
            onClick={() => {
              onClose();
              onNextPuzzle();
            }}
            onPointerDown={stopProp}
          >
            Next Puzzle
            <Play size={18} fill="currentColor" aria-hidden />
          </button>
        )}
      </div>
    </>
  );
}
