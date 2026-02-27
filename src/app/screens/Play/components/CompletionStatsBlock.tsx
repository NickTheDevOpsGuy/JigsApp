/**
 * Completion overlay stats block: Time, Moves, Accuracy, Rank.
 */
import { Clock, Puzzle, Target, Trophy } from "lucide-react";
import { formatTime } from "../playUtils";
import styles from "../PlayScreen.module.css";

type Percentile = { topPercent: number; totalPlayers: number };

type Props = {
  elapsedSeconds: number;
  moveCount: number;
  accuracyPercent: number;
  percentile: Percentile | null;
  rankPosition: number | null;
};

export function CompletionStatsBlock({
  elapsedSeconds,
  moveCount,
  accuracyPercent,
  percentile,
  rankPosition,
}: Props) {
  return (
    <div className={styles.completeStats}>
      <div className={styles.completeStatRow}>
        <Clock size={18} className={styles.completeStatIcon} aria-hidden />
        <span className={styles.completeStatLabel}>Time:</span>
        <span className={styles.completeStatValue}>{formatTime(elapsedSeconds)}</span>
      </div>
      <div className={styles.completeStatRow}>
        <Puzzle size={18} className={styles.completeStatIcon} aria-hidden />
        <span className={styles.completeStatLabel}>Moves:</span>
        <span className={styles.completeStatValue}>{moveCount}</span>
      </div>
      <div className={styles.completeStatRow}>
        <Target size={18} className={styles.completeStatIcon} aria-hidden />
        <span className={styles.completeStatLabel}>Accuracy:</span>
        <span className={styles.completeStatValue}>
          {Math.round(Math.max(0, Math.min(100, accuracyPercent)))}%
        </span>
      </div>
      {percentile && percentile.totalPlayers >= 1 && rankPosition != null && (
        <div className={styles.completeStatRow}>
          <Trophy size={18} className={styles.completeStatIcon} aria-hidden />
          <span className={styles.completeStatLabel}>Rank</span>
          <span className={styles.completeStatValueRank}>
            #{rankPosition} / {percentile.totalPlayers} (Top {percentile.topPercent}%)
          </span>
        </div>
      )}
    </div>
  );
}
