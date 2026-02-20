/**
 * PlayHUD – timer, pieces left, pause button (top bar center).
 */
import React, { useEffect, useState } from "react";
import { Clock, Puzzle } from "lucide-react";
import styles from "../PlayScreen.module.css";
import { formatTime } from "../playUtils";
import type { TimeMode } from "../timeMode";

interface PlayHUDProps {
  elapsedSeconds: number;
  placedCount: number;
  totalPieces: number;
  isPaused: boolean;
  isComplete: boolean;
  timeMode: TimeMode;
  countdownMinutes?: number;
  bestTimeSeconds?: number | null;
  timeDecayScore?: number;
  timeAttackCombo?: number;
  timeDecayCombo?: number;
  onTogglePause: () => void;
}

export function PlayHUD({
  elapsedSeconds,
  placedCount,
  totalPieces,
  isPaused: _isPaused,
  isComplete: _isComplete,
  timeMode,
  countdownMinutes = 10,
  bestTimeSeconds,
  timeDecayScore,
  timeAttackCombo = 0,
  timeDecayCombo = 0,
  onTogglePause: _onTogglePause,
}: PlayHUDProps) {
  const showTimer = timeMode !== "relaxed" && timeMode !== "timeDecay";
  const showScore = timeMode === "timeDecay";
  const isCountdown = timeMode === "countdown" || timeMode === "timeAttack";
  const countdownTotal = countdownMinutes * 60;
  const isLowTime = isCountdown && elapsedSeconds > 0 && elapsedSeconds <= 60;
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 300);
    return () => clearTimeout(t);
  }, [placedCount]);

  return (
    <div className={styles.hud}>
      {(timeAttackCombo >= 2 || timeDecayCombo >= 2) && (
        <div
          className={`${styles.comboMeter} ${timeDecayCombo >= 2 ? styles.comboMeterDecay : ""}`}
          aria-label={`Combo ×${timeAttackCombo >= 2 ? timeAttackCombo : timeDecayCombo}`}
        >
          <span className={styles.comboLabel}>
            ×{timeAttackCombo >= 2 ? timeAttackCombo : timeDecayCombo}
          </span>
          <span className={styles.comboFire}>🔥</span>
        </div>
      )}
      {showScore && timeDecayScore != null && (
        <div className={styles.hudPillTimer}>
          <span className={styles.timerText}>Score {timeDecayScore}</span>
        </div>
      )}
      {showTimer && !showScore && (
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
      <div
        className={`${styles.hudPill} ${bounce ? styles.hudPillBounce : ""}`}
        aria-label={`${placedCount} of ${totalPieces} pieces connected`}
        role="status"
      >
        <Puzzle size={14} />
        <span>
          {placedCount} / {totalPieces}
        </span>
      </div>
    </div>
  );
}
