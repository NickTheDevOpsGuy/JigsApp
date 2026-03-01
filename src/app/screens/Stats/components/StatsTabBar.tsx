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
    <div className={styles.tabs}>
      <button
        className={activeTab === "profile" ? styles.tabActive : ""}
        onClick={() => setActiveTab("profile")}
        aria-label="Profile"
      >
        <User size={18} aria-hidden />
        <span>Profile</span>
      </button>
      <button
        className={activeTab === "leaderboard" ? styles.tabActive : ""}
        onClick={() => setActiveTab("leaderboard")}
        aria-label="Board"
      >
        <Trophy size={18} aria-hidden />
        <span>Board</span>
        <span className={styles.tabMiniProgress}>{weeklyAlbumProgress}/7</span>
      </button>
      <button
        className={activeTab === "achievements" ? styles.tabActive : ""}
        onClick={() => setActiveTab("achievements")}
        aria-label="Badges"
      >
        <Award size={18} aria-hidden />
        <span>Badges</span>
      </button>
    </div>
  );
}
