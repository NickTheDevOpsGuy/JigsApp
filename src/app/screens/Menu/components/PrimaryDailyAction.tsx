import { ChevronRight } from "lucide-react";

import { Button } from "@/components/Button/Button";
import styles from "../MenuScreen.module.css";

type PrimaryDailyActionProps = {
  hasDaily: boolean;
  todayCompleted: boolean;
  hasInProgressDaily: boolean;
  onClick: () => void;
};

export function PrimaryDailyAction({
  hasDaily,
  todayCompleted,
  hasInProgressDaily,
  onClick,
}: PrimaryDailyActionProps) {
  const actionLabel = todayCompleted
    ? "Play Again"
    : hasInProgressDaily
      ? "Continue Daily"
      : "Play Today";

  const ariaLabel = todayCompleted
    ? "Play Today's Puzzle again"
    : hasInProgressDaily
      ? "Continue today's daily puzzle"
      : "Play Today's Puzzle";

  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={!hasDaily}
      className={`${styles.actionCard} ${styles.actionCardFullWidth} ${styles.primaryAction}`}
      aria-label={ariaLabel}
      fullWidth
    >
      <span className={styles.primaryActionCopy}>
        <span className={styles.actionLabel}>{actionLabel}</span>
      </span>
      <ChevronRight size={18} aria-hidden className={styles.primaryActionChevron} />
    </Button>
  );
}
