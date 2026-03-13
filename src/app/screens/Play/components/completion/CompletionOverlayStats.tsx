import React from "react";
import { Clock3, MoveRight, Sparkles, SplitSquareVertical } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { formatTime } from "@/screens/Play/core/utils/playUtils";

export function CompletionOverlayStats(props: {
  elapsedSeconds: number;
  moveCount: number;
  piecesPerMin: number;
  rotationCount: number;
  maxGroupSize: number;
}) {
  const {
    elapsedSeconds,
    moveCount,
    piecesPerMin,
    rotationCount: _rotationCount,
    maxGroupSize,
  } = props;
  return (
    <div className={styles.completeStatsPanel} role="status" aria-live="polite">
      <p className={styles.completeStatsPanelTitle}>Your stats</p>
      <div className={styles.completeStatCards}>
        <div className={styles.completeStatCard}>
          <span className={styles.completeStatCardIcon} aria-hidden="true">
            <Clock3 size={16} />
          </span>
          <span className={styles.completeStatCardLabel}>Time</span>
          <span className={styles.completeStatCardValue}>
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <div className={styles.completeStatCard}>
          <span className={styles.completeStatCardIcon} aria-hidden="true">
            <MoveRight size={16} />
          </span>
          <span className={styles.completeStatCardLabel}>Moves</span>
          <span className={styles.completeStatCardValue}>{moveCount}</span>
        </div>
        <div className={styles.completeStatCard}>
          <span className={styles.completeStatCardIcon} aria-hidden="true">
            <Sparkles size={16} />
          </span>
          <span className={styles.completeStatCardLabel}>Pieces/min</span>
          <span className={styles.completeStatCardValue}>{piecesPerMin.toFixed(1)}</span>
        </div>
        <div className={styles.completeStatCard}>
          <span className={styles.completeStatCardIcon} aria-hidden="true">
            <SplitSquareVertical size={16} />
          </span>
          <span className={styles.completeStatCardLabel}>Largest Merge</span>
          <span className={styles.completeStatCardValue}>
            {maxGroupSize > 0
              ? `${maxGroupSize} ${maxGroupSize === 1 ? "piece" : "pieces"}`
              : "0 pieces"}
          </span>
        </div>
      </div>
    </div>
  );
}
