/**
 * Stats screen top bar: title, close (X) in upper right.
 */
import { X } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../StatsScreen.module.css";

type StatsTab = "profile" | "leaderboard" | "achievements";

interface StatsScreenHeaderProps {
  activeTab: StatsTab;
  headerTitle: string;
  weeklyAlbumProgress: number;
  onClose: () => void;
}

export function StatsScreenHeader({
  activeTab,
  headerTitle,
  weeklyAlbumProgress,
  onClose,
}: StatsScreenHeaderProps) {
  return (
    <div
      className={`${styles.header} ${
        activeTab === "leaderboard" ? styles.headerLeaderboard : ""
      }`}
    >
      <h1 className={styles.title}>
        {headerTitle}
        {activeTab === "leaderboard" && (
          <span className={styles.titleProgress}>{weeklyAlbumProgress}/7</span>
        )}
      </h1>
      <div className={styles.headerActions}>
        <Button
          size="sm"
          variant="secondary"
          onClick={onClose}
          className={`${styles.headerIconBtn} ${styles.headerCloseBtn}`}
          aria-label="Close"
          title="Close"
        >
          <X size={20} />
        </Button>
      </div>
    </div>
  );
}
