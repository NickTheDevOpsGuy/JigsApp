/**
 * ReplayBar – playback controls (<< >> rewind/ff, play/pause, time, progress, 1x 2x 3x, close).
 * Width and position match the board outer border when boardRect is provided.
 */
import React from "react";
import { Play, Pause, X, RotateCcw, RotateCw } from "lucide-react";
import { formatTime } from "../playUtils";
import styles from "./ReplayBar.module.css";
import { ReplayBarSpeedControls } from "./ReplayBarSpeedControls";
import { ReplayBarStepControls } from "./ReplayBarStepControls";

interface ReplayBarProps {
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  /** When false, no speed pill is shown as selected (user has not picked yet). */
  speedExplicitlyChosen?: boolean;
  currentIndex: number;
  totalSnapshots: number;
  elapsedSeconds: number;
  totalSeconds: number;
  onSeek?: (index: number) => void;
  onClose: () => void;
  /** Match board outer border: same width and horizontal position. */
  boardRect?: { left: number; width: number };
}

export function ReplayBar({
  isPaused,
  onPlay,
  onPause,
  onRewind,
  onFastForward,
  speed,
  onSpeedChange,
  speedExplicitlyChosen = false,
  currentIndex,
  totalSnapshots,
  elapsedSeconds,
  totalSeconds,
  onSeek,
  onClose,
  boardRect,
}: ReplayBarProps) {
  const progressPct =
    totalSnapshots > 1 ? (currentIndex / (totalSnapshots - 1)) * 100 : 0;
  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  const handlePlayPause = () => {
    if (isPaused) onPlay();
    else onPause();
  };

  const canStepBack = Boolean(onSeek && totalSnapshots > 1 && currentIndex > 0);
  const canStepForward = Boolean(
    onSeek && totalSnapshots > 1 && currentIndex < totalSnapshots - 1,
  );

  const barStyle =
    boardRect != null && boardRect.width > 0
      ? { left: boardRect.left, width: boardRect.width }
      : undefined;

  return (
    <div
      className={styles.replayBar}
      role="region"
      aria-label="Replay controls"
      onPointerDown={stopProp}
      style={barStyle}
    >
      <button
        type="button"
        className={styles.replayBarCloseBtn}
        onClick={onClose}
        onPointerDown={stopProp}
        aria-label="Close replay"
        title="Close replay"
      >
        <X size={20} aria-hidden />
      </button>

      <div className={styles.replayBarContent}>
        <div className={styles.replayBarRow}>
          <div className={styles.replayBarGroup}>
            <button
              type="button"
              className={styles.replayBarBtn}
              onClick={onRewind}
              onPointerDown={stopProp}
              aria-label="Rewind to start"
              title="Rewind to start"
            >
              <RotateCcw size={20} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.replayBarBtn}
              onPointerDown={(e) => {
                stopProp(e);
                e.preventDefault();
                handlePlayPause();
              }}
              aria-label={isPaused ? "Play" : "Pause"}
              title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? (
                <Play size={22} aria-hidden />
              ) : (
                <Pause size={22} aria-hidden />
              )}
            </button>
            <button
              type="button"
              className={styles.replayBarBtn}
              onClick={onFastForward}
              onPointerDown={stopProp}
              aria-label="Fast forward to end"
              title="Fast forward to end"
            >
              <RotateCw size={20} aria-hidden />
            </button>
          </div>

          <div className={styles.replayBarTimeGroup}>
            <span className={styles.replayBarTime} aria-live="polite">
              {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
            </span>
          </div>

          {!isPaused && (
            <ReplayBarSpeedControls
              speed={speed}
              speedExplicitlyChosen={speedExplicitlyChosen}
              onSpeedChange={onSpeedChange}
              stopProp={stopProp}
            />
          )}
        </div>

        <div className={styles.replayBarProgressSection}>
          <div
            className={styles.replayBarProgressBar}
            role="progressbar"
            aria-valuenow={currentIndex}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, totalSnapshots - 1)}
            aria-label="Replay progress"
          >
            <div
              className={styles.replayBarProgressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {onSeek && totalSnapshots > 1 && (
            <ReplayBarStepControls
              currentIndex={currentIndex}
              totalSnapshots={totalSnapshots}
              onSeek={onSeek}
              canStepBack={canStepBack}
              canStepForward={canStepForward}
              stopProp={stopProp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
