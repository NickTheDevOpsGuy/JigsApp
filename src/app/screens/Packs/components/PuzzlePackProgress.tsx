import styles from "./PuzzlePackModule.module.css";

type PuzzlePackProgressProps = {
  completed: number;
  total: number;
  completeLabel?: string;
  /** When true, show percentage on the same row as the progress bar. */
  showPercentInline?: boolean;
};

export function PuzzlePackProgress({
  completed,
  total,
  completeLabel = "Pack Complete",
  showPercentInline = false,
}: PuzzlePackProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed >= total;

  const bar = (
    <div className={styles.progressTrack} aria-hidden="true">
      <span className={styles.progressFill} style={{ width: `${percent}%` }} />
    </div>
  );

  return (
    <div className={styles.progressBlock}>
      {showPercentInline ? (
        <div className={styles.progressBarRow}>
          {bar}
          <span className={styles.progressPercent}>{percent}%</span>
        </div>
      ) : (
        bar
      )}
      <p
        className={`${styles.progressText} ${isComplete ? styles.progressComplete : ""}`}
      >
        {isComplete ? `✔ ${completeLabel}` : `${completed} / ${total} completed`}
      </p>
    </div>
  );
}
