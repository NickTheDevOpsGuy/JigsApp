/**
 * Tab bar for Stats screen: Dashboard, Profile, Leaderboard, Achievements.
 */
import { BarChart3, Trophy, User, Award } from "lucide-react";
import styles from "../StatsScreen.module.css";

export type StatsTab = "dashboard" | "profile" | "leaderboard" | "achievements";

export function StatsTabBar({
  activeTab,
  setActiveTab,
  isNarrow,
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
        className={activeTab === "dashboard" ? styles.tabActive : ""}
        onClick={() => setActiveTab("dashboard")}
        aria-label="Dashboard"
      >
        <BarChart3 size={18} aria-hidden />
        <span>{isNarrow ? "Dash" : "Dashboard"}</span>
      </button>
      <button
        className={activeTab === "profile" ? styles.tabActive : ""}
        onClick={() => setActiveTab("profile")}
        aria-label="Profile"
      >
        <User size={18} aria-hidden />
        <span>Profile</span>
      </button>
      <button
        className=""
        onClick={() => setActiveTab("leaderboard")}
        aria-label="Leaderboard"
      >
        <Trophy size={18} aria-hidden />
        <span>{isNarrow ? "Board" : "Leaderboard"}</span>
        <span className={styles.tabMiniProgress}>{weeklyAlbumProgress}/7</span>
      </button>
      <button
        className={activeTab === "achievements" ? styles.tabActive : ""}
        onClick={() => setActiveTab("achievements")}
        aria-label="Achievements"
      >
        <Award size={18} aria-hidden />
        <span>{isNarrow ? "Badges" : "Achievements"}</span>
      </button>
    </div>
  );
}
