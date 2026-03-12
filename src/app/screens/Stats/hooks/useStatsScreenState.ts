/**
 * useStatsScreenState – tab, leaderboard type, filters, and URL sync for StatsScreen.
 */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  LeaderboardEntry,
  EfficiencyEntry,
} from "@/services/leaderboard/leaderboardService";
import type {
  PieceCutType,
  VisualModifierFilter,
  CompletionSourceFilter,
} from "@/services/leaderboard/leaderboardService";
import type { StatsTab } from "../components/StatsTabBar";
import type {
  LeaderboardType,
  LeaderboardSortMetric,
  WeekSubview,
  WeeklyAlbumSlot,
} from "../tabs";

export type { LeaderboardType, LeaderboardSortMetric };

const VALID_TABS: readonly StatsTab[] = ["profile", "leaderboard", "achievements"];

function isStatsTab(s: string | null): s is StatsTab {
  return s != null && (VALID_TABS as readonly string[]).includes(s);
}

export function useStatsScreenState() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<StatsTab>(() => {
    if (isStatsTab(tabParam)) return tabParam;
    return "profile";
  });

  const tabFromUrl = searchParams.get("tab");
  useEffect(() => {
    if (isStatsTab(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("today");
  const [leaderboardMetric, setLeaderboardMetric] =
    useState<LeaderboardSortMetric>("time");
  const [weekSubview, setWeekSubview] = useState<WeekSubview>("rankings");
  const [allTimeGrid, setAllTimeGrid] = useState<"3x3" | "4x4" | "5x5" | "6x6">("4x4");
  const [cutTypeFilter, setCutTypeFilter] = useState<PieceCutType>("all");
  const [modifierFilter, setModifierFilter] = useState<VisualModifierFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<CompletionSourceFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [stats, setStats] = useState<{
    puzzlesCompleted: number;
    totalPlayTimeSeconds: number;
    dailyStreak: number;
    bestDailyStreak: number;
    masteryStreak: number;
    bestMasteryStreak: number;
    lastPlayedAt: string | null;
    xp?: number;
    level?: number;
    prestigeCount?: number;
    challengeWins?: number;
  } | null>(null);

  const [profile, setProfile] = useState<{
    displayName: string;
    showOnLeaderboard: boolean;
  } | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [efficiencyLeaderboard, setEfficiencyLeaderboard] = useState<EfficiencyEntry[]>(
    [],
  );
  const [weeklyTotalsLeaderboard, setWeeklyTotalsLeaderboard] = useState<
    { rank: number; count: number; displayName: string }[]
  >([]);
  const [weeklyAlbumSlots, setWeeklyAlbumSlots] = useState<WeeklyAlbumSlot[]>([]);
  const [weeklyAlbumProgress, setWeeklyAlbumProgress] = useState(0);
  const [weekRangeLabel, setWeekRangeLabel] = useState("");
  const [todayCompletionCount, setTodayCompletionCount] = useState<number>(0);
  const [achievements, setAchievements] = useState<
    {
      id: string;
      name: string;
      description: string;
      icon: string;
      unlocked: boolean;
      unlockedAt: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [albumShareCopied, setAlbumShareCopied] = useState(false);
  const [raccoonName, setRaccoonName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rowAnimEpoch, setRowAnimEpoch] = useState(0);

  return {
    activeTab,
    setActiveTab,
    leaderboardType,
    setLeaderboardType,
    leaderboardMetric,
    setLeaderboardMetric,
    weekSubview,
    setWeekSubview,
    allTimeGrid,
    setAllTimeGrid,
    cutTypeFilter,
    setCutTypeFilter,
    modifierFilter,
    setModifierFilter,
    sourceFilter,
    setSourceFilter,
    filtersOpen,
    setFiltersOpen,
    stats,
    setStats,
    profile,
    setProfile,
    displayNameInput,
    setDisplayNameInput,
    leaderboard,
    setLeaderboard,
    efficiencyLeaderboard,
    setEfficiencyLeaderboard,
    weeklyTotalsLeaderboard,
    setWeeklyTotalsLeaderboard,
    weeklyAlbumSlots,
    setWeeklyAlbumSlots,
    weeklyAlbumProgress,
    setWeeklyAlbumProgress,
    weekRangeLabel,
    setWeekRangeLabel,
    todayCompletionCount,
    setTodayCompletionCount,
    achievements,
    setAchievements,
    loading,
    setLoading,
    profileSaving,
    setProfileSaving,
    shareCopied,
    setShareCopied,
    albumShareCopied,
    setAlbumShareCopied,
    raccoonName,
    setRaccoonName,
    currentUserId,
    setCurrentUserId,
    rowAnimEpoch,
    setRowAnimEpoch,
  };
}
