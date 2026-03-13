/**
 * Period leaderboards: weekly/monthly best times and totals, weekly efficiency.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import type {
  LeaderboardEntry,
  CompletionCountEntry,
  EfficiencyEntry,
  PieceCutType,
  VisualModifierFilter,
  CompletionSourceFilter,
} from "./leaderboardTypes";
import { getCalendarWeekRange } from "./leaderboardTypes";
import { resolveDisplayNames } from "./leaderboardFetchersShared";
import { withLeaderboardCache } from "./leaderboardCache";

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

export async function getPeriodLeaderboard(
  period: "week" | "month",
  limit = 10,
  cutType: PieceCutType = "all",
): Promise<LeaderboardEntry[]> {
  return withLeaderboardCache(`period:${period}:${limit}:${cutType}`, async () => {
    if (!isSupabaseConfigured()) return [];
    const { start, end } = getDateRange(period);
    let query = supabase!
      .from("completions")
      .select("user_id, elapsed_seconds, created_at")
      .eq("is_daily", true)
      .gte("puzzle_date", start)
      .lte("puzzle_date", end);
    if (cutType !== "all") {
      query = query.eq("cut_type", cutType);
    }
    const { data, error } = await query
      .order("elapsed_seconds", { ascending: true })
      .limit(limit * 5);
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
  });
}

export async function getWeeklyTotalsLeaderboard(
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<CompletionCountEntry[]> {
  return withLeaderboardCache(
    `weeklyTotals:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      const { start, end } = getDateRange("week");
      let query = supabase!
        .from("completions")
        .select("user_id")
        .gte("puzzle_date", start)
        .lte("puzzle_date", end);
      if (cutType !== "all") query = query.eq("cut_type", cutType);
      if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
      if (completionSource !== "all") query = query.eq("completion_source", completionSource);
      const { data, error } = await query;
      if (error) return [];
      const countByUser = new Map<string, number>();
      for (const row of data ?? []) {
        countByUser.set(row.user_id, (countByUser.get(row.user_id) ?? 0) + 1);
      }
      const sorted = [...countByUser.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
      const names = await resolveDisplayNames(
        sorted.map(([uid]) => uid),
        new Set(),
      );
      return sorted.map(([userId, count], i) => ({
        rank: i + 1,
        count,
        displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
        userId,
      }));
    },
  );
}

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
    userId,
  }));
}

/** Weekly efficiency spotlight: best sec/move this calendar week (Mon–Sun). */
export async function getWeeklyEfficiencyLeaderboard(
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<EfficiencyEntry[]> {
  return withLeaderboardCache(
    `weeklyEfficiency:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      const today = new Date().toISOString().slice(0, 10);
      const { start, end } = getCalendarWeekRange(today);
      let query = supabase!
        .from("completions")
        .select("user_id, elapsed_seconds, move_count")
        .gte("puzzle_date", start)
        .lte("puzzle_date", end)
        .not("move_count", "is", null)
        .gt("move_count", 0);
      if (cutType !== "all") query = query.eq("cut_type", cutType);
      if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
      if (completionSource !== "all") query = query.eq("completion_source", completionSource);
      const { data, error } = await query.limit(limit * 8);
      if (error) return [];
      const bestByUser = new Map<
    string,
    { elapsedSeconds: number; moveCount: number; efficiency: number }
      >();
      for (const row of data ?? []) {
        const moveCount = row.move_count ?? 1;
        const efficiency = row.elapsed_seconds / moveCount;
        const cur = bestByUser.get(row.user_id);
        if (cur == null || efficiency < cur.efficiency) {
          bestByUser.set(row.user_id, {
            elapsedSeconds: row.elapsed_seconds,
            moveCount,
            efficiency,
          });
        }
      }
      const sorted = [...bestByUser.entries()]
        .sort((a, b) => a[1].efficiency - b[1].efficiency)
        .slice(0, limit);
      const names = await resolveDisplayNames(
        sorted.map(([uid]) => uid),
        new Set(),
      );
      return sorted.map(([userId, v], i) => ({
        rank: i + 1,
        displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
        userId,
        efficiencySecPerMove: Math.round(v.efficiency * 10) / 10,
        elapsedSeconds: v.elapsedSeconds,
        moveCount: v.moveCount,
      }));
    },
  );
}
