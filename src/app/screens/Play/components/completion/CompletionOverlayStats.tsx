import React from "react";
import { Clock3, MoveRight, Puzzle, Sparkles } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import { getDifficultyLabel } from "@/screens/Play/core/share/shareMessages";

export function CompletionOverlayStats(props: {
  elapsedSeconds: number;
  moveCount: number;
  pieceCount: number;
  piecesPerMin: number;
  rotationCount: number;
  maxGroupSize: number;
}) {
  const {
    elapsedSeconds,
    moveCount,
    pieceCount,
    piecesPerMin: _piecesPerMin,
    rotationCount: _rotationCount,
    maxGroupSize: _maxGroupSize,
  } = props;
  const difficulty = getDifficultyLabel(pieceCount);
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
            <Puzzle size={16} />
          </span>
          <span className={styles.completeStatCardLabel}>Pieces</span>
          <span className={styles.completeStatCardValue}>{pieceCount}</span>
        </div>
        <div className={styles.completeStatCard}>
          <span className={styles.completeStatCardIcon} aria-hidden="true">
            <Sparkles size={16} />
          </span>
          <span className={styles.completeStatCardLabel}>Difficulty</span>
          <span className={styles.completeStatCardValue}>{difficulty}</span>
        </div>
      </div>
    </div>
  );
}
