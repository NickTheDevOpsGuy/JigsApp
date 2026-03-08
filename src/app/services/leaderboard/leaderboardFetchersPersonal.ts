/**
 * Personal bests fetcher.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { getUserId } from "@/supabase/auth";
import type { PersonalBestEntry } from "./leaderboardTypes";

export async function getMyPersonalBests(limit = 20): Promise<PersonalBestEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("puzzle_date, elapsed_seconds, grid_rows, grid_cols, is_daily")
    .eq("user_id", userId)
    .order("puzzle_date", { ascending: false })
    .order("elapsed_seconds", { ascending: true })
    .limit(limit * 3);

  if (error) return [];

  const byGrid = new Map<string, PersonalBestEntry>();
  for (const row of data ?? []) {
    const key = `${row.grid_rows}x${row.grid_cols}`;
    if (!byGrid.has(key)) {
      byGrid.set(key, {
        date: row.puzzle_date,
        elapsedSeconds: row.elapsed_seconds,
        gridSize: `${row.grid_rows}×${row.grid_cols}`,
        isDaily: row.is_daily,
      });
    }
    if (byGrid.size >= limit) break;
  }

  return [...byGrid.values()].slice(0, limit);
}
