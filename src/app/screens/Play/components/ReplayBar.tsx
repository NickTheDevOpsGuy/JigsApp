/**
 * ReplayBar – playback controls when replaying the solve (rewind, play/pause, fast forward, stop, close).
 */
import React from "react";
import { Play, Pause, X, RotateCcw, RotateCw, Square } from "lucide-react";
import { formatTime } from "../playUtils";
import styles from "./ReplayBar.module.css";

const SPEEDS = [1, 2, 4, 10] as const;

interface ReplayBarProps {
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onStop: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentIndex: number;
  totalSnapshots: number;
  elapsedSeconds: number;
  onClose: () => void;
}

export function ReplayBar({
  isPaused,
  onPlay,
  onPause,
  onRewind,
  onFastForward,
  onStop,
  speed,
  onSpeedChange,
  currentIndex,
  totalSnapshots,
  elapsedSeconds,
  onClose,
}: ReplayBarProps) {
  const progress = totalSnapshots > 1 ? (currentIndex / (totalSnapshots - 1)) * 100 : 0;

  return (
    <div className={styles.replayBar} role="region" aria-label="Replay controls">
      <div className={styles.replayBarLeft}>
        <button
          type="button"
          className={styles.replayBarBtn}
          onClick={onRewind}
          aria-label="Rewind to start"
        >
          <RotateCcw size={20} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.replayBarBtn}
          onClick={isPaused ? onPlay : onPause}
          aria-label={isPaused ? "Resume replay" : "Pause replay"}
        >
          {isPaused ? <Play size={22} aria-hidden /> : <Pause size={22} aria-hidden />}
        </button>
        <button
          type="button"
          className={styles.replayBarBtn}
          onClick={onFastForward}
          aria-label="Fast forward to end"
        >
          <RotateCw size={20} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.replayBarBtn}
          onClick={onStop}
          aria-label="Stop replay"
        >
          <Square size={18} aria-hidden />
        </button>
        <span className={styles.replayBarTime} aria-live="polite">
          {formatTime(elapsedSeconds)}
        </span>
        <div className={styles.replayBarSpeeds}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.replaySpeedBtn} ${speed === s ? styles.replaySpeedBtnActive : ""}`}
              onClick={() => onSpeedChange(s)}
              aria-label={`${s}x speed`}
              aria-pressed={speed === s}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      <div className={styles.replayBarProgressWrap}>
        <div
          className={styles.replayBarProgressFill}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentIndex}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, totalSnapshots - 1)}
          aria-label="Replay progress"
        />
      </div>
      <button
        type="button"
        className={styles.replayBarCloseBtn}
        onClick={onClose}
        aria-label="Close replay and return to win screen"
      >
        <X size={24} aria-hidden />
      </button>
    </div>
  );
}
