/**
 * Completion overlay stats block: Time, Moves, Accuracy, Rank, Precision (optional).
 */
import { Clock, Puzzle, Target, Trophy, Crosshair } from "lucide-react";
import { formatTime } from "../playUtils";
import styles from "./CompletionOverlay.module.css";

type Percentile = { topPercent: number; totalPlayers: number };

type Props = {
  elapsedSeconds: number;
  moveCount: number;
  accuracyPercent: number;
  percentile: Percentile | null;
  rankPosition: number | null;
  hideTime?: boolean;
  precisionModeEnabled?: boolean;
  avgPrecisionPx?: number | null;
  precisionBonusPoints?: number | null;
};

export function CompletionStatsBlock({
  elapsedSeconds,
  moveCount,
  accuracyPercent,
  percentile,
  rankPosition,
  hideTime = false,
  precisionModeEnabled,
  avgPrecisionPx,
  precisionBonusPoints,
}: Props) {
  return (
    <div className={styles.completeStats}>
      {!hideTime && (
        <div className={styles.completeStatRow}>
          <Clock size={18} className={styles.completeStatIcon} aria-hidden />
          <div className={styles.completeStatLabelValue}>
            <span className={styles.completeStatLabel}>Time:</span>
            <span className={styles.completeStatValue}>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      )}
      <div className={styles.completeStatRow}>
        <Puzzle size={18} className={styles.completeStatIcon} aria-hidden />
        <div className={styles.completeStatLabelValue}>
          <span className={styles.completeStatLabel}>Moves:</span>
          <span className={styles.completeStatValue}>{moveCount}</span>
        </div>
      </div>
      <div className={styles.completeStatRow}>
        <Target size={18} className={styles.completeStatIcon} aria-hidden />
        <div className={styles.completeStatLabelValue}>
          <span className={styles.completeStatLabel}>Accuracy:</span>
          <span className={styles.completeStatValue}>
            {Math.round(Math.max(0, Math.min(100, accuracyPercent)))}%
          </span>
        </div>
      </div>
      {precisionModeEnabled && avgPrecisionPx != null && (
        <div className={styles.completeStatRow}>
          <Crosshair size={18} className={styles.completeStatIcon} aria-hidden />
          <div className={styles.completeStatLabelValue}>
            <span className={styles.completeStatLabel}>Precision:</span>
            <span className={styles.completeStatValue}>
              {avgPrecisionPx.toFixed(1)} px avg
              {precisionBonusPoints != null && precisionBonusPoints > 0 && (
                <span className={styles.completeStatBonus}>
                  {" "}
                  +{precisionBonusPoints} bonus
                </span>
              )}
            </span>
          </div>
        </div>
      )}
      {percentile && percentile.totalPlayers >= 1 && rankPosition != null && (
        <div className={styles.completeStatRow}>
          <Trophy size={18} className={styles.completeStatIcon} aria-hidden />
          <div className={styles.completeStatLabelValue}>
            <span className={styles.completeStatLabel}>Rank</span>
            <span className={styles.completeStatValueRank}>
              #{rankPosition} / {percentile.totalPlayers} (Top {percentile.topPercent}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
