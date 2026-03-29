/**
 * useHomeData – all data the home screen needs in one place.
 * Reads from localStorage via daily puzzle helpers; no network calls.
 */
import { useMemo, useState, useEffect } from "react";
import {
  getCurrentStreak,
  getStreakFreezeCount,
  getDailyPuzzleNumber,
  getDailyPreferredDifficultyIndex,
  isTodayDailyCompleted,
  getTodayDailyTime,
  getTodayDateString,
  getLocalWeekMondayYmd,
} from "@/daily/dailyPuzzleCore";
import { GRID_OPTIONS } from "@/daily/dailyGridOptions";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import {
  dailyStreakXpMultiplier,
  formatStreakXpMultiplierLabel,
} from "@/services/player/dailyStreakXp";

const DAILY_PREFIX = "phuzzle:daily:";

export type WeekDot = { day: string; done: boolean; isToday: boolean; isFuture: boolean };

function getWeekDots(): WeekDot[] {
  const today = getTodayDateString();
  const monday = getLocalWeekMondayYmd(today);
  const [y, m, d] = monday.split("-").map(Number);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return days.map((label, i) => {
    const date = new Date(y!, m! - 1, d! + i);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateStr = `${yy}-${mm}-${dd}`;
    const done =
      safeLocalStorage.getItem(`${DAILY_PREFIX}${dateStr}:completed`) === "true";
    const isToday = dateStr === today;
    const isFuture = dateStr > today;
    return { day: label, done, isToday, isFuture };
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function computeHomeData() {
  const streak = getCurrentStreak();
  const freezes = getStreakFreezeCount();
  const puzzleNumber = getDailyPuzzleNumber();
  const diffIndex = getDailyPreferredDifficultyIndex() ?? 1;
  const grid = GRID_OPTIONS[Math.min(diffIndex, GRID_OPTIONS.length - 1)];
  const isCompleted = isTodayDailyCompleted();
  const todayTime = getTodayDailyTime();
  const weekDots: WeekDot[] = getWeekDots();
  const weeklyCompleted = weekDots.filter((dot) => dot.done).length;
  const weeklyRemaining = Math.max(0, 7 - weeklyCompleted);
  /** Multiplier for XP on the next daily completion (streak after that solve = current + 1). */
  const nextDailyXpMultiplier = dailyStreakXpMultiplier(streak + 1);
  const nextDailyXpMultiplierLabel = formatStreakXpMultiplierLabel(nextDailyXpMultiplier);

  return {
    streak,
    freezes,
    puzzleNumber,
    gridLabel: grid ? `${grid.rows}×${grid.cols} · ${grid.pieces} pieces` : "Daily",
    isCompleted,
    todayTimeLabel: todayTime ? formatTime(todayTime) : null,
    weekDots,
    weeklyCompleted,
    weeklyRemaining,
    nextDailyXpMultiplier,
    nextDailyXpMultiplierLabel,
  };
}

export type DailySpotlightHome = {
  /** One line: theme + featured puzzle name */
  line: string;
  /** Accessible / longer description */
  description: string;
} | null;

export function useHomeData() {
  const [tick, setTick] = useState(0);
  const [dailySpotlight, setDailySpotlight] = useState<DailySpotlightHome>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/daily/dailyPuzzle").then((m) => {
      if (cancelled) return;
      const s = m.getTodayDailySpotlight();
      if (!s) {
        setDailySpotlight(null);
        return;
      }
      setDailySpotlight({
        line: `${s.categoryEmoji} ${s.categoryName} · ${s.puzzleName}`,
        description: `Each day highlights a category and a featured puzzle. Today: ${s.categoryName} — ${s.puzzleName}.`,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("phuzzle:menuRefresh", handler);
    return () => window.removeEventListener("phuzzle:menuRefresh", handler);
  }, []);

  /** Re-read streak / daily completion when the tab becomes visible (new calendar day, another tab, etc.). */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setTick((t) => t + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return useMemo(
    () => ({
      ...computeHomeData(),
      dailySpotlight,
    }),
    [tick, dailySpotlight],
  );
}
