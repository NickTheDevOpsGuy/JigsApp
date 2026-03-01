/**
 * Stats screen top bar: Back, title, optional share (leaderboard).
 */
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../StatsScreen.module.css";

type StatsTab = "dashboard" | "profile" | "leaderboard" | "achievements";

interface StatsScreenHeaderProps {
  activeTab: StatsTab;
  headerTitle: string;
  weeklyAlbumProgress: number;
  leaderboardType: string;
  weekSubview: string;
  shareCopied: boolean;
  albumShareCopied: boolean;
  onBack: () => void;
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
  onBack,
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
    <div className={styles.header}>
      <Button size="sm" onClick={onBack}>
        <ArrowLeft size={18} />
        Back
      </Button>
      <h1 className={styles.title}>
        {headerTitle}
        {activeTab === "leaderboard" && (
          <span className={styles.titleProgress}>{weeklyAlbumProgress}/7</span>
        )}
      </h1>
      {activeTab === "leaderboard" ? (
        <div className={styles.headerActions}>
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
        </div>
      ) : null}
    </div>
  );
}
