/**
 * LeaderboardList – generic expandable leaderboard for time, streak, and completion entries.
 */
import type {
  LeaderboardEntry,
  StreakEntry,
  CompletionCountEntry,
} from "@/services/leaderboardService";
import { formatTime } from "@/screens/Play/playUtils";
import styles from "./StatsScreen.module.css";

const PODIUM = ["🥇", "🥈", "🥉"];

type LeaderboardEntryType = LeaderboardEntry | StreakEntry | CompletionCountEntry;

interface LeaderboardListProps {
  entries: LeaderboardEntryType[];
  emptyMsg: string;
  compact: boolean;
  expandedRowKey: string | null;
  onToggleExpand: (key: string | null) => void;
  /** For time entries: elapsed seconds. For streak: streak count. For completion: count. */
  getValue: (entry: LeaderboardEntryType) => React.ReactNode;
  /** Optional flair after player name (e.g. streak flame) */
  getFlair?: (entry: LeaderboardEntryType) => React.ReactNode;
  /** Expanded detail content */
  getDetail?: (entry: LeaderboardEntryType) => React.ReactNode;
  keyPrefix: string;
}

export function LeaderboardList({
  entries,
  emptyMsg,
  compact,
  expandedRowKey,
  onToggleExpand,
  getValue,
  getFlair,
  getDetail,
  keyPrefix,
}: LeaderboardListProps) {
  if (entries.length === 0) return <p className={styles.empty}>{emptyMsg}</p>;

  return (
    <ol className={`${styles.leaderboard} ${compact ? styles.leaderboardCompact : ""}`}>
      {entries.map((entry, i) => {
        const key = `${keyPrefix}-${entry.rank}-${"displayName" in entry ? entry.displayName : ""}`;
        const isExpanded = expandedRowKey === key;
        return (
          <li
            key={key}
            className={`${styles.leaderboardItem} ${
              entry.rank <= 3 ? styles.leaderboardPodium : ""
            } ${isExpanded ? styles.leaderboardItemExpanded : ""}`}
            onClick={() => onToggleExpand(isExpanded ? null : key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleExpand(isExpanded ? null : key);
              }
            }}
          >
            <span className={styles.rank}>
              {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className={styles.player}>
              {"displayName" in entry && entry.displayName}
              {getFlair?.(entry)}
            </span>
            <span className={styles.time}>{getValue(entry)}</span>
            {isExpanded && getDetail?.(entry) && (
              <div className={styles.leaderboardDetail}>{getDetail(entry)}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Preset for time-based leaderboards (elapsed seconds). */
export function TimeLeaderboardList(
  props: Omit<
    LeaderboardListProps,
    "getValue" | "getFlair" | "getDetail" | "keyPrefix"
  > & {
    entries: LeaderboardEntry[];
  },
) {
  return (
    <LeaderboardList
      {...props}
      keyPrefix="time"
      getValue={(e) => formatTime((e as LeaderboardEntry).elapsedSeconds)}
      getFlair={(e) =>
        (e as LeaderboardEntry).streakFlair ? (
          <span className={styles.streakFlame} aria-label="Streak holder">
            {(e as LeaderboardEntry).streakFlair}
          </span>
        ) : null
      }
      getDetail={(e) => {
        const entry = e as LeaderboardEntry;
        return (
          <>
            {Math.floor(entry.elapsedSeconds / 60)}m {entry.elapsedSeconds % 60}s
          </>
        );
      }}
    />
  );
}

/** Preset for streak leaderboards. */
export function StreakLeaderboardList(
  props: Omit<LeaderboardListProps, "getValue" | "getDetail" | "keyPrefix"> & {
    entries: StreakEntry[];
  },
) {
  return (
    <LeaderboardList
      {...props}
      keyPrefix="streak"
      getValue={(e) => `${(e as StreakEntry).streak} days`}
      getDetail={(e) => `${(e as StreakEntry).streak} day streak`}
    />
  );
}

/** Preset for completion count leaderboards. */
export function CompletionLeaderboardList(
  props: Omit<LeaderboardListProps, "getValue" | "getDetail" | "keyPrefix"> & {
    entries: CompletionCountEntry[];
  },
) {
  return (
    <LeaderboardList
      {...props}
      keyPrefix="completion"
      getValue={(e) => `${(e as CompletionCountEntry).count} puzzles`}
      getDetail={(e) => `${(e as CompletionCountEntry).count} total puzzles completed`}
    />
  );
}
