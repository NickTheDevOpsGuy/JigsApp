/**
 * Period leaderboards: weekly/monthly best times and totals.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import type {
  LeaderboardEntry,
  CompletionCountEntry,
  PieceCutType,
} from "./leaderboardTypes";
import { resolveDisplayNames } from "./leaderboardFetchersShared";

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
