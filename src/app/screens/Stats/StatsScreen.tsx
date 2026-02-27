/**
 * StatsScreen – leaderboards, achievements, profile, streaks (Supabase).
 *
 * Sections: 1–210 state + tab routing + effects (nudge, completion count);
 * 211–360 dashboard/leaderboard content + header; 361–514 tab panels (Dashboard, Profile, Leaderboard, Achievements).
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "./StatsScreen.module.css";
import { isSupabaseConfigured, getSupabaseConfigStatus } from "@/supabase/client";
import { getMyStats } from "@/services/statsService";
import {
  getDailyLeaderboard,
  getTodayCompletionCount,
  subscribeTodayCompletionCount,
  getWeeklyTotalsLeaderboard,
  getCalendarWeekRange,
  getMyWeeklyAlbumCompletions,
  getAllTimeBestLeaderboard,
  type LeaderboardEntry,
  type PieceCutType,
  type VisualModifierFilter,
} from "@/services/leaderboardService";
import { getMyProfile, updateMyProfile } from "@/services/profileService";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { getUserId } from "@/supabase/auth";
import { getAnonymousDisplayName } from "@/data/anonymousNames";
import { getMyAchievements } from "@/services/achievementsService";
import { getTodayDateString } from "@/daily/dailyPuzzleCore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Loader } from "@/components/Loader";
import { getDatesInWeek, formatWeekRangeLabel } from "./statsFormatting";
import {
  DashboardTab,
  ProfileTab,
  LeaderboardTab,
  AchievementsTab,
  type LeaderboardType,
  type WeekSubview,
  type WeeklyAlbumSlot,
} from "./tabs";
import { StatsTabBar, type StatsTab } from "./components/StatsTabBar";
import { StatsScreenHeader } from "./components/StatsScreenHeader";

export function StatsScreen() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<StatsTab>(() => {
    if (
      tabParam &&
      ["dashboard", "profile", "leaderboard", "achievements"].includes(tabParam)
    ) {
      return tabParam as StatsTab;
    }
    return "dashboard";
  });

  const tabFromUrl = searchParams.get("tab");
  useEffect(() => {
    if (
      tabFromUrl &&
      ["dashboard", "profile", "leaderboard", "achievements"].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl as StatsTab);
    }
  }, [tabFromUrl]);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("today");
  const [weekSubview, setWeekSubview] = useState<WeekSubview>("rankings");
  const [allTimeGrid, setAllTimeGrid] = useState<"3x3" | "4x4" | "5x5" | "6x6">("4x4");
  const [cutTypeFilter, setCutTypeFilter] = useState<PieceCutType>("all");
  const [modifierFilter, setModifierFilter] = useState<VisualModifierFilter>("all");
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
  const [rowAnimEpoch, setRowAnimEpoch] = useState(0);

  const configured = isSupabaseConfigured();
  const isNarrow = useMediaQuery("(max-width: 520px)");

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
        imageUrl: puzzle?.fullImage ?? null,
        completed: !!flags?.completed,
        mastery: !!flags?.mastery,
        isToday: date === today,
        isFuture: date > today,
      };
    });
    setWeeklyAlbumSlots(slots);
    setWeeklyAlbumProgress(slots.filter((slot) => slot.completed).length);
  }, [configured]);

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
  }, [configured, loadWeeklyAlbum]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    loadData();
  }, [configured, loadData]);

  useEffect(() => {
    if (!configured) return;
    getUserId().then((uid) => {
      if (uid) setRaccoonName(getAnonymousDisplayName(uid));
    });
  }, [configured]);

  useEffect(() => {
    if (!configured || activeTab !== "leaderboard") return;
    const today = getTodayDateString();
    const weekStart = getCalendarWeekRange(today).start;
    const nudgeKey = `phuzzle:weeklyAlbumNudge:${weekStart}`;
    if (safeLocalStorage.getItem(nudgeKey) === "true") {
      setLeaderboardType("week");
      setWeekSubview("album");
      safeLocalStorage.removeItem(nudgeKey);
    }
  }, [configured, activeTab]);

  useEffect(() => {
    if (!configured || activeTab !== "leaderboard" || leaderboardType !== "today") return;
    const today = getTodayDateString();
    const unsub = subscribeTodayCompletionCount(today, setTodayCompletionCount);
    return unsub;
  }, [configured, activeTab, leaderboardType]);

  useEffect(() => {
    if (!configured || activeTab !== "leaderboard") return;
    const loadLb = async () => {
      const today = getTodayDateString();
      const cutType = cutTypeFilter === "all" ? "all" : cutTypeFilter;
      const visualModifier = modifierFilter;
      if (leaderboardType === "today") {
        const lb = await getDailyLeaderboard(today, 10, cutType, visualModifier);
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
        const lb = await getAllTimeBestLeaderboard(r, c, 10, cutType, visualModifier);
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
    loadWeeklyAlbum,
  ]);

  const handleSaveProfile = async () => {
    if (!configured) return;
    setProfileSaving(true);
    const updated = await updateMyProfile({
      displayName: displayNameInput.trim() || "Puzzler",
      showOnLeaderboard: profile?.showOnLeaderboard ?? true,
    });
    if (updated) setProfile(updated);
    setProfileSaving(false);
    loadData();
  };

  const handleShareLeaderboard = () => {
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
  };

  const handleShareWeeklyAlbum = async () => {
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
  };

  if (!configured) {
    const status = getSupabaseConfigStatus();
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Leaderboard</h1>
          <div className={styles.cardContent} data-testid="stats-card-content">
            <p className={styles.placeholder}>
              Connect Supabase to track your stats, compete on leaderboards, and unlock
              achievements.
            </p>
            <p className={styles.hint}>
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.
            </p>
            <p className={styles.debug}>
              VITE_SUPABASE_URL: {status.url ? "✓ set" : "✗ missing"} ·
              VITE_SUPABASE_ANON_KEY: {status.key ? "✓ set" : "✗ missing"}
            </p>
            <p className={styles.hint}>
              Local: add to .env.development and restart dev server. Vercel: add in
              project Settings → Environment Variables, then redeploy.
            </p>
            <Button onClick={() => nav("/")}>
              <ArrowLeft size={18} />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const _currentStreak = stats?.dailyStreak ?? 0;
  const weeklyCompleted = Math.max(0, Math.min(7, weeklyAlbumProgress));
  const weeklyRemaining = Math.max(0, 7 - weeklyCompleted);
  const masteryPuzzlesRemaining = Math.max(0, 1 - (stats?.masteryStreak ?? 0));
  const headerTitle =
    activeTab === "leaderboard"
      ? "Leaderboard"
      : activeTab === "dashboard"
        ? "Dashboard"
        : activeTab === "profile"
          ? "Profile"
          : "Achievements";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <StatsScreenHeader
          activeTab={activeTab}
          headerTitle={headerTitle}
          weeklyAlbumProgress={weeklyAlbumProgress}
          leaderboardType={leaderboardType}
          weekSubview={weekSubview}
          shareCopied={shareCopied}
          albumShareCopied={albumShareCopied}
          onBack={() => nav("/")}
          onShareLeaderboard={handleShareLeaderboard}
          onShareWeeklyAlbum={handleShareWeeklyAlbum}
        />

        {activeTab !== "leaderboard" && (
          <StatsTabBar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isNarrow={isNarrow}
            weeklyAlbumProgress={weeklyAlbumProgress}
          />
        )}

        <div className={styles.cardContent} data-testid="stats-card-content">
          {loading ? (
            <Loader label="Loading stats…" />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardTab
                  stats={stats}
                  weeklyAlbumProgress={weeklyAlbumProgress}
                  weeklyRemaining={weeklyRemaining}
                  masteryPuzzlesRemaining={masteryPuzzlesRemaining}
                />
              )}

              {activeTab === "profile" && (
                <ProfileTab
                  profile={profile}
                  setProfile={setProfile}
                  displayNameInput={displayNameInput}
                  setDisplayNameInput={setDisplayNameInput}
                  raccoonName={raccoonName}
                  stats={stats}
                  onSave={handleSaveProfile}
                  profileSaving={profileSaving}
                  loadData={loadData}
                />
              )}

              {activeTab === "leaderboard" && (
                <LeaderboardTab
                  leaderboardType={leaderboardType}
                  setLeaderboardType={setLeaderboardType}
                  weekSubview={weekSubview}
                  setWeekSubview={setWeekSubview}
                  allTimeGrid={allTimeGrid}
                  setAllTimeGrid={setAllTimeGrid}
                  filtersOpen={filtersOpen}
                  setFiltersOpen={setFiltersOpen}
                  cutTypeFilter={cutTypeFilter}
                  setCutTypeFilter={setCutTypeFilter}
                  modifierFilter={modifierFilter}
                  setModifierFilter={setModifierFilter}
                  leaderboard={leaderboard}
                  weeklyTotalsLeaderboard={weeklyTotalsLeaderboard}
                  todayCompletionCount={todayCompletionCount}
                  weeklyAlbumSlots={weeklyAlbumSlots}
                  weeklyAlbumProgress={weeklyAlbumProgress}
                  weeklyCompleted={weeklyCompleted}
                  weekRangeLabel={weekRangeLabel}
                  loadData={loadData}
                  rowAnimEpoch={rowAnimEpoch}
                />
              )}

              {activeTab === "achievements" && (
                <AchievementsTab achievements={achievements} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
