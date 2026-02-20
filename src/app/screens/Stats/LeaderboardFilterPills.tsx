/**
 * LeaderboardFilterPills – filter buttons for leaderboard type and view options.
 */
import { Calendar, Share2 } from "lucide-react";
import type { LeaderboardType } from "./StatsScreen";
import styles from "./StatsScreen.module.css";

interface LeaderboardFilterPillsProps {
  leaderboardType: LeaderboardType;
  onLeaderboardTypeChange: (t: LeaderboardType) => void;
  leaderboardCompact: boolean;
  onCompactToggle: () => void;
  shareCopied: boolean;
  onShare: () => void;
}

const FILTERS: { type: LeaderboardType; label: string; icon?: "calendar" }[] = [
  { type: "today", label: "Today" },
  { type: "bestWeek", label: "Week" },
  { type: "bestMonth", label: "Month", icon: "calendar" },
  { type: "timeAttack", label: "Time Attack" },
  { type: "timeDecay", label: "Time Decay" },
];

export function LeaderboardFilterPills({
  leaderboardType,
  onLeaderboardTypeChange,
  leaderboardCompact,
  onCompactToggle,
  shareCopied,
  onShare,
}: LeaderboardFilterPillsProps) {
  return (
    <div className={styles.leaderboardFilters}>
      {FILTERS.map(({ type, label, icon }) => (
        <button
          key={type}
          type="button"
          className={`${styles.filterPill} ${leaderboardType === type ? styles.filterPillActive : ""}`}
          onClick={() => onLeaderboardTypeChange(type)}
        >
          {icon === "calendar" && <Calendar size={14} />}
          {label}
        </button>
      ))}
      <button
        type="button"
        className={`${styles.filterPill} ${leaderboardCompact ? styles.filterPillActive : ""}`}
        onClick={onCompactToggle}
        title={leaderboardCompact ? "Compact view" : "Expand view"}
      >
        Compact
      </button>
      <button
        type="button"
        className={`${styles.filterPill} ${styles.filterPillShare}`}
        onClick={onShare}
      >
        <Share2 size={14} />
        {shareCopied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
