import styles from "./PuzzlePackModule.module.css";

type PuzzlePackProgressProps = {
  completed: number;
  total: number;
  completeLabel?: string;
};

export function PuzzlePackProgress({
  completed,
  total,
  completeLabel = "Pack Complete",
}: PuzzlePackProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed >= total;

  return (
    <div className={styles.progressBlock}>
      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
      <p
        className={`${styles.progressText} ${isComplete ? styles.progressComplete : ""}`}
      >
        {isComplete ? `✔ ${completeLabel}` : `${completed} / ${total} completed`}
      </p>
    </div>
  );
}
