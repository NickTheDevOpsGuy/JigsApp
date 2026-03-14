/**
 * PlayHUD – timer, move count, placed/total with puzzle icon (top bar center).
 * Speedrun: quadrant timers; Time Attack: lives.
 */
import React from "react";
import { Clock, Heart, Puzzle } from "lucide-react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import type { TimeMode } from "@/screens/Play/core/time/timeMode";

interface PlayHUDProps {
  elapsedSeconds: number;
  moveCount: number;
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
  /** Split layout: left = timer + moves (board left); right = placed/total (board right) */
  layout?: "left" | "right";
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
  moveCount,
  piecesLeft,
  totalPieces,
  isPaused: _isPaused,
  isComplete: _isComplete,
  timeMode,
  countdownMinutes = 10,
  bestTimeSeconds,
  quadrantTimes,
  quadrantPbs,
  lives,
  onTogglePause: _onTogglePause,
  zenModeEnabled,
  uiTone,
  layout,
}: PlayHUDProps) {
  const placedCount = Math.max(0, totalPieces - piecesLeft);
  const showTimer = !zenModeEnabled && timeMode !== "relaxed";
  const isCountdown = timeMode === "countdown";
  const isSpeedrun = timeMode === "speedrun";
  const isTimeAttack = timeMode === "timeattack";
  const countdownTotal = countdownMinutes * 60;
  const isLowTime = isCountdown && elapsedSeconds > 0 && elapsedSeconds <= 60;

  const showLeft = !layout || layout === "left";
  const showRight = !layout || layout === "right";

  return (
    <div
      className={`${styles.hud} ${layout === "left" ? styles.hudLeft : ""} ${layout === "right" ? styles.hudRight : ""} ${uiTone === "competitive" ? styles.hudCompetitive : ""} ${uiTone === "calm" ? styles.hudCalm : ""}`}
      data-ui-tone={uiTone ?? undefined}
    >
      {showLeft && isSpeedrun && quadrantTimes && (
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
      {showLeft && isTimeAttack && lives != null && (
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
      {showLeft && showTimer && !isSpeedrun && !isTimeAttack && (
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
      {showLeft && showTimer && (isSpeedrun || isTimeAttack) && (
        <div className={styles.hudPillTimer} title="Elapsed time (speedrun)">
          <Clock size={14} />
          <span className={styles.timerText}>{formatTime(elapsedSeconds)}</span>
        </div>
      )}
      {showLeft && !isSpeedrun && !isTimeAttack && (
        <div
          className={styles.hudMoveCount}
          aria-label={`${moveCount} ${moveCount === 1 ? "move" : "moves"}`}
          title={`${moveCount} ${moveCount === 1 ? "move" : "moves"}`}
          role="status"
        >
          {moveCount} {moveCount === 1 ? "move" : "moves"}
        </div>
      )}
      {showRight && !isSpeedrun && !isTimeAttack && (
        <div
          className={styles.hudPlacedTotal}
          aria-label={`${placedCount} of ${totalPieces} pieces placed`}
          title={`Pieces placed: ${placedCount}/${totalPieces}`}
          role="status"
        >
          <span className={styles.hudPlacedTotalText}>
            {placedCount}/{totalPieces}
          </span>
          <Puzzle size={14} className={styles.hudPlacedTotalIcon} aria-hidden />
        </div>
      )}
    </div>
  );
}
