/**
 * LeaderboardTabLists – render time-based, completion-count, and efficiency leaderboard lists.
 */
import type {
  LeaderboardEntry,
  EfficiencyEntry,
} from "@/services/leaderboard/leaderboardService";
import { formatTime, formatGap, PODIUM } from "../statsFormatting";
import styles from "../StatsScreen.module.css";

export function renderTimeList(
  entries: LeaderboardEntry[],
  emptyMsg: string,
  rowAnimEpoch: number,
  compact: boolean,
  showChampionBadge = false,
  currentUserId?: string,
) {
  if (entries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateTitle}>No scores yet</p>
        <p className={styles.emptyStateText}>{emptyMsg}</p>
      </div>
    );
  }
  return (
    <ol className={`${styles.leaderboard} ${compact ? styles.leaderboardCompact : ""}`}>
      {entries.map((entry, index) => {
        const key = `time-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
        const isYou = currentUserId != null && entry.userId === currentUserId;
        const next = entries[index + 1]?.elapsedSeconds;
        const gapInfo =
          index === 0 && typeof next === "number"
            ? `+${formatGap(next - entry.elapsedSeconds)} ahead of #2`
            : index === 1 && typeof next === "number"
              ? `+${formatGap(next - entry.elapsedSeconds)} ahead of #3`
              : null;
        return (
          <li
            key={key}
            className={`${styles.leaderboardItem} ${
              entry.rank <= 3 ? styles.leaderboardPodium : ""
            } ${isYou ? styles.leaderboardItemYou : ""} ${styles.leaderboardRowEnter}`}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <span className={styles.rank}>
              {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className={styles.player}>
              {entry.displayName}
              {isYou && <span className={styles.youLabel}> (You)</span>}
              {showChampionBadge && entry.rank === 1 && (
                <span className={styles.championBadge} title="Challenge winner">
                  {" "}
                  🏆
                </span>
              )}
            </span>
            <span className={styles.timeCol}>
              <span className={styles.time}>{formatTime(entry.elapsedSeconds)}</span>
              {gapInfo && <span className={styles.gapInfo}>{gapInfo}</span>}
              {(entry.moveCount != null || entry.undoCount != null) && (
                <span className={styles.movesInfo} aria-label="Moves and undos">
                  {entry.moveCount != null && `${entry.moveCount} moves`}
                  {entry.moveCount != null && entry.undoCount != null && " · "}
                  {entry.undoCount != null && `${entry.undoCount} undos`}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function renderCompletionList(
  entries: { rank: number; count: number; displayName: string; userId?: string }[],
  rowAnimEpoch: number,
  compact: boolean,
  emptyMsg = "No completions yet. Play puzzles!",
  currentUserId?: string,
) {
  if (entries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateTitle}>Nothing posted yet</p>
        <p className={styles.emptyStateText}>{emptyMsg}</p>
      </div>
    );
  }
  return (
    <ol className={`${styles.leaderboard} ${compact ? styles.leaderboardCompact : ""}`}>
      {entries.map((entry) => {
        const key = `completion-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
        const isYou = currentUserId != null && entry.userId === currentUserId;
        return (
          <li
            key={key}
            className={`${styles.leaderboardItem} ${
              entry.rank <= 3 ? styles.leaderboardPodium : ""
            } ${isYou ? styles.leaderboardItemYou : ""} ${styles.leaderboardRowEnter}`}
            style={{ animationDelay: `${(entry.rank - 1) * 45}ms` }}
          >
            <span className={styles.rank}>
              {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className={styles.player}>
              {entry.displayName}
              {isYou && <span className={styles.youLabel}> (You)</span>}
            </span>
            <span className={styles.time}>{entry.count} puzzles</span>
          </li>
        );
      })}
    </ol>
  );
}

export function renderEfficiencyList(
  entries: EfficiencyEntry[],
  rowAnimEpoch: number,
  compact: boolean,
  emptyMsg = "No efficiency data this week.",
  currentUserId?: string,
) {
  if (entries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateTitle}>No efficiency runs yet</p>
        <p className={styles.emptyStateText}>{emptyMsg}</p>
      </div>
    );
  }
  return (
    <ol className={`${styles.leaderboard} ${compact ? styles.leaderboardCompact : ""}`}>
      {entries.map((entry) => {
        const key = `efficiency-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
        const isYou = currentUserId != null && entry.userId === currentUserId;
        return (
          <li
            key={key}
            className={`${styles.leaderboardItem} ${
              entry.rank <= 3 ? styles.leaderboardPodium : ""
            } ${isYou ? styles.leaderboardItemYou : ""} ${styles.leaderboardRowEnter}`}
            style={{ animationDelay: `${(entry.rank - 1) * 45}ms` }}
          >
            <span className={styles.rank}>
              {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className={styles.player}>
              {entry.displayName}
              {isYou && <span className={styles.youLabel}> (You)</span>}
            </span>
            <span className={styles.timeCol}>
              <span className={styles.time}>
                {entry.efficiencySecPerMove.toFixed(1)} s/move
              </span>
              <span className={styles.movesInfo}>
                {formatTime(entry.elapsedSeconds)} · {entry.moveCount} moves
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
