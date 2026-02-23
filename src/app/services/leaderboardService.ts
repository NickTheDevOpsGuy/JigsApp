/**
 * leaderboardService – daily, streaks, completion count, personal bests; anonymous names.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { getUserId } from "@/supabase/auth";
import { getAnonymousDisplayName } from "@/data/anonymousNames";

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

/** Resolve display names from user IDs. Anonymous mode (show_on_leaderboard = false) → fun raccoon name. */
async function resolveDisplayNames(
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

/** Fetch today's daily puzzle completion count (for live counter). */
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

/** Subscribe to realtime updates of today's completion count. Requires completions in Supabase Realtime publication. */
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

/** Get percentile rank for a completion time at a given grid size. Returns "Top X%" (e.g. Top 12). */
export async function getPercentileRank(
  rows: number,
  cols: number,
  elapsedSeconds: number,
): Promise<{ topPercent: number; totalPlayers: number } | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds")
    .eq("grid_rows", rows)
    .eq("grid_cols", cols)
    .order("elapsed_seconds", { ascending: true });

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

/** Fetch daily puzzle leaderboard for a given date. */
export async function getDailyLeaderboard(
  dateStr: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds, created_at")
    .eq("puzzle_date", dateStr)
    .eq("is_daily", true)
    .order("elapsed_seconds", { ascending: true })
    .limit(limit);

  if (error) return [];

  const userIds = (data ?? []).map((r) => r.user_id);
  const names = await resolveDisplayNames(userIds, new Set());

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    elapsedSeconds: row.elapsed_seconds,
    displayName: names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`,
    userId: row.user_id,
    completedAt: row.created_at,
  }));
}

/** Fetch streak leaderboard (best daily streaks). */
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

/** Fetch completion count leaderboard. */
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

/** Fetch all-time best times per grid size (best per user). */
export async function getAllTimeBestLeaderboard(
  rows: number,
  cols: number,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds, created_at")
    .eq("grid_rows", rows)
    .eq("grid_cols", cols)
    .order("elapsed_seconds", { ascending: true });

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

/** Get date range for weekly (last 7 days) and monthly (last 30 days). */
function getDateRange(period: "week" | "month"): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  if (period === "week") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/** Fetch weekly or monthly daily puzzle leaderboard (best time in period). */
export async function getPeriodLeaderboard(
  period: "week" | "month",
  limit = 10,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { start, end } = getDateRange(period);

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds, created_at")
    .eq("is_daily", true)
    .gte("puzzle_date", start)
    .lte("puzzle_date", end)
    .order("elapsed_seconds", { ascending: true });

  if (error) return [];

  // Best time per user in period (keep created_at of best completion)
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

/** Fetch weekly totals leaderboard (completion count in last 7 days). Respects anonymous (show_on_leaderboard). */
export async function getWeeklyTotalsLeaderboard(
  limit = 10,
): Promise<CompletionCountEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { start, end } = getDateRange("week");

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id")
    .gte("puzzle_date", start)
    .lte("puzzle_date", end);

  if (error) return [];

  const countByUser = new Map<string, number>();
  for (const row of data ?? []) {
    countByUser.set(row.user_id, (countByUser.get(row.user_id) ?? 0) + 1);
  }

  const sorted = [...countByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

  const names = await resolveDisplayNames(
    sorted.map(([uid]) => uid),
    new Set(),
  );

  return sorted.map(([userId, count], i) => ({
    rank: i + 1,
    count,
    displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
  }));
}

/** Fetch monthly totals leaderboard (completion count in last 30 days). Respects anonymous (show_on_leaderboard). */
export async function getMonthlyTotalsLeaderboard(
  limit = 10,
): Promise<CompletionCountEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { start, end } = getDateRange("month");

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id")
    .gte("puzzle_date", start)
    .lte("puzzle_date", end);

  if (error) return [];

  const countByUser = new Map<string, number>();
  for (const row of data ?? []) {
    countByUser.set(row.user_id, (countByUser.get(row.user_id) ?? 0) + 1);
  }

  const sorted = [...countByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

  const names = await resolveDisplayNames(
    sorted.map(([uid]) => uid),
    new Set(),
  );

  return sorted.map(([userId, count], i) => ({
    rank: i + 1,
    count,
    displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
  }));
}

/** Fetch current user's personal best history. */
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
