/**
 * useStatsScreenData – data loading, subscriptions, and share/save handlers for StatsScreen.
 */
import { useEffect, useCallback } from "react";
import { getTodayDateString } from "@/daily/dailyPuzzleCore";
import {
  getCalendarWeekRange,
  getMyWeeklyAlbumCompletions,
} from "@/services/leaderboard/leaderboardService";
import {
  getDailyLeaderboard,
  getTodayCompletionCount,
  subscribeTodayCompletionCount,
  getWeeklyTotalsLeaderboard,
  getAllTimeBestLeaderboard,
} from "@/services/leaderboard/leaderboardService";
import { getMyAchievements } from "@/services/player/achievementsService";
import { getMyStats } from "@/services/player/statsService";
import { getMyProfile, updateMyProfile } from "@/services/player/profileService";
import { getUserId } from "@/supabase/auth";
import { getAnonymousDisplayName } from "@/data/content/anonymousNames";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { getDatesInWeek, formatWeekRangeLabel } from "../statsFormatting";
import type { WeeklyAlbumSlot } from "../tabs";
import type { useStatsScreenState } from "./useStatsScreenState";

export function useStatsScreenData(
  configured: boolean,
  state: ReturnType<typeof useStatsScreenState>,
) {
  const {
    activeTab,
    leaderboardType,
    cutTypeFilter,
    modifierFilter,
    sourceFilter,
    allTimeGrid,
    profile,
    displayNameInput,
    setWeekRangeLabel,
    setWeeklyAlbumSlots,
    setWeeklyAlbumProgress,
    setStats,
    setProfile,
    setDisplayNameInput,
    setLeaderboard,
    setTodayCompletionCount,
    setWeeklyTotalsLeaderboard,
    setAchievements,
    setLoading,
    setLeaderboardType,
    setWeekSubview: _setWeekSubview,
    setRaccoonName,
    setRowAnimEpoch,
    setProfileSaving,
    setShareCopied,
    setAlbumShareCopied,
    weeklyAlbumSlots,
    weeklyAlbumProgress,
  } = state;

  const loadWeeklyAlbum = useCallback(async () => {
    if (!configured) return;
    const today = getTodayDateString();
    const weekRange = getCalendarWeekRange(today);
    setWeekRangeLabel(formatWeekRangeLabel(weekRange.start, weekRange.end));
    const [completionRows, dailyModule] = await Promise.all([
      getMyWeeklyAlbumCompletions(weekRange.start, weekRange.end),
      import("@/daily/dailyPuzzle"),
    ]);
    const completionMap = new Map(completionRows.map((r) => [r.date, r]));
    const weekDates = getDatesInWeek(weekRange.start);
    const slots: WeeklyAlbumSlot[] = weekDates.map((date) => {
      const puzzle = dailyModule.getDailyPuzzleForDate(date);
      const flags = completionMap.get(date);
      const d = new Date(`${date}T00:00:00.000Z`);
      return {
        date,
        dayLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
        imageUrl: puzzle ? puzzle.fullImage || puzzle.thumbnail || null : null,
        completed: !!flags?.completed,
        mastery: !!flags?.mastery,
        isToday: date === today,
        isFuture: date > today,
      };
    });
    setWeeklyAlbumSlots(slots);
    setWeeklyAlbumProgress(slots.filter((slot) => slot.completed).length);
  }, [configured, setWeekRangeLabel, setWeeklyAlbumSlots, setWeeklyAlbumProgress]);

  const loadData = useCallback(async () => {
    if (!configured) return;
    const [s, p, a] = await Promise.all([
      getMyStats(),
      getMyProfile(),
      getMyAchievements(),
    ]);
    setStats(s ?? null);
    setProfile(p ?? null);
    setDisplayNameInput(p?.displayName ?? "");
    setAchievements(a ?? []);
    const today = getTodayDateString();
    const [lb, todayCount, wklb] = await Promise.all([
      getDailyLeaderboard(today, 10, "all", "all"),
      getTodayCompletionCount(today),
      getWeeklyTotalsLeaderboard(),
    ]);
    setLeaderboard(lb);
    setRowAnimEpoch((n) => n + 1);
    setTodayCompletionCount(todayCount);
    setWeeklyTotalsLeaderboard(wklb);
    await loadWeeklyAlbum();
    setLoading(false);
  }, [
    configured,
    loadWeeklyAlbum,
    setStats,
    setProfile,
    setDisplayNameInput,
    setAchievements,
    setLeaderboard,
    setRowAnimEpoch,
    setTodayCompletionCount,
    setWeeklyTotalsLeaderboard,
    setLoading,
  ]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    loadData();
  }, [configured, loadData, setLoading]);

  useEffect(() => {
    if (!configured) return;
    getUserId().then((uid) => {
      if (uid) setRaccoonName(getAnonymousDisplayName(uid));
    });
  }, [configured, setRaccoonName]);

  useEffect(() => {
    if (!configured || activeTab !== "leaderboard") return;
    const today = getTodayDateString();
    const weekStart = getCalendarWeekRange(today).start;
    const nudgeKey = `phuzzle:weeklyAlbumNudge:${weekStart}`;
    if (safeLocalStorage.getItem(nudgeKey) === "true") {
      setLeaderboardType("week");
      safeLocalStorage.removeItem(nudgeKey);
    }
  }, [configured, activeTab, setLeaderboardType]);

  useEffect(() => {
    if (!configured || activeTab !== "leaderboard" || leaderboardType !== "today") return;
    const today = getTodayDateString();
    const unsub = subscribeTodayCompletionCount(today, setTodayCompletionCount);
    return unsub;
  }, [configured, activeTab, leaderboardType, setTodayCompletionCount]);

  useEffect(() => {
    if (!configured || activeTab !== "leaderboard") return;
    const loadLb = async () => {
      const today = getTodayDateString();
      const cutType = cutTypeFilter === "all" ? "all" : cutTypeFilter;
      const visualModifier = modifierFilter;
      if (leaderboardType === "today") {
        const lb = await getDailyLeaderboard(
          today,
          10,
          cutType,
          visualModifier,
          sourceFilter,
        );
        setLeaderboard(lb);
        setRowAnimEpoch((n) => n + 1);
      } else if (leaderboardType === "week") {
        const [wklb] = await Promise.all([
          getWeeklyTotalsLeaderboard(),
          loadWeeklyAlbum(),
        ]);
        setWeeklyTotalsLeaderboard(wklb);
        setRowAnimEpoch((n) => n + 1);
      } else if (leaderboardType === "alltime") {
        const [r, c] = allTimeGrid.split("x").map(Number);
        const lb = await getAllTimeBestLeaderboard(
          r,
          c,
          10,
          cutType,
          visualModifier,
          sourceFilter,
        );
        setLeaderboard(lb);
        setRowAnimEpoch((n) => n + 1);
      }
    };
    loadLb();
  }, [
    configured,
    activeTab,
    leaderboardType,
    allTimeGrid,
    cutTypeFilter,
    modifierFilter,
    sourceFilter,
    loadWeeklyAlbum,
    setLeaderboard,
    setWeeklyTotalsLeaderboard,
    setRowAnimEpoch,
  ]);

  const handleSaveProfile = useCallback(async () => {
    if (!configured) return;
    setProfileSaving(true);
    const updated = await updateMyProfile({
      displayName: displayNameInput.trim() || "Puzzler",
      showOnLeaderboard: profile?.showOnLeaderboard ?? true,
    });
    if (updated) setProfile(updated);
    setProfileSaving(false);
    loadData();
  }, [
    configured,
    displayNameInput,
    profile?.showOnLeaderboard,
    setProfile,
    setProfileSaving,
    loadData,
  ]);

  const handleShareLeaderboard = useCallback(() => {
    const text =
      leaderboardType === "today"
        ? `Today's Daily Puzzle leaderboard - Phuzzle`
        : leaderboardType === "week"
          ? "Weekly leaderboard - Phuzzle"
          : "All-time leaderboard - Phuzzle";
    const url = window.location.origin;
    const shareText = `${text}\n${url}`;
    if (navigator.share) {
      navigator.share({
        title: "Phuzzle Leaderboard",
        text: shareText,
        url,
      });
    } else {
      navigator.clipboard?.writeText(shareText).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      });
    }
  }, [leaderboardType, setShareCopied]);

  const handleShareWeeklyAlbum = useCallback(async () => {
    const marks = weeklyAlbumSlots.map((slot) => (slot.completed ? "🟩" : "⬜")).join("");
    const masteryMarks = weeklyAlbumSlots
      .map((slot) => (slot.mastery ? "⚡" : "·"))
      .join("");
    const shareText = [
      "🧩 Phuzzle Weekly Collection Album",
      `${weeklyAlbumProgress}/7 daily puzzles completed`,
      marks,
      `Mastery: ${masteryMarks}`,
      weeklyAlbumProgress === 7 ? "🏅 Perfect Week Badge unlocked!" : "",
      window.location.origin,
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      await navigator.share({
        title: "Phuzzle Weekly Album",
        text: shareText,
        url: window.location.origin,
      });
      return;
    }

    await navigator.clipboard?.writeText(shareText);
    setAlbumShareCopied(true);
    setTimeout(() => setAlbumShareCopied(false), 2000);
  }, [weeklyAlbumSlots, weeklyAlbumProgress, setAlbumShareCopied]);

  return {
    loadData,
    loadWeeklyAlbum,
    handleSaveProfile,
    handleShareLeaderboard,
    handleShareWeeklyAlbum,
  };
}
