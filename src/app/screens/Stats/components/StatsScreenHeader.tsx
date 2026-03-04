/**
 * Stats screen top bar: title, optional share (leaderboard), close (X) in upper right.
 */
import { Share2, X } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../StatsScreen.module.css";

type StatsTab = "profile" | "leaderboard" | "achievements";

interface StatsScreenHeaderProps {
  activeTab: StatsTab;
  headerTitle: string;
  weeklyAlbumProgress: number;
  leaderboardType: string;
  weekSubview: string;
  shareCopied: boolean;
  albumShareCopied: boolean;
  onClose: () => void;
  onShareLeaderboard: () => void;
  onShareWeeklyAlbum: () => void;
}

export function StatsScreenHeader({
  activeTab,
  headerTitle,
  weeklyAlbumProgress,
  leaderboardType,
  weekSubview,
  shareCopied,
  albumShareCopied,
  onClose,
  onShareLeaderboard,
  onShareWeeklyAlbum,
}: StatsScreenHeaderProps) {
  const isAlbumShare = leaderboardType === "week" && weekSubview === "album";
  const shareLabel = isAlbumShare
    ? albumShareCopied
      ? "Copied weekly album share text"
      : "Share weekly album"
    : shareCopied
      ? "Copied leaderboard share text"
      : "Share leaderboard";
  const shareTitle = isAlbumShare
    ? albumShareCopied
      ? "Copied!"
      : "Share album"
    : shareCopied
      ? "Copied!"
      : "Share leaderboard";

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
        {activeTab === "leaderboard" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={isAlbumShare ? onShareWeeklyAlbum : onShareLeaderboard}
            className={styles.headerIconBtn}
            aria-label={shareLabel}
            title={shareTitle}
          >
            <Share2 size={18} />
          </Button>
        )}
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
