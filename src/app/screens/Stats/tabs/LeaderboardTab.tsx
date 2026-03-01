/**
 * LeaderboardTab – Today / Week / All-time leaderboards, filters, weekly album.
 */
import { Filter, ChevronDown } from "lucide-react";
import type { LeaderboardEntry } from "@/services/leaderboardService";
import type { PieceCutType, VisualModifierFilter } from "@/services/leaderboardService";
import { renderTimeList, renderCompletionList } from "./LeaderboardTabLists";
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
      <div className={styles.leaderboardHeader}>
        <div className={styles.boardModeSwitch} role="tablist" aria-label="Board mode">
          <button
            type="button"
            className={`${styles.boardModeBtn} ${
              leaderboardType === "today" ? styles.boardModeBtnActive : ""
            }`}
            onClick={() => setLeaderboardType("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={`${styles.boardModeBtn} ${
              leaderboardType === "week" ? styles.boardModeBtnActive : ""
            }`}
            onClick={() => setLeaderboardType("week")}
          >
            Week
          </button>
          <button
            type="button"
            className={`${styles.boardModeBtn} ${
              leaderboardType === "alltime" ? styles.boardModeBtnActive : ""
            }`}
            onClick={() => setLeaderboardType("alltime")}
          >
            All-time
          </button>
        </div>
        <button
          type="button"
          className={styles.filtersBar}
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-label="Filters"
        >
          <Filter size={18} />
          <span>Filters</span>
          <ChevronDown
            size={18}
            className={filtersOpen ? styles.filtersChevronOpen : ""}
          />
        </button>
        {filtersOpen && (
          <div className={styles.controlsRow}>
            {(leaderboardType === "today" || leaderboardType === "alltime") && (
              <>
                <select
                  id="cut-type-select"
                  className={styles.inlineFilterSelect}
                  value={cutTypeFilter}
                  onChange={(e) => setCutTypeFilter(e.target.value as PieceCutType)}
                  aria-label="Filter by shape"
                >
                  <option value="all">All Shapes</option>
                  <option value="classic">Classic Shape</option>
                  <option value="irregular">Irregular Shape</option>
                  <option value="hard">Hard Shape</option>
                </select>
                <select
                  id="modifier-select"
                  className={styles.inlineFilterSelect}
                  value={modifierFilter}
                  onChange={(e) =>
                    setModifierFilter(e.target.value as VisualModifierFilter)
                  }
                  aria-label="Filter by modifier"
                >
                  <option value="all">All Modifiers</option>
                  <option value="none">No Modifier</option>
                  <option value="fog">Fog Modifier</option>
                  <option value="night">Night Modifier</option>
                  <option value="sepia">Sepia Modifier</option>
                </select>
              </>
            )}
            {leaderboardType === "alltime" && (
              <select
                id="alltime-grid-select"
                className={styles.inlineFilterSelect}
                value={allTimeGrid}
                onChange={(e) =>
                  setAllTimeGrid(e.target.value as "3x3" | "4x4" | "5x5" | "6x6")
                }
                aria-label="Filter all-time by grid size"
              >
                <option value="3x3">3x3 Grid</option>
                <option value="4x4">4x4 Grid</option>
                <option value="5x5">5x5 Grid</option>
                <option value="6x6">6x6 Grid</option>
              </select>
            )}
          </div>
        )}
      </div>
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
