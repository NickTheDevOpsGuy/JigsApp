import { supabase } from "./client";

/** Ensure user is signed in (anonymous). Call on app init if using Supabase. */
export async function ensureSignedIn(): Promise<string | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("Supabase anonymous sign-in failed:", error.message);
    return null;
  }
  return data.user?.id ?? null;
}

export async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}
