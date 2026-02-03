import React from "react";
import { Clock, Puzzle, Pause, Play } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";
import { formatTime } from "../playUtils";
import type { TimeMode } from "../timeMode";

interface PlayHUDProps {
  elapsedSeconds: number;
  piecesLeft: number;
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
      <Button size="sm" onClick={onTogglePause} disabled={isComplete}>
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </Button>
      <div className={styles.hudPill}>
        <Puzzle size={14} />
        <span>{piecesLeft} left</span>
      </div>
    </div>
  );
}
