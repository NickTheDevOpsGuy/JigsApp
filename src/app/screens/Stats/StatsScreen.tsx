/**
 * StatsScreen – leaderboards, achievements, profile, streaks (Supabase).
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Trophy, Award, User } from "lucide-react";
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
  getTimeDecayLeaderboard,
  type LeaderboardEntry,
  type StreakEntry,
  type CompletionCountEntry,
  type PersonalBestEntry,
} from "@/services/leaderboardService";
import { getMyProfile, updateMyProfile } from "@/services/profileService";
import { getCompletionGrade } from "@/data/completionGrades";
import { getUserId } from "@/supabase/auth";
import { getAnonymousDisplayName } from "@/data/anonymousNames";
import { getMyAchievements } from "@/services/achievementsService";
import { getTodayDateString, getStreakFreezeCount } from "@/daily/dailyPuzzleCore";
import { useTodayCompletionCount } from "@/hooks/useTodayCompletionCount";
import { formatTime, formatDuration } from "@/screens/Play/playUtils";
import {
  TimeLeaderboardList,
  StreakLeaderboardList,
  CompletionLeaderboardList,
} from "./LeaderboardList";
import { LeaderboardFilterPills } from "./LeaderboardFilterPills";
import { AVATAR_HATS, AVATAR_GLASSES, AVATAR_HOODIES } from "@/data/avatarOptions";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import {
  loadLastSessionMetrics,
  downloadSessionStatsJson,
  getMetricsFromSaved,
} from "@/screens/Play/placementMetrics";
export type LeaderboardType =
  | "today"
  | "timeAttack"
  | "timeDecay"
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
  const [allTimeGrid] = useState<"3x3" | "4x4" | "5x5" | "6x6">("4x4");
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
  const todayCompletionCount = useTodayCompletionCount();
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [showDailyModal, setShowDailyModal] = useState(false);

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
    void loadData();
  }, [configured, loadData]);

  useEffect(() => {
    if (!configured) return;
    void (async () => {
      const uid = await getUserId();
      if (uid) setRaccoonName(getAnonymousDisplayName(uid));
    })();
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
      } else if (leaderboardType === "timeDecay") {
        const lb = await getTimeDecayLeaderboard();
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
    void loadLb();
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
    void loadData();
  };

  const handleShareLeaderboard = async () => {
    const text =
      leaderboardType === "today"
        ? `Today's Daily Puzzle leaderboard - Phuzzle`
        : leaderboardType === "timeAttack"
          ? "Time Attack leaderboard - Phuzzle"
          : leaderboardType === "timeDecay"
            ? "Time Decay leaderboard - Phuzzle"
            : leaderboardType === "streaks"
              ? "Streak leaderboard - Phuzzle"
              : leaderboardType === "completions"
                ? "Puzzle completions leaderboard - Phuzzle"
                : "Leaderboard - Phuzzle";
    const url = window.location.origin;
    const shareText = `${text}\n${url}`;
    if (navigator.share) {
      await navigator.share({
        title: "Phuzzle Leaderboard",
        text: shareText,
        url,
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.backBtn}>
            <Button size="sm" variant="secondary" onClick={() => nav("/")}>
              <ArrowLeft size={18} />
              Back
            </Button>
          </div>
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
          <div className={styles.tabContent}>
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
                    <span className={styles.statLabel}>Streak shield</span>
                  </div>
                </div>
                {personalBests.length > 0 && (
                  <>
                    <h2>Personal Bests</h2>
                    <ol className={styles.personalBests}>
                      {personalBests.slice(0, 10).map((pb, i) => {
                        const [rows, cols] = pb.gridSize.split("×").map(Number);
                        const grade =
                          rows && cols
                            ? getCompletionGrade({
                                elapsedSeconds: pb.elapsedSeconds,
                                grid: { rows, cols },
                                timeMode: "elapsed",
                              })
                            : null;
                        return (
                          <li key={i} className={styles.personalBestItem}>
                            <span className={styles.pbGrid}>{pb.gridSize}</span>
                            {grade != null && (
                              <span
                                className={`${styles.gradeBadge} ${styles[`grade${grade}`]}`}
                                aria-label={`Grade ${grade}`}
                              >
                                {grade}
                              </span>
                            )}
                            <span className={styles.pbTime}>
                              {formatTime(pb.elapsedSeconds)}
                            </span>
                            {pb.isDaily && <span className={styles.pbDaily}>Daily</span>}
                          </li>
                        );
                      })}
                    </ol>
                  </>
                )}
                {personalBests.length === 0 && !loadLastSessionMetrics() && (
                  <div className={styles.dashboardTip}>
                    <p>
                      Complete puzzles to see personal bests and speed metrics here. Try
                      the{" "}
                      <button
                        type="button"
                        className={styles.dashboardTipLink}
                        onClick={() => setActiveTab("leaderboard")}
                      >
                        Leaderboard
                      </button>{" "}
                      tab to compete with others.
                    </p>
                  </div>
                )}
                {(() => {
                  const data = loadLastSessionMetrics();
                  const pm = getMetricsFromSaved(data);
                  if (!pm || !data) return null;
                  return (
                    <>
                      <h2>Placement Speed (Last Session)</h2>
                      <p className={styles.hint}>
                        Insights from your most recent puzzle
                        {data.grid ? ` (${data.grid})` : ""}.
                      </p>
                      <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                          <span className={styles.statValue}>
                            {pm.avgTimeBetweenSnapsMs >= 1000
                              ? `${(pm.avgTimeBetweenSnapsMs / 1000).toFixed(1)}s`
                              : `${Math.round(pm.avgTimeBetweenSnapsMs)}ms`}
                          </span>
                          <span className={styles.statLabel}>Avg time between snaps</span>
                        </div>
                        <div className={styles.statCard}>
                          <span className={styles.statValue}>
                            {pm.avgSnapVelocityPerMin.toFixed(1)}
                          </span>
                          <span className={styles.statLabel}>Snaps per min</span>
                        </div>
                        <div className={styles.statCard}>
                          <span className={styles.statValue}>
                            {pm.idlePercent.toFixed(0)}%
                          </span>
                          <span className={styles.statLabel}>Idle time</span>
                        </div>
                        <div className={styles.statCard}>
                          <span className={styles.statValue}>
                            {pm.avgTimeToSnapMs >= 1000
                              ? `${(pm.avgTimeToSnapMs / 1000).toFixed(1)}s`
                              : `${Math.round(pm.avgTimeToSnapMs)}ms`}
                          </span>
                          <span className={styles.statLabel}>Avg drag-to-snap time</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
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

                <div className={styles.profileRow} style={{ marginTop: "1rem" }}>
                  <h3 className={styles.avatarSection}>📊 Session Stats Export</h3>
                  <p className={styles.hint}>
                    Download last completed puzzle&apos;s placement timestamps, snap
                    counts, and idle durations as JSON (for advanced users).
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadSessionStatsJson()}
                    disabled={!loadLastSessionMetrics()}
                    title={
                      loadLastSessionMetrics()
                        ? "Download last session stats as JSON"
                        : "Complete a puzzle to have session data to export"
                    }
                  >
                    Export session stats (JSON)
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "leaderboard" && (
              <div className={styles.section}>
                <LeaderboardFilterPills
                  leaderboardType={leaderboardType}
                  onLeaderboardTypeChange={setLeaderboardType}
                  leaderboardCompact={leaderboardCompact}
                  onCompactToggle={() => setLeaderboardCompact((c) => !c)}
                  shareCopied={shareCopied}
                  onShare={handleShareLeaderboard}
                />

                {leaderboardType === "today" && (
                  <div className={styles.dailyPuzzleCard}>
                    <div className={styles.dailyPuzzleMascot} aria-hidden>
                      🦝
                    </div>
                    <div className={styles.dailyPuzzleContent}>
                      <h2 className={styles.dailyPuzzleTitle}>
                        Today&apos;s Daily Puzzle
                      </h2>
                      <p className={styles.dailyPuzzleDesc}>
                        {todayCompletionCount === 0
                          ? "No completions yet. Be the first!"
                          : `${todayCompletionCount} completion${todayCompletionCount === 1 ? "" : "s"} today`}
                      </p>
                      <button
                        type="button"
                        className={styles.dailyPuzzleBtn}
                        onClick={() => setShowDailyModal(true)}
                      >
                        Start Puzzle
                      </button>
                    </div>
                  </div>
                )}

                {leaderboardType === "today" && (
                  <TimeLeaderboardList
                    entries={leaderboard}
                    emptyMsg="No completions yet."
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "timeAttack" && (
                  <TimeLeaderboardList
                    entries={leaderboard}
                    emptyMsg="No Time Attack completions yet. Try it!"
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "timeDecay" && (
                  <TimeLeaderboardList
                    entries={leaderboard}
                    emptyMsg="No Time Decay completions yet. Try it!"
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "bestWeek" && (
                  <TimeLeaderboardList
                    entries={leaderboard}
                    emptyMsg="No daily completions this week yet."
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "bestMonth" && (
                  <TimeLeaderboardList
                    entries={leaderboard}
                    emptyMsg="No daily completions this month yet."
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "week" && (
                  <CompletionLeaderboardList
                    entries={weeklyTotalsLeaderboard}
                    emptyMsg="No completions in the last 7 days."
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "month" && (
                  <CompletionLeaderboardList
                    entries={monthlyTotalsLeaderboard}
                    emptyMsg="No completions in the last 30 days."
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "streaks" && (
                  <StreakLeaderboardList
                    entries={streakLeaderboard}
                    emptyMsg="No streaks yet. Complete daily puzzles!"
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "completions" && (
                  <CompletionLeaderboardList
                    entries={completionLeaderboard}
                    emptyMsg="No completions yet. Play puzzles!"
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
                {leaderboardType === "alltime" && (
                  <TimeLeaderboardList
                    entries={leaderboard}
                    emptyMsg="No completions for this grid size yet."
                    compact={leaderboardCompact}
                    expandedRowKey={expandedRowKey}
                    onToggleExpand={setExpandedRowKey}
                  />
                )}
              </div>
            )}

            <DailyDifficultyModal
              isOpen={showDailyModal}
              onClose={() => setShowDailyModal(false)}
            />

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
          </div>
        )}
      </div>
    </div>
  );
}
