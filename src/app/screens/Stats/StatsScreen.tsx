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
  getStreakLeaderboard,
  getCompletionCountLeaderboard,
  getWeeklyTotalsLeaderboard,
  getMonthlyTotalsLeaderboard,
  getPeriodLeaderboard,
  getAllTimeBestLeaderboard,
  getMyPersonalBests,
  getTimeAttackLeaderboard,
  type LeaderboardEntry,
  type StreakEntry,
  type CompletionCountEntry,
  type PersonalBestEntry,
} from "@/services/leaderboardService";
import { getMyProfile, updateMyProfile } from "@/services/profileService";
import { getUserId } from "@/supabase/auth";
import { getAnonymousDisplayName } from "@/data/anonymousNames";
import { getMyAchievements } from "@/services/achievementsService";
import { getTodayDateString, getStreakFreezeCount } from "@/daily/dailyPuzzleCore";
import { AVATAR_HATS, AVATAR_GLASSES, AVATAR_HOODIES } from "@/data/avatarOptions";

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
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PODIUM = ["🥇", "🥈", "🥉"];

type LeaderboardType =
  | "today"
  | "timeAttack"
  | "bestWeek"
  | "bestMonth"
  | "week"
  | "month"
  | "streaks"
  | "completions"
  | "alltime";

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
  const [allTimeGrid, setAllTimeGrid] = useState<"3x3" | "4x4" | "5x5" | "6x6">("4x4");
  const [stats, setStats] = useState<{
    puzzlesCompleted: number;
    totalPlayTimeSeconds: number;
    dailyStreak: number;
    bestDailyStreak: number;
    lastPlayedAt: string | null;
  } | null>(null);
  const [profile, setProfile] = useState<{
    displayName: string;
    showOnLeaderboard: boolean;
    avatarHat?: string | null;
    avatarGlasses?: string | null;
    avatarHoodie?: string | null;
  } | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<StreakEntry[]>([]);
  const [completionLeaderboard, setCompletionLeaderboard] = useState<
    CompletionCountEntry[]
  >([]);
  const [weeklyTotalsLeaderboard, setWeeklyTotalsLeaderboard] = useState<
    CompletionCountEntry[]
  >([]);
  const [monthlyTotalsLeaderboard, setMonthlyTotalsLeaderboard] = useState<
    CompletionCountEntry[]
  >([]);
  const [personalBests, setPersonalBests] = useState<PersonalBestEntry[]>([]);
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
  const [raccoonName, setRaccoonName] = useState<string | null>(null);
  const [leaderboardCompact, setLeaderboardCompact] = useState(true);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 520px)");
    setLeaderboardCompact(mq.matches);
    const handler = (e: MediaQueryListEvent) => setLeaderboardCompact(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
    const [lb, slb, clb, wklb, molb, pb] = await Promise.all([
      getDailyLeaderboard(today),
      getStreakLeaderboard(),
      getCompletionCountLeaderboard(),
      getWeeklyTotalsLeaderboard(),
      getMonthlyTotalsLeaderboard(),
      getMyPersonalBests(),
    ]);
    setLeaderboard(lb);
    setStreakLeaderboard(slb);
    setCompletionLeaderboard(clb);
    setWeeklyTotalsLeaderboard(wklb);
    setMonthlyTotalsLeaderboard(molb);
    setPersonalBests(pb);
    setLoading(false);
  }, [configured]);

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
    const loadLb = async () => {
      if (leaderboardType === "today") {
        const lb = await getDailyLeaderboard(getTodayDateString());
        setLeaderboard(lb);
      } else if (leaderboardType === "timeAttack") {
        const lb = await getTimeAttackLeaderboard();
        setLeaderboard(lb);
      } else if (leaderboardType === "bestWeek") {
        const lb = await getPeriodLeaderboard("week");
        setLeaderboard(lb);
      } else if (leaderboardType === "bestMonth") {
        const lb = await getPeriodLeaderboard("month");
        setLeaderboard(lb);
      } else if (leaderboardType === "week") {
        const wklb = await getWeeklyTotalsLeaderboard();
        setWeeklyTotalsLeaderboard(wklb);
      } else if (leaderboardType === "month") {
        const molb = await getMonthlyTotalsLeaderboard();
        setMonthlyTotalsLeaderboard(molb);
      } else if (leaderboardType === "streaks") {
        const slb = await getStreakLeaderboard();
        setStreakLeaderboard(slb);
      } else if (leaderboardType === "completions") {
        const clb = await getCompletionCountLeaderboard();
        setCompletionLeaderboard(clb);
      } else if (leaderboardType === "alltime") {
        const [r, c] = allTimeGrid.split("x").map(Number);
        const lb = await getAllTimeBestLeaderboard(r, c);
        setLeaderboard(lb);
      }
    };
    loadLb();
  }, [configured, activeTab, leaderboardType, allTimeGrid]);

  const handleSaveProfile = async () => {
    if (!configured) return;
    setProfileSaving(true);
    const updated = await updateMyProfile({
      displayName: displayNameInput.trim() || "Puzzler",
      showOnLeaderboard: profile?.showOnLeaderboard ?? true,
      avatarHat: profile?.avatarHat ?? null,
      avatarGlasses: profile?.avatarGlasses ?? null,
      avatarHoodie: profile?.avatarHoodie ?? null,
    });
    if (updated) setProfile(updated);
    setProfileSaving(false);
    loadData();
  };

  const handleShareLeaderboard = () => {
    const text =
      leaderboardType === "today"
        ? `Today's Daily Puzzle leaderboard - Phuzzle`
        : leaderboardType === "timeAttack"
          ? "Time Attack leaderboard - Phuzzle"
          : leaderboardType === "streaks"
            ? "Streak leaderboard - Phuzzle"
            : leaderboardType === "completions"
              ? "Puzzle completions leaderboard - Phuzzle"
              : "Leaderboard - Phuzzle";
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

  if (!configured) {
    const status = getSupabaseConfigStatus();
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Leaderboard</h1>
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
            Local: add to .env.development and restart dev server. Vercel: add in project
            Settings → Environment Variables, then redeploy.
          </p>
          <Button onClick={() => nav("/")}>
            <ArrowLeft size={18} />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const renderTimeLeaderboard = (entries: LeaderboardEntry[], emptyMsg: string) => (
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
            const key = `time-${entry.rank}-${entry.displayName}`;
            const isExpanded = expandedRowKey === key;
            return (
              <li
                key={key}
                className={`${styles.leaderboardItem} ${
                  entry.rank <= 3 ? styles.leaderboardPodium : ""
                } ${isExpanded ? styles.leaderboardItemExpanded : ""}`}
                onClick={() => setExpandedRowKey(isExpanded ? null : key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedRowKey(isExpanded ? null : key);
                  }
                }}
              >
                <span className={styles.rank}>
                  {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span className={styles.player}>{entry.displayName}</span>
                <span className={styles.time}>{formatTime(entry.elapsedSeconds)}</span>
                {isExpanded && (
                  <div className={styles.leaderboardDetail}>
                    {Math.floor(entry.elapsedSeconds / 60)}m {entry.elapsedSeconds % 60}s
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );

  const renderStreakLeaderboard = (entries: StreakEntry[]) => (
    <>
      {entries.length === 0 ? (
        <p className={styles.empty}>No streaks yet. Complete daily puzzles!</p>
      ) : (
        <ol
          className={`${styles.leaderboard} ${
            leaderboardCompact ? styles.leaderboardCompact : ""
          }`}
        >
          {entries.map((entry) => {
            const key = `streak-${entry.rank}-${entry.displayName}`;
            const isExpanded = expandedRowKey === key;
            return (
              <li
                key={key}
                className={`${styles.leaderboardItem} ${
                  entry.rank <= 3 ? styles.leaderboardPodium : ""
                } ${isExpanded ? styles.leaderboardItemExpanded : ""}`}
                onClick={() => setExpandedRowKey(isExpanded ? null : key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedRowKey(isExpanded ? null : key);
                  }
                }}
              >
                <span className={styles.rank}>
                  {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span className={styles.player}>{entry.displayName}</span>
                <span className={styles.time}>{entry.streak} days</span>
                {isExpanded && (
                  <div className={styles.leaderboardDetail}>
                    {entry.streak} day streak
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );

  const renderCompletionLeaderboard = (
    entries: CompletionCountEntry[],
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
            const key = `completion-${entry.rank}-${entry.displayName}`;
            const isExpanded = expandedRowKey === key;
            return (
              <li
                key={key}
                className={`${styles.leaderboardItem} ${
                  entry.rank <= 3 ? styles.leaderboardPodium : ""
                } ${isExpanded ? styles.leaderboardItemExpanded : ""}`}
                onClick={() => setExpandedRowKey(isExpanded ? null : key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedRowKey(isExpanded ? null : key);
                  }
                }}
              >
                <span className={styles.rank}>
                  {entry.rank <= 3 ? PODIUM[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span className={styles.player}>{entry.displayName}</span>
                <span className={styles.time}>{entry.count} puzzles</span>
                {isExpanded && (
                  <div className={styles.leaderboardDetail}>
                    {entry.count} total puzzles completed
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Button size="sm" onClick={() => nav("/")}>
            <ArrowLeft size={18} />
            Back
          </Button>
          <h1 className={styles.title}>Leaderboard</h1>
        </div>

        <div className={styles.tabs}>
          <button
            className={activeTab === "dashboard" ? styles.tabActive : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <BarChart3 size={18} />
            Dashboard
          </button>
          <button
            className={activeTab === "profile" ? styles.tabActive : ""}
            onClick={() => setActiveTab("profile")}
          >
            <User size={18} />
            Profile
          </button>
          <button
            className={activeTab === "leaderboard" ? styles.tabActive : ""}
            onClick={() => setActiveTab("leaderboard")}
          >
            <Trophy size={18} />
            Leaderboard
          </button>
          <button
            className={activeTab === "achievements" ? styles.tabActive : ""}
            onClick={() => setActiveTab("achievements")}
          >
            <Award size={18} />
            Achievements
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <div className={styles.section}>
                <h2>Your Statistics</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {stats?.puzzlesCompleted ?? 0}
                    </span>
                    <span className={styles.statLabel}>Puzzles completed</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {formatDuration(stats?.totalPlayTimeSeconds ?? 0)}
                    </span>
                    <span className={styles.statLabel}>Total play time</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats?.dailyStreak ?? 0}</span>
                    <span className={styles.statLabel}>Current streak</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {stats?.bestDailyStreak ?? 0}
                    </span>
                    <span className={styles.statLabel}>Best streak</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{getStreakFreezeCount()}</span>
                    <span className={styles.statLabel}>Streak freeze</span>
                  </div>
                </div>
                {personalBests.length > 0 && (
                  <>
                    <h2>Personal Bests</h2>
                    <ol className={styles.personalBests}>
                      {personalBests.slice(0, 10).map((pb, i) => (
                        <li key={i} className={styles.personalBestItem}>
                          <span className={styles.pbGrid}>{pb.gridSize}</span>
                          <span className={styles.pbTime}>
                            {formatTime(pb.elapsedSeconds)}
                          </span>
                          {pb.isDaily && <span className={styles.pbDaily}>Daily</span>}
                        </li>
                      ))}
                    </ol>
                  </>
                )}
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
                <h3 className={styles.avatarSection}>🦝 Raccoon Avatar</h3>
                <div className={styles.avatarRow}>
                  {(() => {
                    const unlockedIds = new Set(
                      (achievements ?? []).filter((a) => a.unlocked).map((a) => a.id),
                    );
                    const isLocked = (o: { unlockAchievement?: string }) =>
                      !!o.unlockAchievement && !unlockedIds.has(o.unlockAchievement);
                    return (
                      <>
                        <label>
                          <span className={styles.avatarLabel}>Hat</span>
                          <select
                            value={profile?.avatarHat ?? "none"}
                            onChange={(e) =>
                              setProfile((p) => ({
                                ...p!,
                                avatarHat: e.target.value || null,
                              }))
                            }
                          >
                            {AVATAR_HATS.map((o) => (
                              <option key={o.id} value={o.id} disabled={isLocked(o)}>
                                {o.label} {isLocked(o) ? "🔒" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className={styles.avatarLabel}>Glasses</span>
                          <select
                            value={profile?.avatarGlasses ?? "none"}
                            onChange={(e) =>
                              setProfile((p) => ({
                                ...p!,
                                avatarGlasses: e.target.value || null,
                              }))
                            }
                          >
                            {AVATAR_GLASSES.map((o) => (
                              <option key={o.id} value={o.id} disabled={isLocked(o)}>
                                {o.label} {isLocked(o) ? "🔒" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className={styles.avatarLabel}>Hoodie</span>
                          <select
                            value={profile?.avatarHoodie ?? "default"}
                            onChange={(e) =>
                              setProfile((p) => ({
                                ...p!,
                                avatarHoodie: e.target.value || null,
                              }))
                            }
                          >
                            {AVATAR_HOODIES.map((o) => (
                              <option key={o.id} value={o.id} disabled={isLocked(o)}>
                                {o.label} {isLocked(o) ? "🔒" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    );
                  })()}
                </div>
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
                  Uncheck "Show my name" to appear as your raccoon name on leaderboards.
                  You’re still tracked—turn this back on anytime to show your display
                  name.
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
                <div className={styles.leaderboardHeader}>
                  <div className={styles.leaderboardTabs}>
                    {(
                      [
                        ["today", "Today"],
                        ["timeAttack", "Time Attack"],
                        ["bestWeek", "Best time (week)"],
                        ["bestMonth", "Best time (month)"],
                        ["week", "Weekly totals"],
                        ["month", "Monthly totals"],
                        ["streaks", "Streaks"],
                        ["completions", "All-time completions"],
                        ["alltime", "All-time best"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        className={leaderboardType === key ? styles.lbTabActive : ""}
                        onClick={() => setLeaderboardType(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {leaderboardType === "alltime" && (
                    <div className={styles.allTimeGrid}>
                      <label>Grid:</label>
                      <select
                        value={allTimeGrid}
                        onChange={(e) =>
                          setAllTimeGrid(e.target.value as "3x3" | "4x4" | "5x5" | "6x6")
                        }
                      >
                        <option value="3x3">3×3</option>
                        <option value="4x4">4×4</option>
                        <option value="5x5">5×5</option>
                        <option value="6x6">6×6</option>
                      </select>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.lbViewToggle}
                    onClick={() => setLeaderboardCompact((c) => !c)}
                    title={leaderboardCompact ? "Expand view" : "Compact view"}
                    aria-label={leaderboardCompact ? "Expand view" : "Compact view"}
                  >
                    {leaderboardCompact ? "Expand" : "Compact"}
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleShareLeaderboard}
                    className={styles.shareBtn}
                  >
                    <Share2 size={16} />
                    {shareCopied ? "Copied!" : "Share"}
                  </Button>
                </div>
                <h2>
                  {leaderboardType === "today" && "Today's daily puzzle"}
                  {leaderboardType === "timeAttack" && "Time Attack"}
                  {leaderboardType === "bestWeek" && "Best time this week (daily)"}
                  {leaderboardType === "bestMonth" && "Best time this month (daily)"}
                  {leaderboardType === "week" && "Weekly totals"}
                  {leaderboardType === "month" && "Monthly totals"}
                  {leaderboardType === "streaks" && "Longest streaks"}
                  {leaderboardType === "completions" && "All-time completions"}
                  {leaderboardType === "alltime" && `All-time best (${allTimeGrid})`}
                </h2>
                {leaderboardType === "today" &&
                  renderTimeLeaderboard(leaderboard, "No completions yet. Be the first!")}
                {leaderboardType === "timeAttack" &&
                  renderTimeLeaderboard(
                    leaderboard,
                    "No Time Attack completions yet. Try it!",
                  )}
                {leaderboardType === "bestWeek" &&
                  renderTimeLeaderboard(
                    leaderboard,
                    "No daily completions this week yet.",
                  )}
                {leaderboardType === "bestMonth" &&
                  renderTimeLeaderboard(
                    leaderboard,
                    "No daily completions this month yet.",
                  )}
                {leaderboardType === "week" &&
                  renderCompletionLeaderboard(
                    weeklyTotalsLeaderboard,
                    "No completions in the last 7 days.",
                  )}
                {leaderboardType === "month" &&
                  renderCompletionLeaderboard(
                    monthlyTotalsLeaderboard,
                    "No completions in the last 30 days.",
                  )}
                {leaderboardType === "streaks" &&
                  renderStreakLeaderboard(streakLeaderboard)}
                {leaderboardType === "completions" &&
                  renderCompletionLeaderboard(
                    completionLeaderboard,
                    "No completions yet. Play puzzles!",
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
  );
}
