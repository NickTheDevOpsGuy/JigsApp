/**
 * Streak and completion count leaderboard fetchers.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import type { StreakEntry, CompletionCountEntry } from "./leaderboardTypes";
import { resolveDisplayNames } from "./leaderboardFetchersShared";

export async function getStreakLeaderboard(limit = 10): Promise<StreakEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("player_stats")
    .select("user_id, best_daily_streak")
    .gt("best_daily_streak", 0)
    .order("best_daily_streak", { ascending: false })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await resolveDisplayNames(userIds, new Set());

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    streak: row.best_daily_streak,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
  }));
}

export async function getMasteryStreakLeaderboard(limit = 10): Promise<StreakEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("player_stats")
    .select("user_id, best_mastery_streak")
    .gt("best_mastery_streak", 0)
    .order("best_mastery_streak", { ascending: false })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await resolveDisplayNames(userIds, new Set());

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    streak: row.best_mastery_streak,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
  }));
}

export async function getCompletionCountLeaderboard(
  limit = 10,
): Promise<CompletionCountEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("player_stats")
    .select("user_id, puzzles_completed")
    .gt("puzzles_completed", 0)
    .order("puzzles_completed", { ascending: false })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await resolveDisplayNames(userIds, new Set());

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    count: row.puzzles_completed,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
  }));
}
