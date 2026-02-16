/**
 * profileService – player_profiles: display name, show_on_leaderboard, region.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { getUserId, ensureSignedIn } from "@/supabase/auth";

export type PlayerProfile = {
  displayName: string;
  showOnLeaderboard: boolean;
  region: string | null;
};

/** Fetch current user's profile. */
export async function getMyProfile(): Promise<PlayerProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase!
    .from("player_profiles")
    .select("display_name, show_on_leaderboard, region")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") return null;
  if (!data) return null;

  return {
    displayName: data.display_name ?? "Puzzler",
    showOnLeaderboard: data.show_on_leaderboard ?? true,
    region: data.region ?? null,
  };
}

/** Update display name and leaderboard visibility. */
export async function updateMyProfile(args: {
  displayName?: string;
  showOnLeaderboard?: boolean;
  region?: string | null;
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
      .select("display_name, show_on_leaderboard, region")
      .single();
    if (error) return null;
    return {
      displayName: data?.display_name ?? "Puzzler",
      showOnLeaderboard: data?.show_on_leaderboard ?? true,
      region: data?.region ?? null,
    };
  }

  const { data, error } = await supabase!
    .from("player_profiles")
    .insert({
      user_id: userId,
      display_name: (updates.display_name as string) ?? "Puzzler",
      show_on_leaderboard: (updates.show_on_leaderboard as boolean) ?? true,
      region: (updates.region as string | null) ?? null,
      ...updates,
    })
    .select("display_name, show_on_leaderboard, region")
    .single();

  if (error) return null;
  return {
    displayName: data?.display_name ?? "Puzzler",
    showOnLeaderboard: data?.show_on_leaderboard ?? true,
    region: data?.region ?? null,
  };
}
