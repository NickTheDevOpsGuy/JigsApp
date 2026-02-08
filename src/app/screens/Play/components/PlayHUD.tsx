import React, { useEffect, useState } from "react";
import { Clock, Puzzle, Pause, Play } from "lucide-react";
import { Button } from "@/components/Button/Button";
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
  isPaused,
  isComplete,
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
      <Button
        size="sm"
        onClick={onTogglePause}
        disabled={isComplete}
        aria-label={isPaused ? "Resume puzzle" : "Pause puzzle"}
        aria-pressed={isPaused}
      >
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </Button>
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
