/**
 * useHomeData – all data the home screen needs in one place.
 * Reads from localStorage via daily puzzle helpers; no network calls.
 */
import { useMemo } from "react";
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

const DAILY_PREFIX = "phuzzle:daily:";

export type WeekDot = { day: string; done: boolean; isToday: boolean };

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
    return { day: label, done, isToday: dateStr === today };
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useHomeData() {
  return useMemo(() => {
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
    };
  }, []);
}
