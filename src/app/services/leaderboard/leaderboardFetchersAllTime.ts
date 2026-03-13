/**
 * All-time best leaderboard fetcher.
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

export async function getAllTimeBestLeaderboard(
  rows: number,
  cols: number,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<LeaderboardEntry[]> {
  return withLeaderboardCache(
    `alltime:time:${rows}x${cols}:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      let query = supabase!
        .from("completions")
        .select("user_id, elapsed_seconds, created_at, move_count, undo_count")
        .eq("grid_rows", rows)
        .eq("grid_cols", cols);
      if (cutType !== "all") {
        query = query.eq("cut_type", cutType);
      }
      if (visualModifier !== "all") {
        query = query.eq("visual_modifier", visualModifier);
      }
      if (completionSource !== "all") {
        query = query.eq("completion_source", completionSource);
      }
      const { data, error } = await query
        .order("elapsed_seconds", { ascending: true })
        .limit(limit * 5);
      if (error) return [];
      const bestByUser = new Map<
        string,
        {
          elapsedSeconds: number;
          completedAt?: string;
          moveCount?: number | null;
          undoCount?: number | null;
        }
      >();
      for (const row of data ?? []) {
        const cur = bestByUser.get(row.user_id);
        if (cur == null || row.elapsed_seconds < cur.elapsedSeconds) {
          bestByUser.set(row.user_id, {
            elapsedSeconds: row.elapsed_seconds,
            completedAt: row.created_at,
            moveCount: row.move_count ?? null,
            undoCount: row.undo_count ?? null,
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
      return sorted.map(
        ([userId, { elapsedSeconds, completedAt, moveCount, undoCount }], i) => ({
          rank: i + 1,
          elapsedSeconds,
          displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
          userId,
          completedAt,
          moveCount: moveCount ?? null,
          undoCount: undoCount ?? null,
        }),
      );
    },
  );
}

/** All-time best by fewest moves (then time) for a grid size. */
export async function getAllTimeBestLeastMoves(
  rows: number,
  cols: number,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<LeaderboardEntry[]> {
  return withLeaderboardCache(
    `alltime:moves:${rows}x${cols}:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      let query = supabase!
        .from("completions")
        .select("user_id, elapsed_seconds, created_at, move_count, undo_count")
        .eq("grid_rows", rows)
        .eq("grid_cols", cols)
        .not("move_count", "is", null);
      if (cutType !== "all") query = query.eq("cut_type", cutType);
      if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
      if (completionSource !== "all")
        query = query.eq("completion_source", completionSource);
      const { data, error } = await query
        .order("move_count", { ascending: true })
        .order("elapsed_seconds", { ascending: true })
        .limit(limit * 5);
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
        const moves = row.move_count ?? 0;
        const cur = bestByUser.get(row.user_id);
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
        displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
        userId,
        completedAt: v.completedAt,
        moveCount: v.moveCount,
        undoCount: v.undoCount ?? null,
      }));
    },
  );
}

/** All-time best by cleanest solve (fewest undos, then time) for a grid size. */
export async function getAllTimeBestCleanest(
  rows: number,
  cols: number,
  limit = 10,
  cutType: PieceCutType = "all",
  visualModifier: VisualModifierFilter = "all",
  completionSource: CompletionSourceFilter = "all",
): Promise<LeaderboardEntry[]> {
  return withLeaderboardCache(
    `alltime:cleanest:${rows}x${cols}:${limit}:${cutType}:${visualModifier}:${completionSource}`,
    async () => {
      if (!isSupabaseConfigured()) return [];
      let query = supabase!
        .from("completions")
        .select("user_id, elapsed_seconds, created_at, move_count, undo_count")
        .eq("grid_rows", rows)
        .eq("grid_cols", cols);
      if (cutType !== "all") query = query.eq("cut_type", cutType);
      if (visualModifier !== "all") query = query.eq("visual_modifier", visualModifier);
      if (completionSource !== "all")
        query = query.eq("completion_source", completionSource);
      const { data, error } = await query
        .order("undo_count", { ascending: true, nullsFirst: false })
        .order("elapsed_seconds", { ascending: true })
        .limit(limit * 5);
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
        displayName: names.get(userId) ?? `Player ${userId.slice(0, 8)}`,
        userId,
        completedAt: v.completedAt,
        moveCount: v.moveCount ?? null,
        undoCount: v.undoCount,
      }));
    },
  );
}
