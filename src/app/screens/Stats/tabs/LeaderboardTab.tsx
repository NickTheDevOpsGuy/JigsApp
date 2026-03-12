/**
 * LeaderboardTab – Today / Week / All-time leaderboards, filters, weekly album.
 */
import type {
  LeaderboardEntry,
  EfficiencyEntry,
} from "@/services/leaderboard/leaderboardService";
import type {
  PieceCutType,
  VisualModifierFilter,
  CompletionSourceFilter,
} from "@/services/leaderboard/leaderboardService";
import {
  renderTimeList,
  renderCompletionList,
  renderEfficiencyList,
} from "./LeaderboardTabLists";
import { LeaderboardTabHeader } from "./LeaderboardTabHeader";
import styles from "../StatsScreen.module.css";

export type LeaderboardType = "today" | "week" | "alltime" | "efficiency";
export type LeaderboardSortMetric = "time" | "moves" | "cleanest";
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
  leaderboardMetric: LeaderboardSortMetric;
  setLeaderboardMetric: (m: LeaderboardSortMetric) => void;
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
  sourceFilter: CompletionSourceFilter;
  setSourceFilter: (s: CompletionSourceFilter) => void;
  leaderboard: LeaderboardEntry[];
  efficiencyLeaderboard: EfficiencyEntry[];
  weeklyTotalsLeaderboard: {
    rank: number;
    count: number;
    displayName: string;
    userId?: string;
  }[];
  todayCompletionCount: number;
  currentUserId: string | null;
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
  leaderboardMetric,
  setLeaderboardMetric,
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
  sourceFilter,
  setSourceFilter,
  leaderboard,
  efficiencyLeaderboard,
  weeklyTotalsLeaderboard,
  todayCompletionCount,
  currentUserId,
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
        leaderboardMetric={leaderboardMetric}
        setLeaderboardMetric={setLeaderboardMetric}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        cutTypeFilter={cutTypeFilter}
        setCutTypeFilter={setCutTypeFilter}
        modifierFilter={modifierFilter}
        setModifierFilter={setModifierFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        allTimeGrid={allTimeGrid}
        setAllTimeGrid={setAllTimeGrid}
      />
      {(leaderboardType === "week" ||
        leaderboardType === "alltime" ||
        leaderboardType === "efficiency") && (
        <h2 className={styles.leaderboardSubtitle}>
          {leaderboardType === "week" && `Weekly Rankings (${weekRangeLabel})`}
          {leaderboardType === "alltime" && `All-time best (${allTimeGrid})`}
          {leaderboardType === "efficiency" && `Weekly efficiency (${weekRangeLabel})`}
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
          false,
          currentUserId ?? undefined,
        )}
      {leaderboardType === "week" &&
        renderCompletionList(
          weeklyTotalsLeaderboard,
          rowAnimEpoch,
          compact,
          "No completions in the last 7 days.",
          currentUserId ?? undefined,
        )}
      {leaderboardType === "alltime" &&
        renderTimeList(
          leaderboard,
          "No completions for this grid size yet.",
          rowAnimEpoch,
          compact,
          false,
          currentUserId ?? undefined,
        )}
      {leaderboardType === "efficiency" &&
        renderEfficiencyList(
          efficiencyLeaderboard,
          rowAnimEpoch,
          compact,
          "No completions with moves recorded this week.",
          currentUserId ?? undefined,
        )}
    </div>
  );
}
