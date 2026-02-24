/**
 * statsService – record completions, update player_stats (streaks, totals, XP, challenge wins).
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn } from "@/supabase/auth";
import { getTodayDateString } from "@/daily/dailyPuzzleCore";

export type PlayerStatsData = {
  puzzlesCompleted: number;
  totalPlayTimeSeconds: number;
  dailyStreak: number;
  bestDailyStreak: number;
  lastPlayedAt: string | null;
  xp?: number;
  level?: number;
  prestigeCount?: number;
  challengeWins?: number;
};

/** XP thresholds: level 1 = 0, level 2 = 100, level 3 = 250, then +150 per level. */
function xpToLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  let level = 3;
  let threshold = 250;
  while (xp >= threshold + 150) {
    threshold += 150;
    level += 1;
  }
  return level;
}

/** If user is tied for #1 on today's daily, award challenge win. */
async function maybeAwardChallengeWin(
  userId: string,
  dateStr: string,
  elapsedSeconds: number,
): Promise<void> {
  const { data: better } = await supabase!
    .from("completions")
    .select("id")
    .eq("puzzle_date", dateStr)
    .eq("is_daily", true)
    .lt("elapsed_seconds", elapsedSeconds)
    .limit(1);
  if (better && better.length > 0) return;
  const { data: stats } = await supabase!
    .from("player_stats")
    .select("challenge_wins")
    .eq("user_id", userId)
    .single();
  const current = (stats as { challenge_wins?: number } | null)?.challenge_wins ?? 0;
  await supabase!
    .from("player_stats")
    .update({
      challenge_wins: current + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export type PieceCutType = "classic" | "irregular" | "hard";

/** Record a puzzle completion and update stats. */
export async function recordCompletion(args: {
  elapsedSeconds: number;
  grid: { rows: number; cols: number };
  isDaily: boolean;
  dailyStreak: number;
  cutType?: PieceCutType;
}): Promise<PlayerStatsData | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await ensureSignedIn();
  if (!userId) return null;

  const today = getTodayDateString();
  const cutType = args.cutType ?? "classic";

  await supabase!.from("completions").insert({
    user_id: userId,
    puzzle_date: today,
    elapsed_seconds: args.elapsedSeconds,
    grid_rows: args.grid.rows,
    grid_cols: args.grid.cols,
    is_daily: args.isDaily,
    cut_type: cutType,
  });

  const { data: existing } = await supabase!
    .from("player_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  const newStreak = args.isDaily ? args.dailyStreak : 0;
  const prevBest = existing?.best_daily_streak ?? 0;

  const XP_PER_PIECE = 10;
  const XP_COMPLETION_BONUS = 5;
  const pieceCount = args.grid.rows * args.grid.cols;
  const xpGain = pieceCount * XP_PER_PIECE + XP_COMPLETION_BONUS;
  const existingXp = (existing as { xp?: number } | null)?.xp ?? 0;
  const newXp = existingXp + xpGain;
  const newLevel = xpToLevel(newXp);

  const updates = {
    puzzles_completed: (existing?.puzzles_completed ?? 0) + 1,
    total_play_time_seconds:
      (existing?.total_play_time_seconds ?? 0) + args.elapsedSeconds,
    daily_streak: newStreak,
    best_daily_streak: Math.max(prevBest, newStreak),
    last_played_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    xp: newXp,
    level: newLevel,
  };

  if (existing) {
    await supabase!.from("player_stats").update(updates).eq("user_id", userId);
  } else {
    await supabase!.from("player_stats").insert({
      user_id: userId,
      ...updates,
    });
  }

  if (args.isDaily) {
    try {
      await maybeAwardChallengeWin(userId, today, args.elapsedSeconds);
    } catch {
      /* challenge_wins column may not exist before migration 002 */
    }
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
  const row = data as typeof data & {
    xp?: number;
    level?: number;
    prestige_count?: number;
    challenge_wins?: number;
  };
  return {
    puzzlesCompleted: data.puzzles_completed,
    totalPlayTimeSeconds: data.total_play_time_seconds,
    dailyStreak: data.daily_streak,
    bestDailyStreak: data.best_daily_streak,
    lastPlayedAt: data.last_played_at,
    xp: row.xp ?? 0,
    level: row.level ?? 1,
    prestigeCount: row.prestige_count ?? 0,
    challengeWins: row.challenge_wins ?? 0,
  };
}
