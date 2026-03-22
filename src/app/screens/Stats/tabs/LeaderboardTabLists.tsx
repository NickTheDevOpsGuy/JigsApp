/**
 * LeaderboardTabLists – render time-based, completion-count, and efficiency leaderboard lists.
 */
import type {
  LeaderboardEntry,
  EfficiencyEntry,
} from "@/services/leaderboard/leaderboardService";
import { formatTime, formatGap, PODIUM } from "../statsFormatting";
import {
  LeaderboardEmptyState,
  LeaderboardRow,
  LeaderboardRows,
} from "../components/LeaderboardModule";

export function renderTimeList(
  entries: LeaderboardEntry[],
  emptyMsg: string,
  rowAnimEpoch: number,
  _compact: boolean,
  showChampionBadge = false,
  currentUserId?: string,
) {
  if (entries.length === 0) {
    return <LeaderboardEmptyState title="No scores yet" text={`🏆 ${emptyMsg}`} />;
  }
  return (
    <LeaderboardRows>
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
          <LeaderboardRow
            key={key}
            rankLabel={entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            name={`${entry.displayName}${isYou ? " (You)" : ""}${showChampionBadge && entry.rank === 1 ? " 🏆" : ""}`}
            meta={gapInfo ?? undefined}
            metric={formatTime(entry.elapsedSeconds)}
            secondaryMetric={
              entry.moveCount != null || entry.undoCount != null
                ? `${entry.moveCount != null ? `${entry.moveCount} moves` : ""}${entry.moveCount != null && entry.undoCount != null ? " · " : ""}${entry.undoCount != null ? `${entry.undoCount} undos` : ""}`
                : undefined
            }
            isCurrentPlayer={isYou}
            isPodium={entry.rank <= 3}
          />
        );
      })}
    </LeaderboardRows>
  );
}

export function renderCompletionList(
  entries: { rank: number; count: number; displayName: string; userId?: string }[],
  rowAnimEpoch: number,
  _compact: boolean,
  emptyMsg = "No completions yet. Play puzzles!",
  currentUserId?: string,
) {
  if (entries.length === 0) {
    return <LeaderboardEmptyState title="Nothing posted yet" text={emptyMsg} />;
  }
  return (
    <LeaderboardRows>
      {entries.map((entry) => {
        const key = `completion-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
        const isYou = currentUserId != null && entry.userId === currentUserId;
        return (
          <LeaderboardRow
            key={key}
            rankLabel={entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            name={`${entry.displayName}${isYou ? " (You)" : ""}`}
            metric={`${entry.count} puzzles`}
            secondaryMetric="Weekly completions"
            isCurrentPlayer={isYou}
            isPodium={entry.rank <= 3}
          />
        );
      })}
    </LeaderboardRows>
  );
}

export function renderEfficiencyList(
  entries: EfficiencyEntry[],
  rowAnimEpoch: number,
  _compact: boolean,
  emptyMsg = "No efficiency data this week.",
  currentUserId?: string,
) {
  if (entries.length === 0) {
    return <LeaderboardEmptyState title="No efficiency runs yet" text={emptyMsg} />;
  }
  return (
    <LeaderboardRows>
      {entries.map((entry) => {
        const key = `efficiency-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
        const isYou = currentUserId != null && entry.userId === currentUserId;
        return (
          <LeaderboardRow
            key={key}
            rankLabel={entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
            name={`${entry.displayName}${isYou ? " (You)" : ""}`}
            metric={`${entry.efficiencySecPerMove.toFixed(1)} s/move`}
            secondaryMetric={`${formatTime(entry.elapsedSeconds)} · ${entry.moveCount} moves`}
            isCurrentPlayer={isYou}
            isPodium={entry.rank <= 3}
          />
        );
      })}
    </LeaderboardRows>
  );
}
