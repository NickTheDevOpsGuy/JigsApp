/**
 * Daily puzzle leaderboard fetcher.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import type {
  LeaderboardEntry,
  VisualModifierFilter,
  PieceCutType,
} from "./leaderboardTypes";
import { resolveDisplayNames } from "./leaderboardFetchersShared";

export async function getDailyLeaderboard(
  dateStr: string,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];
  let query = supabase!
    .from("completions")
    .select("user_id, elapsed_seconds, created_at")
    .eq("puzzle_date", dateStr)
    .eq("is_daily", true);
  if (cutType !== "all") query = query.eq("cut_type", cutType);
  if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
  const { data, error } = await query
    .order("elapsed_seconds", { ascending: true })
    .limit(limit);
  if (error) return [];
  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await resolveDisplayNames(userIds, new Set());
  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: names.get(row.user_id) ?? "Player " + row.user_id.slice(0, 8),
    userId: row.user_id,
    completedAt: row.created_at,
  }));
}
