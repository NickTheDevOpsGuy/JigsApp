/**
 * ReplayBar – playback controls when replaying the solve (play/pause, speed, progress, close).
 */
import React from "react";
import { Play, Pause, X } from "lucide-react";
import { formatTime } from "../playUtils";
import styles from "./ReplayBar.module.css";

const SPEEDS = [1, 2, 4, 10] as const;

interface ReplayBarProps {
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
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
          onClick={isPaused ? onPlay : onPause}
          aria-label={isPaused ? "Resume replay" : "Pause replay"}
        >
          {isPaused ? <Play size={22} aria-hidden /> : <Pause size={22} aria-hidden />}
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
        className={styles.replayBarBtn}
        onClick={onClose}
        aria-label="Close replay"
      >
        <X size={22} aria-hidden />
      </button>
    </div>
  );
}
