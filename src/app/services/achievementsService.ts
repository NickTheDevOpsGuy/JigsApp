/**
 * achievementsService – check/unlock achievements from ACHIEVEMENT_DEFS; user_achievements table.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn } from "@/supabase/auth";
import { ACHIEVEMENT_DEFS } from "@/data/achievements";
import type { AchievementDef } from "@/data/achievements";

export type AchievementWithUnlock = AchievementDef & {
  unlocked: boolean;
  unlockedAt: string | null;
};

/** Check and unlock achievements based on stats. Call after recording completion. */
export async function checkAndUnlockAchievements(args: {
  puzzlesCompleted: number;
  puzzlesUnder5Min?: number;
  dailyStreak: number;
  bestDailyStreak: number;
  lastCompletion?: { elapsedSeconds: number; grid: { rows: number; cols: number } };
}): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const userId = await ensureSignedIn();
  if (!userId) return [];

  const { data: existing } = await supabase!
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set((existing ?? []).map((r) => r.achievement_id));
  const newlyUnlocked: string[] = [];

  const last = args.lastCompletion;
  const speedDemon =
    last && last.grid.rows === 3 && last.grid.cols === 3 && last.elapsedSeconds < 60;
  const expertGrid = last && last.grid.rows === 6 && last.grid.cols === 6;

  const puzzlesUnder5Min = args.puzzlesUnder5Min ?? 0;
  const toCheck: { id: string; condition: boolean }[] = [
    { id: "first_puzzle", condition: args.puzzlesCompleted >= 1 },
    { id: "five_puzzles", condition: args.puzzlesCompleted >= 5 },
    { id: "ten_puzzles", condition: args.puzzlesCompleted >= 10 },
    { id: "twenty_puzzles", condition: args.puzzlesCompleted >= 20 },
    { id: "fifty_puzzles", condition: args.puzzlesCompleted >= 50 },
    { id: "hundred_puzzles", condition: args.puzzlesCompleted >= 100 },
    { id: "five_under_five", condition: puzzlesUnder5Min >= 5 },
    { id: "daily_streak_3", condition: args.bestDailyStreak >= 3 },
    { id: "daily_streak_7", condition: args.bestDailyStreak >= 7 },
    { id: "daily_streak_30", condition: args.bestDailyStreak >= 30 },
    { id: "speed_demon", condition: !!speedDemon },
    { id: "expert_grid", condition: !!expertGrid },
  ];

  for (const { id, condition } of toCheck) {
    if (condition && !unlockedIds.has(id)) {
      await supabase!.from("user_achievements").insert({
        user_id: userId,
        achievement_id: id,
      });
      newlyUnlocked.push(id);
    }
  }

  return newlyUnlocked;
}

/** Fetch user's achievements with unlock status. */
export async function getMyAchievements(): Promise<AchievementWithUnlock[]> {
  if (!isSupabaseConfigured()) {
    return ACHIEVEMENT_DEFS.map((a) => ({ ...a, unlocked: false, unlockedAt: null }));
  }

  const userId = await ensureSignedIn();
  if (!userId) {
    return ACHIEVEMENT_DEFS.map((a) => ({ ...a, unlocked: false, unlockedAt: null }));
  }

  const { data: userAchievements } = await supabase!
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId);

  const byId = new Map(
    (userAchievements ?? []).map((r) => [r.achievement_id, r.unlocked_at]),
  );

  return ACHIEVEMENT_DEFS.map((def) => ({
    ...def,
    unlocked: byId.has(def.id),
    unlockedAt: byId.get(def.id) ?? null,
  }));
}
