/**
 * PlayHUD – timer, pieces left, pause button (top bar center).
 * Speedrun: quadrant timers (TL, TR, BL, BR) with PB comparison.
 */
import React, { useEffect, useState } from "react";
import { Clock, Heart, Pause, Puzzle } from "lucide-react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import type { TimeMode } from "@/screens/Play/core/time/timeMode";

interface PlayHUDProps {
  elapsedSeconds: number;
  piecesLeft: number;
  totalPieces: number;
  isPaused: boolean;
  isComplete: boolean;
  timeMode: TimeMode;
  countdownMinutes?: number;
  bestTimeSeconds?: number | null;
  quadrantTimes?: Record<0 | 1 | 2 | 3, number | null>;
  quadrantPbs?: Record<0 | 1 | 2 | 3, number | null>;
  lives?: number;
  onTogglePause: () => void;
  /** Zen Ambient: hide timer and rankings for a pressure-free view */
  zenModeEnabled?: boolean;
  /** Adaptive Personality: competitive = snappier copy; calm = softer copy */
  uiTone?: "competitive" | "calm";
}

const QUAD_LABELS = ["TL", "TR", "BL", "BR"] as const;

const QUAD_FULL_NAMES: Record<number, string> = {
  0: "Top-left quadrant",
  1: "Top-right quadrant",
  2: "Bottom-left quadrant",
  3: "Bottom-right quadrant",
};

export function PlayHUD({
  elapsedSeconds,
  piecesLeft,
  totalPieces,
  isPaused,
  isComplete: _isComplete,
  timeMode,
  countdownMinutes = 10,
  bestTimeSeconds,
  quadrantTimes,
  quadrantPbs,
  lives,
  onTogglePause,
  zenModeEnabled,
  uiTone,
}: PlayHUDProps) {
  const pauseTitle =
    uiTone === "competitive"
      ? isPaused
        ? "Resume"
        : "Pause"
      : isPaused
        ? "Resume the timer"
        : "Pause the timer";
  const showTimer = !zenModeEnabled && timeMode !== "relaxed";
  const isCountdown = timeMode === "countdown";
  const isSpeedrun = timeMode === "speedrun";
  const isTimeAttack = timeMode === "timeattack";
  const countdownTotal = countdownMinutes * 60;
  const isLowTime = isCountdown && elapsedSeconds > 0 && elapsedSeconds <= 60;
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 300);
    return () => clearTimeout(t);
  }, [piecesLeft]);

  const piecesLabel =
    uiTone === "competitive"
      ? `${piecesLeft} left`
      : uiTone === "calm"
        ? `${piecesLeft} remaining`
        : `${piecesLeft} / ${totalPieces}`;

  return (
    <div
      className={`${styles.hud} ${uiTone === "competitive" ? styles.hudCompetitive : ""} ${uiTone === "calm" ? styles.hudCalm : ""}`}
      data-ui-tone={uiTone ?? undefined}
    >
      {isSpeedrun && quadrantTimes && (
        <div className={styles.quadrantTimers}>
          {([0, 1, 2, 3] as const).map((q) => {
            const t = quadrantTimes[q];
            const pb = quadrantPbs?.[q];
            return (
              <span
                key={q}
                className={styles.quadrantTimer}
                title={`${QUAD_FULL_NAMES[q] ?? QUAD_LABELS[q]}: ${t != null ? formatTime(t) : "—"}`}
              >
                {QUAD_LABELS[q]}:{t != null ? formatTime(t) : "-"}
                {pb != null && t != null && t <= pb && t > 0 && "★"}
              </span>
            );
          })}
        </div>
      )}
      {isTimeAttack && lives != null && (
        <div className={styles.hudPillTimer} title="Lives remaining">
          {[1, 2, 3].map((i) => (
            <Heart
              key={i}
              size={16}
              fill={i <= lives ? "currentColor" : "none"}
              strokeWidth={2}
              className={i > lives ? styles.lifeLost : ""}
            />
          ))}
        </div>
      )}
      {showTimer && !isSpeedrun && !isTimeAttack && (
        <div
          className={`${styles.hudPillTimer} ${isLowTime ? styles.timerLow : ""}`}
          title={
            isCountdown
              ? `Countdown timer (${formatTime(countdownTotal)} total)`
              : "Elapsed time"
          }
        >
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
      {showTimer && (isSpeedrun || isTimeAttack) && (
        <div className={styles.hudPillTimer} title="Elapsed time (speedrun)">
          <Clock size={14} />
          <span className={styles.timerText}>{formatTime(elapsedSeconds)}</span>
        </div>
      )}
      <button
        type="button"
        className={styles.hudPillPause}
        onClick={onTogglePause}
        aria-label={isPaused ? "Resume" : "Pause"}
        title={pauseTitle}
      >
        <Pause size={14} />
      </button>
      <div
        className={`${styles.hudPill} ${bounce ? styles.hudPillBounce : ""}`}
        aria-label={`${piecesLeft} of ${totalPieces} pieces remaining`}
        title={`${piecesLeft} of ${totalPieces} pieces remaining`}
        role="status"
      >
        <Puzzle size={14} />
        <span>{piecesLabel}</span>
      </div>
    </div>
  );
}
