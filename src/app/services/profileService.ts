/**
 * profileService – player_profiles: display name, show_on_leaderboard, region.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { getUserId, ensureSignedIn } from "@/supabase/auth";

export type PlayerProfile = {
  displayName: string;
  showOnLeaderboard: boolean;
  region: string | null;
  avatarHat?: string | null;
  avatarGlasses?: string | null;
  avatarHoodie?: string | null;
};

/** Fetch current user's profile. */
export async function getMyProfile(): Promise<PlayerProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase!
    .from("player_profiles")
    .select("display_name, show_on_leaderboard, region, avatar_hat, avatar_glasses, avatar_hoodie")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") return null;
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    displayName: (row.display_name as string) ?? "Puzzler",
    showOnLeaderboard: (row.show_on_leaderboard as boolean) ?? true,
    region: (row.region as string | null) ?? null,
    avatarHat: (row.avatar_hat as string | null) ?? null,
    avatarGlasses: (row.avatar_glasses as string | null) ?? null,
    avatarHoodie: (row.avatar_hoodie as string | null) ?? null,
  };
}

/** Update display name, leaderboard visibility, and avatar. */
export async function updateMyProfile(args: {
  displayName?: string;
  showOnLeaderboard?: boolean;
  region?: string | null;
  avatarHat?: string | null;
  avatarGlasses?: string | null;
  avatarHoodie?: string | null;
}): Promise<PlayerProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await ensureSignedIn();
  if (!userId) return null;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (args.displayName !== undefined) {
    updates.display_name = args.displayName.trim().slice(0, 32) || "Puzzler";
  }
  if (args.showOnLeaderboard !== undefined) {
    updates.show_on_leaderboard = args.showOnLeaderboard;
  }
  if (args.region !== undefined) {
    updates.region = args.region?.trim().slice(0, 64) || null;
  }
  if (args.avatarHat !== undefined) updates.avatar_hat = args.avatarHat;
  if (args.avatarGlasses !== undefined) updates.avatar_glasses = args.avatarGlasses;
  if (args.avatarHoodie !== undefined) updates.avatar_hoodie = args.avatarHoodie;

  const { data: existing } = await supabase!
    .from("player_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const { data, error } = await supabase!
      .from("player_profiles")
      .update(updates)
      .eq("user_id", userId)
      .select("display_name, show_on_leaderboard, region, avatar_hat, avatar_glasses, avatar_hoodie")
      .single();
    if (error) return null;
    const d = data as Record<string, unknown>;
    return {
      displayName: (d?.display_name as string) ?? "Puzzler",
      showOnLeaderboard: (d?.show_on_leaderboard as boolean) ?? true,
      region: (d?.region as string | null) ?? null,
      avatarHat: (d?.avatar_hat as string | null) ?? null,
      avatarGlasses: (d?.avatar_glasses as string | null) ?? null,
      avatarHoodie: (d?.avatar_hoodie as string | null) ?? null,
    };
  }

  const { data, error } = await supabase!
    .from("player_profiles")
    .insert({
      user_id: userId,
      display_name: (updates.display_name as string) ?? "Puzzler",
      show_on_leaderboard: (updates.show_on_leaderboard as boolean) ?? true,
      region: (updates.region as string | null) ?? null,
      avatar_hat: updates.avatar_hat ?? null,
      avatar_glasses: updates.avatar_glasses ?? null,
      avatar_hoodie: updates.avatar_hoodie ?? null,
      ...updates,
    })
    .select("display_name, show_on_leaderboard, region, avatar_hat, avatar_glasses, avatar_hoodie")
    .single();

  if (error) return null;
  const d = data as Record<string, unknown>;
  return {
    displayName: (d?.display_name as string) ?? "Puzzler",
    showOnLeaderboard: (d?.show_on_leaderboard as boolean) ?? true,
    region: (d?.region as string | null) ?? null,
    avatarHat: (d?.avatar_hat as string | null) ?? null,
    avatarGlasses: (d?.avatar_glasses as string | null) ?? null,
    avatarHoodie: (d?.avatar_hoodie as string | null) ?? null,
  };
}
