/**
 * dailyCommentsService – lightweight comments and emoji reactions on daily puzzles.
 * Available after completion; 280 char limit; report support for moderation.
 */
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { ensureSignedIn, getUserId } from "@/supabase/auth";

const MAX_COMMENT_LENGTH = 280;
const REACTION_EMOJIS = ["👍", "🎉", "🔥", "✨", "💪"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function getReactionEmojis(): readonly ReactionEmoji[] {
  return REACTION_EMOJIS;
}

export interface DailyComment {
  id: string;
  puzzle_date: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface DailyReactionCount {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export async function fetchDailyComments(puzzleDate: string): Promise<DailyComment[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from("daily_comments")
    .select("id, puzzle_date, user_id, body, created_at")
    .eq("puzzle_date", puzzleDate)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as DailyComment[];
}

export async function fetchDailyReactions(
  puzzleDate: string,
): Promise<DailyReactionCount[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("daily_reactions")
    .select("emoji, user_id")
    .eq("puzzle_date", puzzleDate);
  if (error) return [];
  const rows = data ?? [];
  const byEmoji = new Map<string, { count: number; userReacted: boolean }>();
  for (const e of REACTION_EMOJIS) {
    byEmoji.set(e, { count: 0, userReacted: false });
  }
  for (const r of rows) {
    const e = r.emoji as string;
    const cur = byEmoji.get(e) ?? { count: 0, userReacted: false };
    cur.count += 1;
    if (userId != null && r.user_id === userId) cur.userReacted = true;
    byEmoji.set(e, cur);
  }
  return REACTION_EMOJIS.map((emoji) => {
    const cur = byEmoji.get(emoji) ?? { count: 0, userReacted: false };
    return { emoji, count: cur.count, userReacted: cur.userReacted };
  });
}

export async function postComment(puzzleDate: string, body: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const trimmed = body.trim().slice(0, MAX_COMMENT_LENGTH);
  if (!trimmed) return false;
  const userId = await ensureSignedIn();
  if (!userId) return false;
  const { error } = await supabase.from("daily_comments").insert({
    puzzle_date: puzzleDate,
    user_id: userId,
    body: trimmed,
  });
  return !error;
}

export async function toggleReaction(
  puzzleDate: string,
  emoji: string,
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  if (!REACTION_EMOJIS.includes(emoji as ReactionEmoji)) return false;
  const userId = await ensureSignedIn();
  if (!userId) return false;
  const { data: existing } = await supabase
    .from("daily_reactions")
    .select("id, emoji")
    .eq("puzzle_date", puzzleDate)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    if (existing.emoji === emoji) {
      const { error } = await supabase
        .from("daily_reactions")
        .delete()
        .eq("id", existing.id);
      return !error;
    }
    const { error } = await supabase
      .from("daily_reactions")
      .update({ emoji })
      .eq("id", existing.id);
    return !error;
  }
  const { error } = await supabase.from("daily_reactions").insert({
    puzzle_date: puzzleDate,
    user_id: userId,
    emoji,
  });
  return !error;
}

export async function reportComment(commentId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const reporterId = await ensureSignedIn();
  if (!reporterId) return false;
  const { error } = await supabase.from("daily_comment_reports").insert({
    comment_id: commentId,
    reporter_id: reporterId,
    reason: "inappropriate",
  });
  return !error;
}
