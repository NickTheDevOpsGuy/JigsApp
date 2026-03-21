import { Image, Package } from "lucide-react";

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
        variant="outline"
        onClick={onOpenPacks}
        className={`${styles.actionCard} ${styles.secondaryAction}`}
        aria-label="Puzzle Packs"
      >
        <Package size={20} />
        <span className={styles.actionLabel}>Puzzle Packs</span>
      </Button>

      <Button
        variant="outline"
        onClick={onOpenQuickPlay}
        className={`${styles.actionCard} ${styles.secondaryAction}`}
        aria-label="Quick Play"
      >
        <Image size={20} />
        <span className={styles.actionLabel}>Quick Play</span>
      </Button>
    </>
  );
}
