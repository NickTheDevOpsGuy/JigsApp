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

/** Anonymize user ID for display (show first 8 chars). */
function anonymizeUserId(userId: string): string {
  return `Player ${userId.slice(0, 8)}`;
}
