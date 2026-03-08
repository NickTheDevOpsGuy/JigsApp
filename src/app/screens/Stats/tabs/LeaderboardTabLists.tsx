/**
 * LeaderboardTabLists – render time-based and completion-count leaderboard lists.
 */
import type { LeaderboardEntry } from "@/services/leaderboard/leaderboardService";
import { formatTime, formatGap, PODIUM } from "../statsFormatting";
import styles from "../StatsScreen.module.css";

export function renderTimeList(
  entries: LeaderboardEntry[],
  emptyMsg: string,
  rowAnimEpoch: number,
  compact: boolean,
  showChampionBadge = false,
) {
  if (entries.length === 0) return <p className={styles.empty}>{emptyMsg}</p>;
  return (
    <ol className={`${styles.leaderboard} ${compact ? styles.leaderboardCompact : ""}`}>
      {entries.map((entry, index) => {
        const key = `time-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
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
            } ${styles.leaderboardRowEnter}`}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <span className={styles.rank}>
              {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className={styles.player}>
              {entry.displayName}
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
  entries: { rank: number; count: number; displayName: string }[],
  rowAnimEpoch: number,
  compact: boolean,
  emptyMsg = "No completions yet. Play puzzles!",
) {
  if (entries.length === 0) return <p className={styles.empty}>{emptyMsg}</p>;
  return (
    <ol className={`${styles.leaderboard} ${compact ? styles.leaderboardCompact : ""}`}>
      {entries.map((entry) => {
        const key = `completion-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
        return (
          <li
            key={key}
            className={`${styles.leaderboardItem} ${
              entry.rank <= 3 ? styles.leaderboardPodium : ""
            } ${styles.leaderboardRowEnter}`}
            style={{ animationDelay: `${(entry.rank - 1) * 45}ms` }}
          >
            <span className={styles.rank}>
              {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className={styles.player}>{entry.displayName}</span>
            <span className={styles.time}>{entry.count} puzzles</span>
          </li>
        );
      })}
    </ol>
  );
}
