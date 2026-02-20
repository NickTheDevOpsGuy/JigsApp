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

/** Fetch streak flair for users (best_daily_streak >= 3). Returns " 🔥3" or " 🌟7" etc. */
async function resolveStreakFlairs(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return map;

  try {
    const { data } = await supabase!
      .from("player_stats")
      .select("user_id, best_daily_streak")
      .in("user_id", unique)
      .gte("best_daily_streak", 3);

    for (const row of data ?? []) {
      const s = row.best_daily_streak;
      if (s >= 7) map.set(row.user_id, " 🌟7");
      else if (s >= 3) map.set(row.user_id, " 🔥3");
    }
  } catch {
    // player_stats may not exist
  }
  return map;
}

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

  const userIds = (data ?? []).map((r) => r.user_id);
  const [names, flairs] = await Promise.all([
    resolveDisplayNames(userIds, new Set()),
    resolveStreakFlairs(userIds),
  ]);

  return (data ?? []).map((row, i) => {
    const base = names.get(row.user_id) ?? `Player ${row.user_id.slice(0, 8)}`;
    const flair = flairs.get(row.user_id) ?? "";
    return {
      rank: i + 1,
      elapsedSeconds: row.elapsed_seconds,
      displayName: base + flair,
      userId: row.user_id,
    };
  });
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
    .select("user_id, elapsed_seconds")
    .eq("grid_rows", rows)
    .eq("grid_cols", cols)
    .order("elapsed_seconds", { ascending: true });

  if (error) return [];

  const bestByUser = new Map<string, number>();
  for (const row of data ?? []) {
    const cur = bestByUser.get(row.user_id);
    if (cur == null || row.elapsed_seconds < cur) {
      bestByUser.set(row.user_id, row.elapsed_seconds);
    }
  }

  const sorted = [...bestByUser.entries()].sort((a, b) => a[1] - b[1]).slice(0, limit);

  const names = await resolveDisplayNames(
    sorted.map(([uid]) => uid),
    new Set(),
  );

  return sorted.map(([userId, elapsedSeconds], i) => ({
    rank: i + 1,
    elapsedSeconds,
    displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
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
    .select("user_id, elapsed_seconds")
    .eq("is_daily", true)
    .gte("puzzle_date", start)
    .lte("puzzle_date", end)
    .order("elapsed_seconds", { ascending: true });

  if (error) return [];

  // Best time per user in period
  const bestByUser = new Map<string, number>();
  for (const row of data ?? []) {
    const cur = bestByUser.get(row.user_id);
    if (cur == null || row.elapsed_seconds < cur) {
      bestByUser.set(row.user_id, row.elapsed_seconds);
    }
  }

  const sorted = [...bestByUser.entries()].sort((a, b) => a[1] - b[1]).slice(0, limit);

  const names = await resolveDisplayNames(
    sorted.map(([uid]) => uid),
    new Set(),
  );

  return sorted.map(([userId, elapsedSeconds], i) => ({
    rank: i + 1,
    elapsedSeconds,
    displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
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

/** Fetch Time Attack leaderboard (best scores in time attack mode). Uses time_attack_score when available. */
export async function getTimeAttackLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds, time_attack_score")
    .eq("is_time_attack", true)
    .limit(limit * 4);

  if (error) return [];

  const rows = data ?? [];
  const bestByUser = new Map<string, { elapsed: number; score: number | null }>();
  for (const row of rows) {
    const score =
      (row as { time_attack_score?: number | null }).time_attack_score ?? null;
    const cur = bestByUser.get(row.user_id);
    const isBetter =
      cur == null ||
      (score != null && cur.score != null && score > cur.score) ||
      (score == null && cur.score == null && row.elapsed_seconds < cur.elapsed) ||
      (score != null && (cur.score == null || score > cur.score));
    if (isBetter) {
      bestByUser.set(row.user_id, {
        elapsed: row.elapsed_seconds,
        score,
      });
    }
  }

  const sorted = [...bestByUser.entries()]
    .sort((a, b) => {
      const sa = a[1].score;
      const sb = b[1].score;
      if (sa != null && sb != null) return sb - sa;
      if (sa != null) return -1;
      if (sb != null) return 1;
      return a[1].elapsed - b[1].elapsed;
    })
    .slice(0, limit);

  const userIds = sorted.map(([uid]) => uid);
  const [names, flairs] = await Promise.all([
    resolveDisplayNames(userIds, new Set()),
    resolveStreakFlairs(userIds),
  ]);

  return sorted.map(([userId, { elapsed }], i) => {
    const base = names.get(userId) ?? `Player ${userId.slice(0, 8)}`;
    const flair = flairs.get(userId) ?? "";
    return {
      rank: i + 1,
      elapsedSeconds: elapsed,
      displayName: base + flair,
    };
  });
}

/** Fetch Time Decay leaderboard (best scores; higher = better). Score decays over time, placements add bonus. */
export async function getTimeDecayLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("completions")
    .select("user_id, elapsed_seconds, time_decay_score")
    .eq("is_time_decay", true)
    .limit(limit * 4);

  if (error) return [];

  const rows = data ?? [];
  const bestByUser = new Map<string, { elapsed: number; score: number | null }>();
  for (const row of rows) {
    const score =
      (row as { time_decay_score?: number | null }).time_decay_score ?? null;
    const cur = bestByUser.get(row.user_id);
    const isBetter =
      cur == null ||
      (score != null && cur.score != null && score > cur.score) ||
      (score == null && cur.score == null && row.elapsed_seconds < cur.elapsed) ||
      (score != null && (cur.score == null || score > cur.score));
    if (isBetter) {
      bestByUser.set(row.user_id, {
        elapsed: row.elapsed_seconds,
        score,
      });
    }
  }

  const sorted = [...bestByUser.entries()]
    .sort((a, b) => {
      const sa = a[1].score;
      const sb = b[1].score;
      if (sa != null && sb != null) return sb - sa;
      if (sa != null) return -1;
      if (sb != null) return 1;
      return a[1].elapsed - b[1].elapsed;
    })
    .slice(0, limit);

  const userIds = sorted.map(([uid]) => uid);
  const [names, flairs] = await Promise.all([
    resolveDisplayNames(userIds, new Set()),
    resolveStreakFlairs(userIds),
  ]);

  return sorted.map(([userId, { elapsed }], i) => {
    const base = names.get(userId) ?? `Player ${userId.slice(0, 8)}`;
    const flair = flairs.get(userId) ?? "";
    return {
      rank: i + 1,
      elapsedSeconds: elapsed,
      displayName: base + flair,
    };
  });
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
