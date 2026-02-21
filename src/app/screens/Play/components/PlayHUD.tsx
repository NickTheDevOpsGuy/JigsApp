/**
 * PlayHUD – timer, pieces left, pause button (top bar center).
 */
import React, { useEffect, useState } from "react";
import { Clock, Pause, Puzzle } from "lucide-react";
import styles from "../PlayScreen.module.css";
import { formatTime } from "../playUtils";
import type { TimeMode } from "../timeMode";

interface PlayHUDProps {
  elapsedSeconds: number;
  piecesLeft: number;
  totalPieces: number;
  isPaused: boolean;
  isComplete: boolean;
  timeMode: TimeMode;
  countdownMinutes?: number;
  bestTimeSeconds?: number | null;
  onTogglePause: () => void;
}

export function PlayHUD({
  elapsedSeconds,
  piecesLeft,
  totalPieces,
  isPaused: _isPaused,
  isComplete: _isComplete,
  timeMode,
  countdownMinutes = 10,
  bestTimeSeconds,
  onTogglePause,
}: PlayHUDProps) {
  const showTimer = timeMode !== "relaxed";
  const isCountdown = timeMode === "countdown";
  const countdownTotal = countdownMinutes * 60;
  const isLowTime = isCountdown && elapsedSeconds > 0 && elapsedSeconds <= 60;
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 300);
    return () => clearTimeout(t);
  }, [piecesLeft]);

  return (
    <div className={styles.hud}>
      {showTimer && (
        <div className={`${styles.hudPillTimer} ${isLowTime ? styles.timerLow : ""}`}>
          <Clock size={14} />
          <span className={styles.timerText}>{formatTime(elapsedSeconds)}</span>
          {isCountdown && (
            <span className={styles.timerSuffix}>/ {formatTime(countdownTotal)}</span>
          )}
          {timeMode === "best" && bestTimeSeconds != null && (
            <span className={styles.timerSuffix}>best {formatTime(bestTimeSeconds)}</span>
          )}
        </div>
      )}
      <button
        type="button"
        className={styles.hudPillPause}
        onClick={onTogglePause}
        aria-label="Pause"
        title="Pause"
      >
        <Pause size={14} />
      </button>
      <div
        className={`${styles.hudPill} ${bounce ? styles.hudPillBounce : ""}`}
        aria-label={`${piecesLeft} of ${totalPieces} pieces remaining`}
        role="status"
      >
        <Puzzle size={14} />
        <span>
          {piecesLeft} / {totalPieces}
        </span>
      </div>
    </div>
  );
}
