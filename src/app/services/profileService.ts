import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn, getUserId } from "@/supabase/auth";

/** Get display name for a user (from profiles or fallback to anonymized id). */
export async function getDisplayName(userId: string): Promise<string> {
  if (!isSupabaseConfigured()) return anonymizeUserId(userId);

  const { data, error } = await supabase!
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .single();

  if (!error && data?.display_name?.trim()) return data.display_name.trim();
  return anonymizeUserId(userId);
}

/** Update current user's display name. */
export async function setMyDisplayName(name: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const userId = await ensureSignedIn();
  if (!userId) return false;

  const trimmed = name.trim().slice(0, 32);
  const { error } = await supabase!.from("profiles").upsert(
    {
      user_id: userId,
      display_name: trimmed || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return !error;
}

/** Get current user's display name. */
export async function getMyDisplayName(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase!
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data?.display_name?.trim() ?? null;
}

function anonymizeUserId(userId: string): string {
  return `Player ${userId.slice(0, 8)}`;
}
