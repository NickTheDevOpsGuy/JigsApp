/**
 * prestigeService – prestige reset for advanced players.
 * Resets XP/level, increments prestige, unlocks cosmetic badge.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn } from "@/supabase/auth";

const PRESTIGE_MIN_LEVEL = 5;

/** Check if user can prestige (level >= 5). */
export function canPrestige(level: number): boolean {
  return level >= PRESTIGE_MIN_LEVEL;
}

/** Reset XP to 0, level to 1, increment prestige. Returns new stats or null. */
export async function prestigeReset(): Promise<{
  level: number;
  prestigeCount: number;
} | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await ensureSignedIn();
  if (!userId) return null;

  const { data: existing } = await supabase!
    .from("player_stats")
    .select("level, prestige_count")
    .eq("user_id", userId)
    .single();

  if (!existing || (existing.level ?? 1) < PRESTIGE_MIN_LEVEL) return null;

  const newPrestige = ((existing as { prestige_count?: number }).prestige_count ?? 0) + 1;

  const { error } = await supabase!
    .from("player_stats")
    .update({
      xp: 0,
      level: 1,
      prestige_count: newPrestige,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) return null;
  return { level: 1, prestigeCount: newPrestige };
}
