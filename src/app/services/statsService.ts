/**
 * statsService – record completions, update player_stats (streaks, totals).
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn } from "@/supabase/auth";
import { getTodayDateString } from "@/daily/dailyPuzzleCore";

export type PlayerStatsData = {
  puzzlesCompleted: number;
  puzzlesUnder5Min: number;
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
  isTimeAttack?: boolean;
  timeAttackScore?: number;
  isTimeDecay?: boolean;
  timeDecayScore?: number;
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
    is_time_attack: args.isTimeAttack ?? false,
    time_attack_score: args.timeAttackScore ?? null,
    is_time_decay: args.isTimeDecay ?? false,
    time_decay_score: args.timeDecayScore ?? null,
  });

  const { data: existing } = await supabase!
    .from("player_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  const newStreak = args.isDaily ? args.dailyStreak : 0;
  const prevBest = existing?.best_daily_streak ?? 0;
  const under5Min = args.elapsedSeconds < 300 ? 1 : 0;

  const updates: Record<string, unknown> = {
    puzzles_completed: (existing?.puzzles_completed ?? 0) + 1,
    puzzles_under_5_min: (existing?.puzzles_under_5_min ?? 0) + under5Min,
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
    puzzlesCompleted: updates.puzzles_completed as number,
    puzzlesUnder5Min: updates.puzzles_under_5_min as number,
    totalPlayTimeSeconds: updates.total_play_time_seconds as number,
    dailyStreak: updates.daily_streak as number,
    bestDailyStreak: updates.best_daily_streak as number,
    lastPlayedAt: updates.last_played_at as string | null,
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
    puzzlesUnder5Min: (data as { puzzles_under_5_min?: number }).puzzles_under_5_min ?? 0,
    totalPlayTimeSeconds: data.total_play_time_seconds,
    dailyStreak: data.daily_streak,
    bestDailyStreak: data.best_daily_streak,
    lastPlayedAt: data.last_played_at,
  };
}
