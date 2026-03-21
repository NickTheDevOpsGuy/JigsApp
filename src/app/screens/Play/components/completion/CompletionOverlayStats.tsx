import { Clock3, MoveRight, Puzzle } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { formatTime } from "@/screens/Play/core/utils/playUtils";

export function CompletionOverlayStats(props: {
  elapsedSeconds: number;
  moveCount: number;
  pieceCount: number;
  piecesPerMin: number;
  rotationCount: number;
  maxGroupSize: number;
  phase: 1 | 2 | 3;
}) {
  const { elapsedSeconds, moveCount, pieceCount, phase } = props;
  return (
    <div
      className={`${styles.completeStatsBar} ${phase >= 2 ? styles.completeStatsBarVisible : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.completeStatsBarItem}>
        <Clock3 size={18} aria-hidden />
        {formatTime(elapsedSeconds)}
      </span>
      <span className={styles.completeStatsBarItem}>
        <MoveRight size={18} aria-hidden />
        {moveCount} {moveCount === 1 ? "Move" : "Moves"}
      </span>
      <span className={styles.completeStatsBarItem}>
        <Puzzle size={18} aria-hidden />
        {pieceCount} Pieces
      </span>
    </div>
  );
}
