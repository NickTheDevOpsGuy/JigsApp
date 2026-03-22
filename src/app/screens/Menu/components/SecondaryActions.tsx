import { ChevronRight, Image, Package } from "lucide-react";

import { Button } from "@/components/Button/Button";
import styles from "../MenuScreen.module.css";

type SecondaryActionsProps = {
  onOpenPacks: () => void;
  onOpenQuickPlay: () => void;
};

export function SecondaryActions({
  onOpenPacks,
  onOpenQuickPlay,
}: SecondaryActionsProps) {
  return (
    <>
      <Button
        variant="secondary"
        onClick={onOpenPacks}
        className={`${styles.actionCard} ${styles.actionCardFullWidth} ${styles.secondaryActionRow}`}
        aria-label="Puzzle Packs"
        fullWidth
      >
        <span className={styles.secondaryActionLead}>
          <span className={styles.secondaryActionIcon}>
            <Package size={18} />
          </span>
          <span className={styles.secondaryActionCopy}>
            <span className={styles.actionLabel}>Puzzle Packs</span>
            <span className={styles.secondaryActionMeta}>Hand-picked themed puzzles</span>
          </span>
        </span>
        <ChevronRight size={18} aria-hidden className={styles.secondaryChevron} />
      </Button>

      <Button
        variant="secondary"
        onClick={onOpenQuickPlay}
        className={`${styles.actionCard} ${styles.actionCardFullWidth} ${styles.secondaryActionRow}`}
        aria-label="Quick Play"
        fullWidth
      >
        <span className={styles.secondaryActionLead}>
          <span className={styles.secondaryActionIcon}>
            <Image size={18} />
          </span>
          <span className={styles.secondaryActionCopy}>
            <span className={styles.actionLabel}>Quick Play</span>
            <span className={styles.secondaryActionMeta}>Pick any image and jump in</span>
          </span>
        </span>
        <ChevronRight size={18} aria-hidden className={styles.secondaryChevron} />
      </Button>
    </>
  );
}
