/**
 * Shared leaderboard fetchers: display names, today count, weekly album, percentile.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { getUserId } from "@/supabase/auth";
import { getAnonymousDisplayName } from "@/data/anonymousNames";
import type { WeeklyAlbumCompletion, VisualModifierFilter } from "./leaderboardTypes";

export async function resolveDisplayNames(
  userIds: string[],
  useAnonymous: Set<string>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(userIds)];

  try {
    const { data: profiles } = await supabase!
      .from("player_profiles")
      .select("user_id, display_name, show_on_leaderboard")
      .in("user_id", unique);

    for (const p of profiles ?? []) {
      const name =
        p.show_on_leaderboard === false || useAnonymous.has(p.user_id)
          ? getAnonymousDisplayName(p.user_id)
          : (p.display_name ?? "Puzzler").trim() || "Puzzler";
      map.set(p.user_id, name);
    }
  } catch {
    // player_profiles may not exist yet
  }

  for (const uid of unique) {
    if (!map.has(uid)) {
      map.set(
        uid,
        useAnonymous.has(uid)
          ? getAnonymousDisplayName(uid)
          : `Player ${uid.slice(0, 8)}`,
      );
    }
  }
  return map;
}

export async function getTodayCompletionCount(dateStr: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { count, error } = await supabase!
    .from("completions")
    .select("id", { count: "exact", head: true })
    .eq("puzzle_date", dateStr)
    .eq("is_daily", true);

  if (error) return 0;
  return count ?? 0;
}

export async function getMyWeeklyAlbumCompletions(
  startDate: string,
  endDate: string,
): Promise<WeeklyAlbumCompletion[]> {
  if (!isSupabaseConfigured()) return [];

  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("puzzle_date, is_mastery")
    .eq("user_id", userId)
    .eq("is_daily", true)
    .gte("puzzle_date", startDate)
    .lte("puzzle_date", endDate)
    .order("puzzle_date", { ascending: true });

  if (error || !data) return [];

  const byDate = new Map<string, { completed: boolean; mastery: boolean }>();
  for (const row of data) {
    const cur = byDate.get(row.puzzle_date) ?? { completed: false, mastery: false };
    cur.completed = true;
    cur.mastery = cur.mastery || row.is_mastery === true;
    byDate.set(row.puzzle_date, cur);
  }

  return [...byDate.entries()].map(([date, flags]) => ({
    date,
    completed: flags.completed,
    mastery: flags.mastery,
  }));
}

export function subscribeTodayCompletionCount(
  dateStr: string,
  onCount: (count: number) => void,
): () => void {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  const channelName = `daily-completions:${dateStr}`;
  const channel = supabase.channel(channelName);

  const refetch = async () => {
    const count = await getTodayCompletionCount(dateStr);
    onCount(count);
  };

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "completions",
      filter: `puzzle_date=eq.${dateStr}`,
    },
    () => {
      refetch();
    },
  );

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await refetch();
    }
  });

  return () => supabase!.removeChannel(channel);
}

export async function getPercentileRank(
  rows: number,
  cols: number,
  elapsedSeconds: number,
  visualModifier: Exclude<VisualModifierFilter, "all"> = "none",
): Promise<{ topPercent: number; totalPlayers: number } | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from("completions")
    .select("user_id, elapsed_seconds")
    .eq("grid_rows", rows)
    .eq("grid_cols", cols);
  query = query.eq("visual_modifier", visualModifier);
  const { data, error } = await query.order("elapsed_seconds", { ascending: true });

  if (error || !data || data.length === 0) return null;

  const bestByUser = new Map<string, number>();
  for (const row of data) {
    const cur = bestByUser.get(row.user_id);
    if (cur == null || row.elapsed_seconds < cur) {
      bestByUser.set(row.user_id, row.elapsed_seconds);
    }
  }

  const userId = await getUserId();
  if (userId) bestByUser.delete(userId);

  const sortedTimes = [...bestByUser.values()].sort((a, b) => a - b);
  const withCurrent = [...sortedTimes, elapsedSeconds].sort((a, b) => a - b);
  const rank = withCurrent.indexOf(elapsedSeconds) + 1;
  const total = withCurrent.length;
  const topPercent = Math.round(((total - rank + 1) / total) * 100);

  return { topPercent, totalPlayers: total };
}
