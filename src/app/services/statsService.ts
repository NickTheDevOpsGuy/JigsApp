import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn } from "@/supabase/auth";
import { getTodayDateString } from "@/daily/dailyPuzzle";

export type PlayerStatsData = {
  puzzlesCompleted: number;
  totalPlayTimeSeconds: number;
  dailyStreak: number;
  bestDailyStreak: number;
  lastPlayedAt: string | null;
};

/** Record a puzzle completion and update stats. */
export async function recordCompletion(args: {
  elapsedSeconds: number;
  grid: { rows: number; cols: number };
  isDaily: boolean;
  dailyStreak: number;
}): Promise<PlayerStatsData | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await ensureSignedIn();
  if (!userId) return null;

  const today = getTodayDateString();

  await supabase!.from("completions").insert({
    user_id: userId,
    puzzle_date: today,
    elapsed_seconds: args.elapsedSeconds,
    grid_rows: args.grid.rows,
    grid_cols: args.grid.cols,
    is_daily: args.isDaily,
  });

  const { data: existing } = await supabase!
    .from("player_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  const newStreak = args.isDaily ? args.dailyStreak : 0;
  const prevBest = existing?.best_daily_streak ?? 0;

  const updates = {
    puzzles_completed: (existing?.puzzles_completed ?? 0) + 1,
    total_play_time_seconds:
      (existing?.total_play_time_seconds ?? 0) + args.elapsedSeconds,
    daily_streak: newStreak,
    best_daily_streak: Math.max(prevBest, newStreak),
    last_played_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase!.from("player_stats").update(updates).eq("user_id", userId);
  } else {
    await supabase!.from("player_stats").insert({
      user_id: userId,
      ...updates,
    });
  }

  return {
    puzzlesCompleted: updates.puzzles_completed,
    totalPlayTimeSeconds: updates.total_play_time_seconds,
    dailyStreak: updates.daily_streak,
    bestDailyStreak: updates.best_daily_streak,
    lastPlayedAt: updates.last_played_at,
  };
}

/** Fetch current user's stats. */
export async function getMyStats(): Promise<PlayerStatsData | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await ensureSignedIn();
  if (!userId) return null;

  const { data, error } = await supabase!
    .from("player_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    puzzlesCompleted: data.puzzles_completed,
    totalPlayTimeSeconds: data.total_play_time_seconds,
    dailyStreak: data.daily_streak,
    bestDailyStreak: data.best_daily_streak,
    lastPlayedAt: data.last_played_at,
  };
}

export type CompletionHistoryEntry = {
  date: string;
  elapsedSeconds: number;
  gridRows: number;
  gridCols: number;
  isDaily: boolean;
};

/** Fetch current user's completion history for the last N days. */
export async function getMyCompletionHistory(
  days = 30,
): Promise<CompletionHistoryEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const userId = await ensureSignedIn();
  if (!userId) return [];

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  const { data, error } = await supabase!
    .from("completions")
    .select("puzzle_date, elapsed_seconds, grid_rows, grid_cols, is_daily")
    .eq("user_id", userId)
    .gte("puzzle_date", startStr)
    .lte("puzzle_date", endDate)
    .order("puzzle_date", { ascending: true });

  if (error) return [];

  return (data ?? []).map((r) => ({
    date: r.puzzle_date,
    elapsedSeconds: r.elapsed_seconds,
    gridRows: r.grid_rows,
    gridCols: r.grid_cols,
    isDaily: r.is_daily,
  }));
}
