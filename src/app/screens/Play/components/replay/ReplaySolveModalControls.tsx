/**
 * Seek bar, play/pause/speed controls, and nav (Back to Results | Next Puzzle) for ReplaySolveModal.
 */
import React from "react";
import {
  Play,
  Pause,
  ChevronDown,
  ChevronLeft,
  SkipBack,
  SkipForward,
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

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || totalSnapshots <= 1) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const index = Math.min(
      totalSnapshots - 1,
      Math.max(0, Math.round(x * (totalSnapshots - 1))),
    );
    onSeek(index);
  };

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
            className={styles.seekBar}
            role="slider"
            tabIndex={0}
            aria-valuenow={currentIndex}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, totalSnapshots - 1)}
            aria-label="Replay progress"
            onClick={handleSeekBarClick}
            onPointerDown={stopProp}
            onKeyDown={handleSeekBarKeyDown}
          >
            <div className={styles.seekFill} style={{ width: `${progressPct}%` }} />
            <div className={styles.seekHandle} style={{ left: `${progressPct}%` }} />
          </div>
          <span className={styles.seekTime} aria-live="polite">
            {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
          </span>
        </div>
      </div>

      <div className={styles.controlRow}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onRewind}
          onPointerDown={stopProp}
          aria-label="Rewind to start"
          title="Rewind"
        >
          &lt;&lt;
        </button>
        {onSkipBack15 && (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={onSkipBack15}
            onPointerDown={stopProp}
            aria-label="Back 5 seconds"
            title="Back 5 seconds"
          >
            <SkipBack size={20} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className={`${styles.controlBtn} ${!isPaused ? styles.controlBtnActive : ""}`}
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
            title="Forward 5 seconds"
          >
            <SkipForward size={20} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onFastForward}
          onPointerDown={stopProp}
          aria-label="Fast forward to end"
          title="Fast forward"
        >
          &gt;&gt;
        </button>
        <button
          type="button"
          className={styles.speedTrigger}
          onClick={cycleSpeed}
          onPointerDown={stopProp}
          aria-label={`Playback speed ${effectiveSpeed}x. Click to change.`}
          title="Click to cycle speed (1x → 2x → 3x)"
        >
          Speed {effectiveSpeed}x
          <ChevronDown size={16} className={styles.speedChevron} aria-hidden />
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
          <ChevronLeft size={20} aria-hidden />
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
