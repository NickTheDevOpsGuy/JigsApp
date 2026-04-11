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
  getDailyLeaderboardLeastMoves,
  getDailyLeaderboardCleanest,
  getTodayCompletionCount,
  subscribeTodayCompletionCount,
  getWeeklyTotalsLeaderboard,
  getAllTimeBestLeaderboard,
  getAllTimeBestLeastMoves,
  getAllTimeBestCleanest,
  getWeeklyEfficiencyLeaderboard,
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
    leaderboardMetric,
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
    setEfficiencyLeaderboard,
    setTodayCompletionCount,
    setWeeklyTotalsLeaderboard,
    setAchievements,
    setLoading,
    setLeaderboardType,
    setWeekSubview: _setWeekSubview,
    setRaccoonName,
    setCurrentUserId,
    setRowAnimEpoch,
    setProfileSaving,
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
    const cutType = cutTypeFilter === "all" ? "all" : cutTypeFilter;
    const visualModifier = modifierFilter;
    const dailyFetcher =
      leaderboardMetric === "moves"
        ? getDailyLeaderboardLeastMoves
        : leaderboardMetric === "cleanest"
          ? getDailyLeaderboardCleanest
          : getDailyLeaderboard;
    const [lb, todayCount, wklb] = await Promise.all([
      dailyFetcher(today, 10, cutType, visualModifier, sourceFilter),
      getTodayCompletionCount(today),
      getWeeklyTotalsLeaderboard(10, cutType, visualModifier, sourceFilter),
    ]);
    setLeaderboard(lb);
    setRowAnimEpoch((n) => n + 1);
    setTodayCompletionCount(todayCount);
    setWeeklyTotalsLeaderboard(wklb);
    await loadWeeklyAlbum();
    setLoading(false);
  }, [
    configured,
    leaderboardMetric,
    cutTypeFilter,
    modifierFilter,
    sourceFilter,
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
    let cancelled = false;
    getUserId().then((uid) => {
      if (cancelled) return;
      if (uid) {
        setRaccoonName(getAnonymousDisplayName(uid));
        setCurrentUserId(uid);
      } else {
        setCurrentUserId(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [configured, setRaccoonName, setCurrentUserId]);

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
    let cancelled = false;
    const loadLb = async () => {
      const today = getTodayDateString();
      const cutType = cutTypeFilter === "all" ? "all" : cutTypeFilter;
      const visualModifier = modifierFilter;
      if (leaderboardType === "today") {
        const fetcher =
          leaderboardMetric === "moves"
            ? getDailyLeaderboardLeastMoves
            : leaderboardMetric === "cleanest"
              ? getDailyLeaderboardCleanest
              : getDailyLeaderboard;
        const lb = await fetcher(today, 10, cutType, visualModifier, sourceFilter);
        if (cancelled) return;
        setLeaderboard(lb);
        setRowAnimEpoch((n) => n + 1);
      } else if (leaderboardType === "week") {
        const [wklb] = await Promise.all([
          getWeeklyTotalsLeaderboard(10, cutType, visualModifier, sourceFilter),
          loadWeeklyAlbum(),
        ]);
        if (cancelled) return;
        setWeeklyTotalsLeaderboard(wklb);
        setRowAnimEpoch((n) => n + 1);
      } else if (leaderboardType === "alltime") {
        const [r, c] = allTimeGrid.split("x").map(Number);
        const fetcher =
          leaderboardMetric === "moves"
            ? getAllTimeBestLeastMoves
            : leaderboardMetric === "cleanest"
              ? getAllTimeBestCleanest
              : getAllTimeBestLeaderboard;
        const lb = await fetcher(r, c, 10, cutType, visualModifier, sourceFilter);
        if (cancelled) return;
        setLeaderboard(lb);
        setRowAnimEpoch((n) => n + 1);
      } else if (leaderboardType === "efficiency") {
        const eff = await getWeeklyEfficiencyLeaderboard(
          10,
          cutType,
          visualModifier,
          sourceFilter,
        );
        if (cancelled) return;
        setEfficiencyLeaderboard(eff);
        setRowAnimEpoch((n) => n + 1);
      }
    };
    loadLb();
    return () => {
      cancelled = true;
    };
  }, [
    configured,
    activeTab,
    leaderboardType,
    leaderboardMetric,
    allTimeGrid,
    cutTypeFilter,
    modifierFilter,
    sourceFilter,
    loadWeeklyAlbum,
    setLeaderboard,
    setEfficiencyLeaderboard,
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

  return {
    loadData,
    loadWeeklyAlbum,
    handleSaveProfile,
  };
}
