import { ChevronRight } from "lucide-react";

import { Button } from "@/components/Button/Button";
import styles from "../MenuScreen.module.css";

type PrimaryDailyActionProps = {
  hasDaily: boolean;
  todayCompleted: boolean;
  hasInProgressDaily: boolean;
  primaryStatus: string;
  starIconSrc: string;
  starImgFailed: boolean;
  onStarError: () => void;
  onClick: () => void;
};

export function PrimaryDailyAction({
  hasDaily,
  todayCompleted,
  hasInProgressDaily,
  primaryStatus,
  starIconSrc,
  starImgFailed,
  onStarError,
  onClick,
}: PrimaryDailyActionProps) {
  const actionLabel = todayCompleted
    ? "Play Today’s Puzzle Again"
    : hasInProgressDaily
      ? "Continue Daily"
      : "Play Today’s Puzzle";

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
        <span className={styles.primaryActionTopline}>
          {starImgFailed ? (
            <span className={styles.starFallback} aria-hidden>
              ★
            </span>
          ) : (
            <img
              src={starIconSrc}
              alt=""
              className={styles.starIcon}
              onError={onStarError}
            />
          )}
          <span className={styles.actionLabel}>{actionLabel}</span>
        </span>
        <span className={styles.primaryActionMeta}>{primaryStatus}</span>
      </span>
      <ChevronRight size={18} aria-hidden />
    </Button>
  );
}
