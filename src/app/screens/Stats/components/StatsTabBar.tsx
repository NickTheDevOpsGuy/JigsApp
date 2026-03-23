/**
 * Tab bar for Stats screen: 3 tabs – Profile, Board, Badges.
 */
import { Trophy, User, Award } from "lucide-react";
import styles from "../StatsScreen.module.css";

export type StatsTab = "profile" | "leaderboard" | "achievements";

export function StatsTabBar({
  activeTab,
  setActiveTab,
  isNarrow: _isNarrow,
  weeklyAlbumProgress,
}: {
  activeTab: StatsTab;
  setActiveTab: (tab: StatsTab) => void;
  isNarrow: boolean;
  weeklyAlbumProgress: number;
}) {
  return (
    <div
      className={`${styles.tabs} ${styles.horizontalRail}`}
      role="tablist"
      aria-label="Stats sections"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "profile"}
        className={activeTab === "profile" ? styles.tabActive : ""}
        onClick={() => setActiveTab("profile")}
        aria-label="Profile stats"
        title="Profile stats"
      >
        <User size={18} aria-hidden />
        <span>Profile</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "leaderboard"}
        className={activeTab === "leaderboard" ? styles.tabActive : ""}
        onClick={() => setActiveTab("leaderboard")}
        aria-label={`Board leaderboard, weekly album progress ${weeklyAlbumProgress} out of 7`}
        title="Board leaderboard"
      >
        <Trophy size={18} aria-hidden />
        <span className={styles.tabLabel}>Board</span>
        <span className={styles.tabMiniProgress}>{weeklyAlbumProgress}/7</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "achievements"}
        className={activeTab === "achievements" ? styles.tabActive : ""}
        onClick={() => setActiveTab("achievements")}
        aria-label="Badges and achievements"
        title="Badges and achievements"
      >
        <Award size={18} aria-hidden />
        <span>Badges</span>
      </button>
    </div>
  );
}
