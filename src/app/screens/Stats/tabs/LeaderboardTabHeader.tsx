import { ChevronDown, Filter } from "lucide-react";
import type {
  PieceCutType,
  VisualModifierFilter,
  CompletionSourceFilter,
} from "@/services/leaderboard/leaderboardService";
import styles from "../StatsScreen.module.css";
import type { LeaderboardType } from "./LeaderboardTab";

interface LeaderboardTabHeaderProps {
  leaderboardType: LeaderboardType;
  setLeaderboardType: (t: LeaderboardType) => void;
  filtersOpen: boolean;
  setFiltersOpen: (f: boolean | ((prev: boolean) => boolean)) => void;
  cutTypeFilter: PieceCutType;
  setCutTypeFilter: (c: PieceCutType) => void;
  modifierFilter: VisualModifierFilter;
  setModifierFilter: (m: VisualModifierFilter) => void;
  sourceFilter: CompletionSourceFilter;
  setSourceFilter: (s: CompletionSourceFilter) => void;
  allTimeGrid: "3x3" | "4x4" | "5x5" | "6x6";
  setAllTimeGrid: (g: "3x3" | "4x4" | "5x5" | "6x6") => void;
}

export function LeaderboardTabHeader({
  leaderboardType,
  setLeaderboardType,
  filtersOpen,
  setFiltersOpen,
  cutTypeFilter,
  setCutTypeFilter,
  modifierFilter,
  setModifierFilter,
  sourceFilter,
  setSourceFilter,
  allTimeGrid,
  setAllTimeGrid,
}: LeaderboardTabHeaderProps) {
  return (
    <div className={styles.leaderboardHeader}>
      <div className={styles.boardModeSwitch} role="tablist" aria-label="Board mode">
        <button
          type="button"
          className={`${styles.boardModeBtn} ${leaderboardType === "today" ? styles.boardModeBtnActive : ""}`}
          onClick={() => setLeaderboardType("today")}
        >
          Today
        </button>
        <button
          type="button"
          className={`${styles.boardModeBtn} ${leaderboardType === "week" ? styles.boardModeBtnActive : ""}`}
          onClick={() => setLeaderboardType("week")}
        >
          Week
        </button>
        <button
          type="button"
          className={`${styles.boardModeBtn} ${leaderboardType === "alltime" ? styles.boardModeBtnActive : ""}`}
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
        <ChevronDown size={18} className={filtersOpen ? styles.filtersChevronOpen : ""} />
      </button>
      {filtersOpen && (
        <div className={styles.controlsRow}>
          {(leaderboardType === "today" ||
            leaderboardType === "week" ||
            leaderboardType === "alltime") && (
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
              <select
                id="source-select"
                className={styles.inlineFilterSelect}
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value as CompletionSourceFilter)
                }
                aria-label="Filter by source"
              >
                <option value="all">All Sources</option>
                <option value="daily">Daily</option>
                <option value="pack">Pack</option>
                <option value="custom">Custom</option>
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
  );
}
