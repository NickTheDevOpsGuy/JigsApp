/**
 * Leaderboard types and calendar utility.
 */

export type LeaderboardEntry = {
  rank: number;
  elapsedSeconds: number;
  displayName: string;
  userId?: string;
  /** ISO timestamp when the puzzle was completed (for "Completed at" display). */
  completedAt?: string;
};

export type StreakEntry = {
  rank: number;
  streak: number;
  displayName: string;
};

export type CompletionCountEntry = {
  rank: number;
  count: number;
  displayName: string;
};

export type PersonalBestEntry = {
  date: string;
  elapsedSeconds: number;
  gridSize: string;
  isDaily: boolean;
};

export type WeeklyAlbumCompletion = {
  date: string;
  completed: boolean;
  mastery: boolean;
};

export type VisualModifierFilter = "all" | "none" | "fog" | "night" | "sepia";

export type PieceCutType = "classic" | "irregular" | "hard" | "all";

/** Calendar week range (Mon-Sun) for a reference date string (YYYY-MM-DD). */
export function getCalendarWeekRange(referenceDate: string): {
  start: string;
  end: string;
} {
  const ref = new Date(`${referenceDate}T00:00:00.000Z`);
  const day = ref.getUTCDay(); // Sun=0..Sat=6
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}
