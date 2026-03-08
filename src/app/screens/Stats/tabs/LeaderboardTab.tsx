/**
 * LeaderboardTab – Today / Week / All-time leaderboards, filters, weekly album.
 */
import type { LeaderboardEntry } from "@/services/leaderboardService";
import type { PieceCutType, VisualModifierFilter } from "@/services/leaderboardService";
import { renderTimeList, renderCompletionList } from "./LeaderboardTabLists";
import { LeaderboardTabHeader } from "./LeaderboardTabHeader";
import styles from "../StatsScreen.module.css";

export type LeaderboardType = "today" | "week" | "alltime";
export type WeekSubview = "rankings" | "album";

export interface WeeklyAlbumSlot {
  date: string;
  dayLabel: string;
  imageUrl: string | null;
  completed: boolean;
  mastery: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface LeaderboardTabProps {
  leaderboardType: LeaderboardType;
  setLeaderboardType: (t: LeaderboardType) => void;
  weekSubview: WeekSubview;
  setWeekSubview: (s: WeekSubview) => void;
  allTimeGrid: "3x3" | "4x4" | "5x5" | "6x6";
  setAllTimeGrid: (g: "3x3" | "4x4" | "5x5" | "6x6") => void;
  filtersOpen: boolean;
  setFiltersOpen: (f: boolean | ((prev: boolean) => boolean)) => void;
  cutTypeFilter: PieceCutType;
  setCutTypeFilter: (c: PieceCutType) => void;
  modifierFilter: VisualModifierFilter;
  setModifierFilter: (m: VisualModifierFilter) => void;
  leaderboard: LeaderboardEntry[];
  weeklyTotalsLeaderboard: { rank: number; count: number; displayName: string }[];
  todayCompletionCount: number;
  weeklyAlbumSlots: WeeklyAlbumSlot[];
  weeklyAlbumProgress: number;
  weeklyCompleted: number;
  weekRangeLabel: string;
  loadData: () => Promise<void>;
  rowAnimEpoch: number;
}

export function LeaderboardTab({
  leaderboardType,
  setLeaderboardType,
  weekSubview: _weekSubview,
  setWeekSubview: _setWeekSubview,
  allTimeGrid,
  setAllTimeGrid,
  filtersOpen,
  setFiltersOpen,
  cutTypeFilter,
  setCutTypeFilter,
  modifierFilter,
  setModifierFilter,
  leaderboard,
  weeklyTotalsLeaderboard,
  todayCompletionCount,
  weeklyAlbumSlots: _weeklyAlbumSlots,
  weeklyAlbumProgress: _weeklyAlbumProgress,
  weeklyCompleted,
  weekRangeLabel,
  loadData: _loadData,
  rowAnimEpoch,
}: LeaderboardTabProps) {
  const compact = true;

  return (
    <div className={`${styles.section} ${styles.leaderboardCard}`}>
      <h2 className={styles.leaderboardCardTitle}>Board</h2>
      <LeaderboardTabHeader
        leaderboardType={leaderboardType}
        setLeaderboardType={setLeaderboardType}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        cutTypeFilter={cutTypeFilter}
        setCutTypeFilter={setCutTypeFilter}
        modifierFilter={modifierFilter}
        setModifierFilter={setModifierFilter}
        allTimeGrid={allTimeGrid}
        setAllTimeGrid={setAllTimeGrid}
      />
      {(leaderboardType === "week" || leaderboardType === "alltime") && (
        <h2 className={styles.leaderboardSubtitle}>
          {leaderboardType === "week" && `Weekly Rankings (${weekRangeLabel})`}
          {leaderboardType === "alltime" && `All-time best (${allTimeGrid})`}
        </h2>
      )}
      {leaderboardType === "today" && (
        <p className={styles.todayCompletionCount} aria-live="polite">
          {todayCompletionCount} completion{todayCompletionCount !== 1 ? "s" : ""} so far
        </p>
      )}
      {leaderboardType === "week" && (
        <div className={styles.weekProgressStrip}>
          <span>Weekly Album Progress</span>
          <strong>{weeklyCompleted}</strong> <strong>/</strong> <strong>7</strong> days
        </div>
      )}
      {leaderboardType === "today" &&
        renderTimeList(
          leaderboard,
          "No completions yet. Be the first!",
          rowAnimEpoch,
          compact,
        )}
      {leaderboardType === "week" &&
        renderCompletionList(
          weeklyTotalsLeaderboard,
          rowAnimEpoch,
          compact,
          "No completions in the last 7 days.",
        )}
      {leaderboardType === "alltime" &&
        renderTimeList(
          leaderboard,
          "No completions for this grid size yet.",
          rowAnimEpoch,
          compact,
        )}
    </div>
  );
}
