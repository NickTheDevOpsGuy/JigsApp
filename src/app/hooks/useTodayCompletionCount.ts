/**
 * useTodayCompletionCount – live count of today's daily puzzle completions.
 * Subscribes to Supabase Realtime INSERTs on completions (puzzle_date=today, is_daily=true).
 */
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/supabase/client";
import { getTodayDateString } from "@/daily/dailyPuzzleCore";
import { getTodayCompletionCount } from "@/services/leaderboardService";

export function useTodayCompletionCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    const today = getTodayDateString();

    const fetchInitial = async () => {
      const n = await getTodayCompletionCount();
      if (!cancelled) setCount(n);
    };
    void fetchInitial();

    const channel = supabase!
      .channel("today-completions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "completions",
          filter: `puzzle_date=eq.${today}`,
        },
        (payload) => {
          const row = payload.new as { is_daily?: boolean };
          if (row?.is_daily && !cancelled) setCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, []);

  return count;
}
