import { supabase, isSupabaseConfigured } from "@/supabase/client";

export type LeaderboardEntry = {
  rank: number;
  elapsedSeconds: number;
  displayName: string;
};

/** Fetch daily puzzle leaderboard for a given date. */
export async function getDailyLeaderboard(
  dateStr: string,
  limit = 10,
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

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: anonymizeUserId(row.user_id),
  }));
}

/** Fetch best times leaderboard for a grid size (rows x cols). */
export async function getGridLeaderboard(
  gridRows: number,
  gridCols: number,
  limit = 10,
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

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: anonymizeUserId(row.user_id),
  }));
}

/** Get user's rank for a given completion time on daily puzzle. Returns null if not found. */
export async function getDailyRankForTime(
  dateStr: string,
  elapsedSeconds: number,
): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from("completions")
    .select("elapsed_seconds")
    .eq("puzzle_date", dateStr)
    .eq("is_daily", true)
    .order("elapsed_seconds", { ascending: true });

  if (error || !data) return null;

  const idx = data.findIndex((row) => row.elapsed_seconds >= elapsedSeconds);
  return idx >= 0 ? idx + 1 : data.length + 1;
}

/** Anonymize user ID for display (show first 8 chars). */
function anonymizeUserId(userId: string): string {
  return `Player ${userId.slice(0, 8)}`;
}
