import { useCallback, useEffect, useState } from "react";

import {
  formatLocalYmd,
  getCurrentStreak,
  getDailyPuzzleNumber,
  getStreakFreezeCount,
  getTodayDailyTime,
  getTodayDateString,
  isTodayDailyCompleted,
  parseLocalYmd,
} from "@/daily/dailyPuzzleCore";
import { getTodayCompletionCount } from "@/services/leaderboard/leaderboardService";
import { loadPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { MENU_REFRESH_EVENT } from "@/utils/menuRefresh";

export type RecentDailyStatus = {
  date: string;
  label: string;
  completed: boolean;
  isToday: boolean;
};

export type MenuSnapshot = {
  streak: number;
  savedPuzzle: ReturnType<typeof loadPuzzleState>;
  todayCompleted: boolean;
  todayTime: number | null;
  streakFreezeCount: number;
  dailyPuzzleNumber: number;
  recentDailyStatuses: RecentDailyStatus[];
};

function getRecentDailyStatuses(days: number): RecentDailyStatus[] {
  const result: RecentDailyStatus[] = [];
  const today = getTodayDateString();
  const todayDate = parseLocalYmd(today);

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(todayDate);
    date.setDate(date.getDate() - offset);
    const ymd = formatLocalYmd(date);
    result.push({
      date: ymd,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      completed: safeLocalStorage.getItem(`phuzzle:daily:${ymd}:completed`) === "true",
      isToday: ymd === today,
    });
  }

  return result;
}

function getMenuSnapshot(): MenuSnapshot {
  return {
    streak: getCurrentStreak(),
    savedPuzzle: loadPuzzleState(),
    todayCompleted: isTodayDailyCompleted(),
    todayTime: getTodayDailyTime(),
    streakFreezeCount: getStreakFreezeCount(),
    dailyPuzzleNumber: getDailyPuzzleNumber(),
    recentDailyStatuses: getRecentDailyStatuses(7),
  };
}

export function useMenuHomeData() {
  const [menuSnapshot, setMenuSnapshot] = useState<MenuSnapshot>(() => getMenuSnapshot());
  const [todayPlayersSolved, setTodayPlayersSolved] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshSnapshot = useCallback(() => {
    setMenuSnapshot(getMenuSnapshot());
    setRefreshTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshSnapshot();
      }
    };

    window.addEventListener("focus", refreshSnapshot);
    window.addEventListener(MENU_REFRESH_EVENT, refreshSnapshot as EventListener);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", refreshSnapshot);
      window.removeEventListener(MENU_REFRESH_EVENT, refreshSnapshot as EventListener);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshSnapshot]);

  useEffect(() => {
    let cancelled = false;

    void getTodayCompletionCount(getTodayDateString())
      .then((count: number) => {
        if (!cancelled) setTodayPlayersSolved(count);
      })
      .catch(() => {
        if (!cancelled) setTodayPlayersSolved(null);
      });

    return () => {
      cancelled = true;
    };
  }, [menuSnapshot.todayCompleted, menuSnapshot.dailyPuzzleNumber, refreshTick]);

  return {
    menuSnapshot,
    todayPlayersSolved,
    refreshSnapshot,
  };
}
