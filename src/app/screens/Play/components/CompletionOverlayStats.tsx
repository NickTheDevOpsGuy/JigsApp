import React from "react";
import { Clock, Layers, Puzzle, RotateCw, Zap } from "lucide-react";
import styles from "./CompletionOverlay.module.css";
import { formatTime } from "../playUtils";

export function CompletionOverlayStats(props: {
  elapsedSeconds: number;
  moveCount: number;
  piecesPerMin: number;
  rotationCount: number;
  maxGroupSize: number;
}) {
  const { elapsedSeconds, moveCount, piecesPerMin, rotationCount, maxGroupSize } = props;
  return (
    <div className={styles.completeStatCards} role="status" aria-live="polite">
      <div className={styles.completeStatCard}>
        <Clock size={24} className={styles.completeStatCardIcon} aria-hidden />
        <span className={styles.completeStatCardLabel}>Time</span>
        <span className={styles.completeStatCardValue}>{formatTime(elapsedSeconds)}</span>
      </div>
      <div className={styles.completeStatCard}>
        <Puzzle size={24} className={styles.completeStatCardIcon} aria-hidden />
        <span className={styles.completeStatCardLabel}>Moves</span>
        <span className={styles.completeStatCardValue}>{moveCount}</span>
      </div>
      <div className={styles.completeStatCard}>
        <Zap size={24} className={styles.completeStatCardIcon} aria-hidden />
        <span className={styles.completeStatCardLabel}>Pieces/min</span>
        <span className={styles.completeStatCardValue}>{piecesPerMin.toFixed(1)}</span>
      </div>
      <div className={styles.completeStatCard}>
        <RotateCw size={24} className={styles.completeStatCardIcon} aria-hidden />
        <span className={styles.completeStatCardLabel}>Rotations</span>
        <span className={styles.completeStatCardValue}>{rotationCount}</span>
      </div>
      {maxGroupSize > 0 && (
        <div className={styles.completeStatCard}>
          <Layers size={24} className={styles.completeStatCardIcon} aria-hidden />
          <span className={styles.completeStatCardLabel}>Largest merge</span>
          <span className={styles.completeStatCardValue}>
            {maxGroupSize} {maxGroupSize === 1 ? "piece" : "pieces"}
          </span>
        </div>
      )}
    </div>
  );
}
