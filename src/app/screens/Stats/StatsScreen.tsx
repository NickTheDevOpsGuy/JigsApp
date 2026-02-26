/**
 * StatsScreen – leaderboards, achievements, profile, streaks (Supabase).
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Trophy, Award, User, Share2 } from "lucide-react";
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
import { prestigeReset } from "@/services/prestigeService";
import { getMyProfile, updateMyProfile } from "@/services/profileService";
import { getUserId } from "@/supabase/auth";
import { getAnonymousDisplayName } from "@/data/anonymousNames";
import { getMyAchievements } from "@/services/achievementsService";
import { getTodayDateString, getStreakFreezeCount } from "@/daily/dailyPuzzleCore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DailyCountdown } from "@/components/DailyCountdown/DailyCountdown";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}m ${s}s`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatGap(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getDatesInWeek(weekStart: string): string[] {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatWeekRangeLabel(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00.000Z`);
  const e = new Date(`${end}T00:00:00.000Z`);
  const sText = s.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const eText = e.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${sText} - ${eText}`;
}

const PODIUM = ["🥇", "🥈", "🥉"];

type LeaderboardType = "today" | "week" | "alltime";
type WeekSubview = "rankings" | "album";
type WeeklyAlbumSlot = {
  date: string;
  dayLabel: string;
  imageUrl: string | null;
  completed: boolean;
  mastery: boolean;
  isToday: boolean;
  isFuture: boolean;
};

type StatsTab = "dashboard" | "profile" | "leaderboard" | "achievements";

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
  const leaderboardCompact = true;
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
    try {
      if (localStorage.getItem(nudgeKey) === "true") {
        setLeaderboardType("week");
        setWeekSubview("album");
        localStorage.removeItem(nudgeKey);
      }
    } catch {
      // ignore
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

  const renderTimeLeaderboard = (
    entries: LeaderboardEntry[],
    emptyMsg: string,
    showChampionBadge = false,
  ) => (
    <>
      {entries.length === 0 ? (
        <p className={styles.empty}>{emptyMsg}</p>
      ) : (
        <ol
          className={`${styles.leaderboard} ${
            leaderboardCompact ? styles.leaderboardCompact : ""
          }`}
        >
          {entries.map((entry, index) => {
            const key = `time-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
            const next = entries[index + 1]?.elapsedSeconds;
            const gapInfo =
              index === 0 && typeof next === "number"
                ? `+${formatGap(next - entry.elapsedSeconds)} ahead of #2`
                : index === 1 && typeof next === "number"
                  ? `+${formatGap(next - entry.elapsedSeconds)} ahead of #3`
                  : null;
            return (
              <li
                key={key}
                className={`${styles.leaderboardItem} ${
                  entry.rank <= 3 ? styles.leaderboardPodium : ""
                } ${styles.leaderboardRowEnter}`}
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <span className={styles.rank}>
                  {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span className={styles.player}>
                  {entry.displayName}
                  {showChampionBadge && entry.rank === 1 && (
                    <span className={styles.championBadge} title="Challenge winner">
                      {" "}
                      🏆
                    </span>
                  )}
                </span>
                <span className={styles.timeCol}>
                  <span className={styles.time}>{formatTime(entry.elapsedSeconds)}</span>
                  {gapInfo && <span className={styles.gapInfo}>{gapInfo}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );

  const renderCompletionLeaderboard = (
    entries: { rank: number; count: number; displayName: string }[],
    emptyMsg = "No completions yet. Play puzzles!",
  ) => (
    <>
      {entries.length === 0 ? (
        <p className={styles.empty}>{emptyMsg}</p>
      ) : (
        <ol
          className={`${styles.leaderboard} ${
            leaderboardCompact ? styles.leaderboardCompact : ""
          }`}
        >
          {entries.map((entry) => {
            const key = `completion-${entry.rank}-${entry.displayName}-${rowAnimEpoch}`;
            return (
              <li
                key={key}
                className={`${styles.leaderboardItem} ${
                  entry.rank <= 3 ? styles.leaderboardPodium : ""
                } ${styles.leaderboardRowEnter}`}
                style={{ animationDelay: `${(entry.rank - 1) * 45}ms` }}
              >
                <span className={styles.rank}>
                  {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span className={styles.player}>{entry.displayName}</span>
                <span className={styles.time}>{entry.count} puzzles</span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );

  const currentStreak = stats?.dailyStreak ?? 0;
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
        <div className={styles.header}>
          <Button size="sm" onClick={() => nav("/")}>
            <ArrowLeft size={18} />
            Back
          </Button>
          <h1 className={styles.title}>
            {headerTitle}
            {activeTab === "leaderboard" && (
              <span className={styles.titleProgress}>{weeklyAlbumProgress}/7</span>
            )}
          </h1>
          {activeTab === "leaderboard" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={
                leaderboardType === "week" && weekSubview === "album"
                  ? handleShareWeeklyAlbum
                  : handleShareLeaderboard
              }
              className={styles.headerShareBtn}
              aria-label={
                leaderboardType === "week" && weekSubview === "album"
                  ? albumShareCopied
                    ? "Copied weekly album share text"
                    : "Share weekly album"
                  : shareCopied
                    ? "Copied leaderboard share text"
                    : "Share leaderboard"
              }
              title={
                leaderboardType === "week" && weekSubview === "album"
                  ? albumShareCopied
                    ? "Copied!"
                    : "Share album"
                  : shareCopied
                    ? "Copied!"
                    : "Share leaderboard"
              }
            >
              <Share2 size={16} />
            </Button>
          )}
        </div>

        {activeTab !== "leaderboard" && (
          <div className={styles.tabs}>
            <button
              className={activeTab === "dashboard" ? styles.tabActive : ""}
              onClick={() => setActiveTab("dashboard")}
              aria-label="Dashboard"
            >
              <BarChart3 size={18} aria-hidden />
              <span>{isNarrow ? "Dash" : "Dashboard"}</span>
            </button>
            <button
              className={activeTab === "profile" ? styles.tabActive : ""}
              onClick={() => setActiveTab("profile")}
              aria-label="Profile"
            >
              <User size={18} aria-hidden />
              <span>Profile</span>
            </button>
            <button
              className=""
              onClick={() => setActiveTab("leaderboard")}
              aria-label="Leaderboard"
            >
              <Trophy size={18} aria-hidden />
              <span>{isNarrow ? "Board" : "Leaderboard"}</span>
              <span className={styles.tabMiniProgress}>{weeklyAlbumProgress}/7</span>
            </button>
            <button
              className={activeTab === "achievements" ? styles.tabActive : ""}
              onClick={() => setActiveTab("achievements")}
              aria-label="Achievements"
            >
              <Award size={18} aria-hidden />
              <span>{isNarrow ? "Badges" : "Achievements"}</span>
            </button>
          </div>
        )}

        <div className={styles.cardContent} data-testid="stats-card-content">
          {loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <div className={styles.section}>
                  <div className={styles.retentionHero}>
                    <p className={styles.retentionHeading}>🔥 CURRENT STREAK</p>
                    <div className={styles.retentionDivider} />
                    <p className={styles.retentionBig}>{currentStreak} days</p>
                    <p className={styles.retentionSub}>Keep it alive.</p>
                    <p className={styles.retentionSub}>
                      <strong>{weeklyCompleted}</strong> <strong>/</strong> <strong>7</strong> days
                    </p>
                    <p className={styles.retentionSub}>
                      {weeklyRemaining === 0
                        ? "Weekly Album badge unlocked!"
                        : `${weeklyRemaining} day${weeklyRemaining === 1 ? "" : "s"} until Weekly Album badge`}
                    </p>
                  </div>
                  <div className={styles.retentionDivider} />

                  <div className={styles.overallBlock}>
                    <p className={styles.retentionHeading}>📊 OVERALL PROGRESS</p>
                    <div className={styles.overallRows}>
                      <div className={styles.overallRow}>
                        <span>Puzzles Completed</span>
                        <strong>{stats?.puzzlesCompleted ?? 0}</strong>
                      </div>
                      <div className={styles.overallRow}>
                        <span>Total Play Time</span>
                        <strong>
                          {formatDuration(stats?.totalPlayTimeSeconds ?? 0)}
                        </strong>
                      </div>
                      <div className={styles.overallRow}>
                        <span>Best Streak</span>
                        <strong>{stats?.bestDailyStreak ?? 0} days</strong>
                      </div>
                      <div className={styles.overallRow}>
                        <span>Streak Freeze</span>
                        <strong>{getStreakFreezeCount()} available</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.retentionDivider} />

                  <div className={styles.nextUnlock}>
                    <p className={styles.retentionHeading}>🏅 NEXT UNLOCK</p>
                    <p className={styles.nextUnlockText}>
                      {masteryPuzzlesRemaining > 0
                        ? `Complete ${masteryPuzzlesRemaining} more puzzle${masteryPuzzlesRemaining === 1 ? "" : "s"} without hints to earn Mastery Badge`
                        : "Mastery Badge earned. Keep the no-hint streak going."}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className={styles.section}>
                  <h2>Display Name</h2>
                  <p className={styles.hint}>Set your name to appear on leaderboards.</p>
                  <input
                    type="text"
                    className={styles.displayNameInput}
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Puzzler"
                    maxLength={32}
                    aria-label="Display name"
                  />
                  <div className={styles.profileRow}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={profile?.showOnLeaderboard ?? true}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p!,
                            showOnLeaderboard: e.target.checked,
                          }))
                        }
                      />
                      <span>Show my name on leaderboards</span>
                    </label>
                  </div>
                  {raccoonName && (
                    <p className={styles.raccoonPreview}>
                      🦝 Your raccoon name: <strong>{raccoonName}</strong>
                    </p>
                  )}
                  <p className={styles.hint}>
                    🏅 Mastery badge: complete the daily puzzle with no hints and no undo.
                    Current mastery streak: <strong>{stats?.masteryStreak ?? 0}</strong>.
                  </p>
                  {stats && (stats.level ?? 1) >= 5 && (
                    <div className={styles.prestigeSection}>
                      <h3>Prestige</h3>
                      <p className={styles.hint}>
                        Reset to Level 1 and earn a rare cosmetic badge. Your puzzles
                        completed and challenge wins are kept.
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const result = await prestigeReset();
                          if (result) loadData();
                        }}
                      >
                        Prestige Reset ★
                      </Button>
                    </div>
                  )}
                  <p className={styles.hint}>
                    Off = raccoon name on boards. You&apos;re still tracked.
                  </p>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className={styles.saveBtn}
                  >
                    {profileSaving ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}

              {activeTab === "leaderboard" && (
                <div className={styles.section}>
                  <div className={styles.countdownWrap}>
                    <DailyCountdown
                      prominent
                      variant="anticipation"
                      onUnlock={() => {
                        if (leaderboardType === "today") loadData();
                      }}
                    />
                  </div>
                  <div className={styles.leaderboardHeader}>
                    <div
                      className={styles.boardModeSwitch}
                      role="tablist"
                      aria-label="Board mode"
                    >
                      <button
                        type="button"
                        className={`${styles.boardModeBtn} ${
                          leaderboardType === "today" ? styles.boardModeBtnActive : ""
                        }`}
                        onClick={() => setLeaderboardType("today")}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className={`${styles.boardModeBtn} ${
                          leaderboardType === "week" ? styles.boardModeBtnActive : ""
                        }`}
                        onClick={() => setLeaderboardType("week")}
                      >
                        Week ({weeklyAlbumProgress}/7)
                      </button>
                      <button
                        type="button"
                        className={`${styles.boardModeBtn} ${
                          leaderboardType === "alltime" ? styles.boardModeBtnActive : ""
                        }`}
                        onClick={() => setLeaderboardType("alltime")}
                      >
                        All-time
                      </button>
                    </div>
                    {leaderboardType === "week" && (
                      <div className={styles.weekSubviewSwitch}>
                        <button
                          type="button"
                          className={`${styles.weekSubviewBtn} ${
                            weekSubview === "rankings" ? styles.weekSubviewBtnActive : ""
                          }`}
                          onClick={() => setWeekSubview("rankings")}
                        >
                          Rankings
                        </button>
                        <button
                          type="button"
                          className={`${styles.weekSubviewBtn} ${
                            weekSubview === "album" ? styles.weekSubviewBtnActive : ""
                          }`}
                          onClick={() => setWeekSubview("album")}
                        >
                          Album
                        </button>
                      </div>
                    )}
                    <div className={styles.controlsRow}>
                      {(leaderboardType === "today" || leaderboardType === "alltime") && (
                        <>
                          <select
                            id="cut-type-select"
                            className={styles.inlineFilterSelect}
                            value={cutTypeFilter}
                            onChange={(e) =>
                              setCutTypeFilter(e.target.value as PieceCutType)
                            }
                            aria-label="Filter by shape"
                          >
                            <option value="all">All Shapes</option>
                            <option value="classic">Classic Shape</option>
                            <option value="irregular">Irregular Shape</option>
                            <option value="hard">Hard Shape</option>
                          </select>
                          <select
                            id="modifier-select"
                            className={styles.inlineFilterSelect}
                            value={modifierFilter}
                            onChange={(e) =>
                              setModifierFilter(e.target.value as VisualModifierFilter)
                            }
                            aria-label="Filter by modifier"
                          >
                            <option value="all">All Modifiers</option>
                            <option value="none">No Modifier</option>
                            <option value="fog">Fog Modifier</option>
                            <option value="night">Night Modifier</option>
                            <option value="sepia">Sepia Modifier</option>
                          </select>
                        </>
                      )}
                      {leaderboardType === "alltime" && (
                        <select
                          id="alltime-grid-select"
                          className={styles.inlineFilterSelect}
                          value={allTimeGrid}
                          onChange={(e) =>
                            setAllTimeGrid(
                              e.target.value as "3x3" | "4x4" | "5x5" | "6x6",
                            )
                          }
                          aria-label="Filter all-time by grid size"
                        >
                          <option value="3x3">3x3 Grid</option>
                          <option value="4x4">4x4 Grid</option>
                          <option value="5x5">5x5 Grid</option>
                          <option value="6x6">6x6 Grid</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <h2>
                    {leaderboardType === "today" && "Today's Daily"}
                    {leaderboardType === "week" &&
                      (weekSubview === "rankings"
                        ? `Weekly Rankings (${weekRangeLabel})`
                        : `Weekly Album (${weekRangeLabel})`)}
                    {leaderboardType === "alltime" && `All-time best (${allTimeGrid})`}
                  </h2>
                  {leaderboardType === "today" && (
                    <p className={styles.todayCompletionCount} aria-live="polite">
                      {todayCompletionCount} completion
                      {todayCompletionCount !== 1 ? "s" : ""} so far
                    </p>
                  )}
                  {leaderboardType === "week" && weekSubview === "rankings" && (
                    <div className={styles.weekProgressStrip}>
                      <span>Weekly Album Progress</span>
                      <strong>{weeklyCompleted}</strong> <strong>/</strong> <strong>7</strong> days
                    </div>
                  )}
                  {leaderboardType === "today" &&
                    renderTimeLeaderboard(
                      leaderboard,
                      "No completions yet. Be the first!",
                    )}
                  {leaderboardType === "week" &&
                    weekSubview === "rankings" &&
                    renderCompletionLeaderboard(
                      weeklyTotalsLeaderboard,
                      "No completions in the last 7 days.",
                    )}
                  {leaderboardType === "week" && weekSubview === "album" && (
                    <div className={styles.weekAlbumWrap}>
                      <p className={styles.todayCompletionCount}>
                        Weekly collection: {weeklyAlbumProgress}/7 completed
                      </p>
                      <div className={styles.weekAlbumGrid}>
                        {weeklyAlbumSlots.map((slot) => (
                          <div
                            key={slot.date}
                            className={`${styles.weekAlbumSlot} ${
                              slot.completed ? styles.weekAlbumSlotDone : ""
                            } ${slot.isToday ? styles.weekAlbumSlotToday : ""}`}
                          >
                            <div className={styles.weekAlbumTop}>
                              <span>{slot.dayLabel}</span>
                              {slot.completed && slot.mastery && (
                                <span title="Mastery">⚡</span>
                              )}
                            </div>
                            {slot.completed && slot.imageUrl ? (
                              <img
                                src={slot.imageUrl}
                                alt={`Daily puzzle for ${slot.dayLabel}`}
                                className={styles.weekAlbumImage}
                              />
                            ) : (
                              <div className={styles.weekAlbumHidden}>
                                {slot.isFuture ? "Locked" : "?"}
                              </div>
                            )}
                            <div className={styles.weekAlbumFooter}>
                              {slot.completed
                                ? "Collected"
                                : slot.isFuture
                                  ? "Upcoming"
                                  : "Missing"}
                            </div>
                          </div>
                        ))}
                      </div>
                      {weeklyAlbumProgress === 7 && (
                        <div className={styles.weekBonusBadge}>
                          🏅 Full week complete! Bonus badge unlocked.
                        </div>
                      )}
                    </div>
                  )}
                  {leaderboardType === "alltime" &&
                    renderTimeLeaderboard(
                      leaderboard,
                      "No completions for this grid size yet.",
                    )}
                </div>
              )}

              {activeTab === "achievements" && (
                <div className={styles.section}>
                  <h2>Achievements</h2>
                  <div className={styles.achievements}>
                    {achievements.map((a) => (
                      <div
                        key={a.id}
                        className={`${styles.achievement} ${
                          a.unlocked ? styles.achievementUnlocked : ""
                        }`}
                      >
                        <span className={styles.achievementIcon}>{a.icon}</span>
                        <div className={styles.achievementInfo}>
                          <span className={styles.achievementName}>{a.name}</span>
                          <span className={styles.achievementDesc}>{a.description}</span>
                        </div>
                        {a.unlocked && <span className={styles.achievementBadge}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
