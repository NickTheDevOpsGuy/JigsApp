/**
 * Daily puzzle leaderboard fetcher.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import type {
  LeaderboardEntry,
  VisualModifierFilter,
  PieceCutType,
  CompletionSourceFilter,
} from "./leaderboardTypes";
import { resolveDisplayNames } from "./leaderboardFetchersShared";
import { withLeaderboardCache } from "./leaderboardCache";

export async function getDailyLeaderboard(
  dateStr: string,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<LeaderboardEntry[]> {
  return withLeaderboardCache(
    `daily:time:${dateStr}:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      let query = supabase!
        .from("completions")
        .select("user_id, elapsed_seconds, created_at, move_count, undo_count")
        .eq("puzzle_date", dateStr)
        .eq("is_daily", true);
      if (cutType !== "all") query = query.eq("cut_type", cutType);
      if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
      if (completionSource !== "all") query = query.eq("completion_source", completionSource);
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
        moveCount: row.move_count ?? null,
        undoCount: row.undo_count ?? null,
      }));
    },
  );
}

/** Daily leaderboard sorted by fewest moves (then time). */
export async function getDailyLeaderboardLeastMoves(
  dateStr: string,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<LeaderboardEntry[]> {
  return withLeaderboardCache(
    `daily:moves:${dateStr}:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      let query = supabase!
        .from("completions")
        .select("user_id, elapsed_seconds, created_at, move_count, undo_count")
        .eq("puzzle_date", dateStr)
        .eq("is_daily", true)
        .not("move_count", "is", null);
      if (cutType !== "all") query = query.eq("cut_type", cutType);
      if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
      if (completionSource !== "all") query = query.eq("completion_source", completionSource);
      const { data, error } = await query
        .order("move_count", { ascending: true })
        .order("elapsed_seconds", { ascending: true })
        .limit(limit * 4);
      if (error) return [];
      const bestByUser = new Map<
    string,
    {
      elapsedSeconds: number;
      completedAt?: string;
      moveCount: number;
      undoCount?: number | null;
    }
      >();
      for (const row of data ?? []) {
        const cur = bestByUser.get(row.user_id);
        const moves = row.move_count ?? 0;
        if (
          cur == null ||
          moves < cur.moveCount ||
          (moves === cur.moveCount && row.elapsed_seconds < cur.elapsedSeconds)
        ) {
          bestByUser.set(row.user_id, {
            elapsedSeconds: row.elapsed_seconds,
            completedAt: row.created_at,
            moveCount: moves,
            undoCount: row.undo_count ?? null,
          });
        }
      }
      const sorted = [...bestByUser.entries()]
        .sort(
          (a, b) =>
            a[1].moveCount - b[1].moveCount || a[1].elapsedSeconds - b[1].elapsedSeconds,
        )
        .slice(0, limit);
      const names = await resolveDisplayNames(
        sorted.map(([uid]) => uid),
        new Set(),
      );
      return sorted.map(([userId, v], i) => ({
        rank: i + 1,
        elapsedSeconds: v.elapsedSeconds,
        displayName: names.get(userId) ?? "Player " + userId.slice(0, 8),
        userId,
        completedAt: v.completedAt,
        moveCount: v.moveCount,
        undoCount: v.undoCount ?? null,
      }));
    },
  );
}

/** Daily leaderboard sorted by cleanest solve (fewest undos, then time). */
export async function getDailyLeaderboardCleanest(
  dateStr: string,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<LeaderboardEntry[]> {
  return withLeaderboardCache(
    `daily:cleanest:${dateStr}:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      let query = supabase!
        .from("completions")
        .select("user_id, elapsed_seconds, created_at, move_count, undo_count")
        .eq("puzzle_date", dateStr)
        .eq("is_daily", true);
      if (cutType !== "all") query = query.eq("cut_type", cutType);
      if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
      if (completionSource !== "all") query = query.eq("completion_source", completionSource);
      const { data, error } = await query
        .order("undo_count", { ascending: true, nullsFirst: false })
        .order("elapsed_seconds", { ascending: true })
        .limit(limit * 4);
      if (error) return [];
      const bestByUser = new Map<
    string,
    {
      elapsedSeconds: number;
      completedAt?: string;
      moveCount?: number | null;
      undoCount: number;
    }
      >();
      for (const row of data ?? []) {
        const undos = row.undo_count ?? 999;
        const cur = bestByUser.get(row.user_id);
        if (
          cur == null ||
          undos < cur.undoCount ||
          (undos === cur.undoCount && row.elapsed_seconds < cur.elapsedSeconds)
        ) {
          bestByUser.set(row.user_id, {
            elapsedSeconds: row.elapsed_seconds,
            completedAt: row.created_at,
            moveCount: row.move_count ?? null,
            undoCount: undos,
          });
        }
      }
      const sorted = [...bestByUser.entries()]
        .sort(
          (a, b) =>
            a[1].undoCount - b[1].undoCount || a[1].elapsedSeconds - b[1].elapsedSeconds,
        )
        .slice(0, limit);
      const names = await resolveDisplayNames(
        sorted.map(([uid]) => uid),
        new Set(),
      );
      return sorted.map(([userId, v], i) => ({
        rank: i + 1,
        elapsedSeconds: v.elapsedSeconds,
        displayName: names.get(userId) ?? "Player " + userId.slice(0, 8),
        userId,
        completedAt: v.completedAt,
        moveCount: v.moveCount ?? null,
        undoCount: v.undoCount,
      }));
    },
  );
}
