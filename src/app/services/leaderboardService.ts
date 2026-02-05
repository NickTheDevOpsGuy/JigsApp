import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { getUserId } from "@/supabase/auth";
import { getDisplayName } from "./profileService";
import { getTodayDateString } from "@/daily/dailyPuzzle";

export type LeaderboardEntry = {
  rank: number;
  elapsedSeconds: number;
  displayName: string;
  userId: string;
  isYou?: boolean;
};

export type LeaderboardType =
  | "daily" // Today's daily puzzle
  | "daily-date" // Historical daily (specific date)
  | "all-time" // Best times by grid size (all puzzles)
  | "weekly" // Last 7 days
  | "monthly" // Last 30 days
  | "streak" // Longest daily streaks
  | "completions"; // Most puzzles completed

/** Get date string for N days ago */
function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Fetch display names for multiple user IDs */
async function fetchDisplayNames(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(userIds)];
  for (const id of unique) {
    map.set(id, await getDisplayName(id));
  }
  return map;
}

/** Daily puzzle leaderboard (today or specific date). */
export async function getDailyLeaderboard(
  dateStr: string,
  limit = 25,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds")
    .eq("puzzle_date", dateStr)
    .eq("is_daily", true)
    .order("elapsed_seconds", { ascending: true })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await fetchDisplayNames(userIds);
  const myId = await getUserId();

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
    userId: row.user_id,
    isYou: myId === row.user_id,
  }));
}

/** All-time best times by grid size. */
export async function getAllTimeLeaderboard(
  gridRows: number,
  gridCols: number,
  limit = 25,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds")
    .eq("grid_rows", gridRows)
    .eq("grid_cols", gridCols)
    .order("elapsed_seconds", { ascending: true })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await fetchDisplayNames(userIds);
  const myId = await getUserId();

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
    userId: row.user_id,
    isYou: myId === row.user_id,
  }));
}

/** Weekly leaderboard (last 7 days, daily puzzles only). */
export async function getWeeklyLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = getTodayDateString();
  const startDate = getDateDaysAgo(6);

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds")
    .eq("is_daily", true)
    .gte("puzzle_date", startDate)
    .lte("puzzle_date", endDate)
    .order("elapsed_seconds", { ascending: true })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await fetchDisplayNames(userIds);
  const myId = await getUserId();

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
    userId: row.user_id,
    isYou: myId === row.user_id,
  }));
}

/** Monthly leaderboard (last 30 days, daily puzzles only). */
export async function getMonthlyLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = getTodayDateString();
  const startDate = getDateDaysAgo(29);

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds")
    .eq("is_daily", true)
    .gte("puzzle_date", startDate)
    .lte("puzzle_date", endDate)
    .order("elapsed_seconds", { ascending: true })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await fetchDisplayNames(userIds);
  const myId = await getUserId();

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
    userId: row.user_id,
    isYou: myId === row.user_id,
  }));
}

/** Streak leaderboard – longest daily streaks. */
export async function getStreakLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("player_stats")
    .select("user_id, daily_streak")
    .order("daily_streak", { ascending: false })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await fetchDisplayNames(userIds);
  const myId = await getUserId();

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.daily_streak,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
    userId: row.user_id,
    isYou: myId === row.user_id,
  }));
}

/** Completions leaderboard – most puzzles completed. */
export async function getCompletionsLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("player_stats")
    .select("user_id, puzzles_completed")
    .order("puzzles_completed", { ascending: false })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await fetchDisplayNames(userIds);
  const myId = await getUserId();

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.puzzles_completed,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
    userId: row.user_id,
    isYou: myId === row.user_id,
  }));
}

/** Get current user's rank on today's daily leaderboard. */
export async function getMyDailyRank(): Promise<{
  rank: number;
  total: number;
  secondsBehindAbove?: number;
} | null> {
  if (!isSupabaseConfigured()) return null;

  const myId = await getUserId();
  if (!myId) return null;

  const dateStr = getTodayDateString();

  const { data: all } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds")
    .eq("puzzle_date", dateStr)
    .eq("is_daily", true)
    .order("elapsed_seconds", { ascending: true });

  if (!all || all.length === 0) return null;

  const myIndex = all.findIndex((r) => r.user_id === myId);
  if (myIndex < 0) return null;

  const above = all[myIndex - 1];
  const secondsBehindAbove = above
    ? all[myIndex].elapsed_seconds - above.elapsed_seconds
    : undefined;

  return {
    rank: myIndex + 1,
    total: all.length,
    secondsBehindAbove,
  };
}
