import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, BarChart3, Trophy, Award } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { Dropdown } from "@/components/DropDown/Dropdown";
import styles from "./StatsScreen.module.css";
import { isSupabaseConfigured, getSupabaseConfigStatus } from "@/supabase/client";
import { getMyStats } from "@/services/statsService";
import { getDailyLeaderboard, getGridLeaderboard } from "@/services/leaderboardService";
import { getMyAchievements } from "@/services/achievementsService";
import { getTodayDateString } from "@/daily/dailyPuzzle";
import { getLocalPuzzleCount } from "@/puzzle/puzzleStorage";
import { formatTime, formatDuration } from "@/utils/timeUtils";

type LeaderboardView = "daily" | "3x3" | "4x4" | "5x5" | "6x6";

const LEADERBOARD_OPTIONS: { value: LeaderboardView; label: string }[] = [
  { value: "daily", label: "Today's Daily Puzzle" },
  { value: "3x3", label: "3×3 grid" },
  { value: "4x4", label: "4×4 grid" },
  { value: "5x5", label: "5×5 grid" },
  { value: "6x6", label: "6×6 grid" },
];

export function StatsScreen() {
  const nav = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "leaderboard" | "achievements"
  >(() => {
    const tab = (location.state as { tab?: string })?.tab;
    return tab === "leaderboard" || tab === "achievements" ? tab : "dashboard";
  });
  const [leaderboardView, setLeaderboardView] = useState<LeaderboardView>("daily");
  const [stats, setStats] = useState<{
    puzzlesCompleted: number;
    totalPlayTimeSeconds: number;
    dailyStreak: number;
    bestDailyStreak: number;
    lastPlayedAt: string | null;
  } | null>(null);
  const [gridLeaderboards, setGridLeaderboards] = useState<
    Record<
      LeaderboardView,
      { rank: number; elapsedSeconds: number; displayName: string }[]
    >
  >({
    daily: [],
    "3x3": [],
    "4x4": [],
    "5x5": [],
    "6x6": [],
  });
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

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const [s, a] = await Promise.all([getMyStats(), getMyAchievements()]);
      setStats(s ?? null);
      setAchievements(a);
      const [lb, lb3, lb4, lb5, lb6] = await Promise.all([
        getDailyLeaderboard(getTodayDateString()),
        getGridLeaderboard(3, 3, 10),
        getGridLeaderboard(4, 4, 10),
        getGridLeaderboard(5, 5, 10),
        getGridLeaderboard(6, 6, 10),
      ]);
      setGridLeaderboards({
        daily: lb,
        "3x3": lb3,
        "4x4": lb4,
        "5x5": lb5,
        "6x6": lb6,
      });
      setLoading(false);
    };
    load();
  }, [configured]);

  const backBtn = (
    <Button size="sm" onClick={() => nav("/")}>
      <ArrowLeft size={18} />
      Back
    </Button>
  );

  if (!configured) {
    const status = getSupabaseConfigStatus();
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            {backBtn}
            <h1 className={styles.title}>Stats</h1>
          </div>
          <div className={styles.section}>
            <h2>Local Progress</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{getLocalPuzzleCount()}</span>
                <span className={styles.statLabel}>Puzzles completed (local)</span>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <h2>Connect for More</h2>
            <p className={styles.placeholder}>
              Add Supabase to track stats, leaderboards, and achievements.
            </p>
            <p className={styles.debug}>
              VITE_SUPABASE_URL: {status.url ? "✓" : "✗"} · VITE_SUPABASE_ANON_KEY:{" "}
              {status.key ? "✓" : "✗"}
            </p>
            <Button onClick={() => nav("/")}>Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const DASHBOARD_STATS = [
    { value: stats?.puzzlesCompleted ?? 0, label: "Puzzles completed" },
    { value: formatDuration(stats?.totalPlayTimeSeconds ?? 0), label: "Total play time" },
    { value: stats?.dailyStreak ?? 0, label: "Current streak" },
    { value: stats?.bestDailyStreak ?? 0, label: "Best streak" },
  ] as const;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          {backBtn}
          <h1 className={styles.title}>Stats</h1>
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
                  {DASHBOARD_STATS.map((s) => (
                    <div key={s.label} className={styles.statCard}>
                      <span className={styles.statValue}>{s.value}</span>
                      <span className={styles.statLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "leaderboard" && (
              <div className={styles.section}>
                <h2>Leaderboard</h2>
                <Dropdown
                  label="View"
                  value={leaderboardView}
                  onChange={(val) => setLeaderboardView(val as LeaderboardView)}
                  options={LEADERBOARD_OPTIONS}
                  fullWidth
                />
                {(() => {
                  const entries = gridLeaderboards[leaderboardView] ?? [];
                  if (entries.length === 0)
                    return (
                      <p className={styles.empty}>
                        No completions yet.
                        {leaderboardView === "daily"
                          ? " Be the first!"
                          : " Complete a puzzle to appear here."}
                      </p>
                    );
                  return (
                    <ol className={styles.leaderboard}>
                      {entries.map((e) => (
                        <li key={e.rank} className={styles.leaderboardItem}>
                          <span className={styles.rank}>#{e.rank}</span>
                          <span className={styles.player}>{e.displayName}</span>
                          <span className={styles.time}>
                            {formatTime(e.elapsedSeconds)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  );
                })()}
              </div>
            )}

            {activeTab === "achievements" && (
              <div className={styles.section}>
                <h2>Achievements</h2>
                <div className={styles.achievements}>
                  {achievements.map((a) => (
                    <div
                      key={a.id}
                      className={`${styles.achievement} ${a.unlocked ? styles.achievementUnlocked : ""}`}
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
