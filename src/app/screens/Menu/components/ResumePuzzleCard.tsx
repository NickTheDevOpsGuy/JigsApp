import { Button } from "@/components/Button/Button";
import styles from "../MenuScreen.module.css";

type ResumePuzzleCardProps = {
  title: string;
  contextLabel?: string;
  progress: number;
  rows: number;
  cols: number;
  elapsedLabel: string;
  savedAtLabel: string;
  onClick: () => void;
};

export function ResumePuzzleCard({
  title,
  contextLabel,
  progress,
  rows,
  cols,
  elapsedLabel,
  savedAtLabel,
  onClick,
}: ResumePuzzleCardProps) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className={`${styles.actionCard} ${styles.actionCardFullWidth} ${styles.resumeCard}`}
      aria-label={title}
      fullWidth
    >
      <span className={styles.resumeTitle}>{title}</span>
      <span className={styles.resumeMeta}>
        {contextLabel ? `${contextLabel} · ` : ""}
        {progress}% solved · {rows}x{cols} · {elapsedLabel}
      </span>
      <span className={styles.resumeHint}>Saved {savedAtLabel}</span>
    </Button>
  );
}
