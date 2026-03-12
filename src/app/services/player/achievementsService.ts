/**
 * achievementsService – check/unlock achievements from ACHIEVEMENT_DEFS; user_achievements table.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn } from "@/supabase/auth";
import { ACHIEVEMENT_DEFS } from "@/data/content/achievements";
import type { AchievementDef } from "@/data/content/achievements";

export type AchievementWithUnlock = AchievementDef & {
  unlocked: boolean;
  unlockedAt: string | null;
};

/** Check and unlock achievements based on stats. Call after recording completion. */
export async function checkAndUnlockAchievements(args: {
  puzzlesCompleted: number;
  dailyStreak: number;
  bestDailyStreak: number;
  lastCompletion?: { elapsedSeconds: number; grid: { rows: number; cols: number } };
  undoCount?: number;
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
  const r = last?.grid.rows ?? 0;
  const c = last?.grid.cols ?? 0;
  const time = last?.elapsedSeconds ?? 0;

  const speedDemon = r === 3 && c === 3 && time < 60;
  const lightning = r === 3 && c === 3 && time < 45;
  const expertGrid = r === 6 && c === 6;
  const quick4x4 = r === 4 && c === 4 && time < 120;
  const flawless = args.undoCount === 0;

  const toCheck: { id: string; condition: boolean }[] = [
    { id: "first_puzzle", condition: args.puzzlesCompleted >= 1 },
    { id: "five_puzzles", condition: args.puzzlesCompleted >= 5 },
    { id: "twenty_puzzles", condition: args.puzzlesCompleted >= 20 },
    { id: "fifty_puzzles", condition: args.puzzlesCompleted >= 50 },
    { id: "hundred_puzzles", condition: args.puzzlesCompleted >= 100 },
    { id: "two_fifty_puzzles", condition: args.puzzlesCompleted >= 250 },
    { id: "five_hundred_puzzles", condition: args.puzzlesCompleted >= 500 },
    { id: "first_daily", condition: args.bestDailyStreak >= 1 },
    { id: "daily_streak_3", condition: args.bestDailyStreak >= 3 },
    { id: "daily_streak_7", condition: args.bestDailyStreak >= 7 },
    { id: "daily_streak_14", condition: args.bestDailyStreak >= 14 },
    { id: "daily_streak_30", condition: args.bestDailyStreak >= 30 },
    { id: "speed_demon", condition: speedDemon },
    { id: "lightning_3x3", condition: lightning },
    { id: "expert_grid", condition: expertGrid },
    { id: "quick_4x4", condition: quick4x4 },
    { id: "grid_4x4", condition: r === 4 && c === 4 },
    { id: "grid_5x5", condition: r === 5 && c === 5 },
    { id: "grid_7x7", condition: r === 7 && c === 7 },
    { id: "grid_8x8", condition: r === 8 && c === 8 },
    { id: "grid_9x9", condition: r === 9 && c === 9 },
    { id: "flawless", condition: flawless },
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
