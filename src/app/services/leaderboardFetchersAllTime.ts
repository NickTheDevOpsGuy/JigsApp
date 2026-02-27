/**
 * All-time best leaderboard fetcher.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import type {
  LeaderboardEntry,
  VisualModifierFilter,
  PieceCutType,
} from "./leaderboardTypes";
import { resolveDisplayNames } from "./leaderboardFetchersShared";

export async function getAllTimeBestLeaderboard(
  rows: number,
  cols: number,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase!
    .from("completions")
    .select("user_id, elapsed_seconds, created_at")
    .eq("grid_rows", rows)
    .eq("grid_cols", cols);
  if (cutType !== "all") {
    query = query.eq("cut_type", cutType);
  }
  if (visualModifier !== "all") {
    query = query.eq("visual_modifier", visualModifier);
  }
  const { data, error } = await query.order("elapsed_seconds", { ascending: true });

  if (error) return [];

  const bestByUser = new Map<string, { elapsedSeconds: number; completedAt?: string }>();
  for (const row of data ?? []) {
    const cur = bestByUser.get(row.user_id);
    if (cur == null || row.elapsed_seconds < cur.elapsedSeconds) {
      bestByUser.set(row.user_id, {
        elapsedSeconds: row.elapsed_seconds,
        completedAt: row.created_at,
      });
    }
  }

  const sorted = [...bestByUser.entries()]
    .sort((a, b) => a[1].elapsedSeconds - b[1].elapsedSeconds)
    .slice(0, limit);

  const names = await resolveDisplayNames(
    sorted.map(([uid]) => uid),
    new Set(),
  );

  return sorted.map(([userId, { elapsedSeconds, completedAt }], i) => ({
    rank: i + 1,
    elapsedSeconds,
    displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
    completedAt,
  }));
}
