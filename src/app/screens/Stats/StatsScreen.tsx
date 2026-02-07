import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Trophy, Award } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { Dropdown } from "@/components/DropDown/Dropdown";
import styles from "./StatsScreen.module.css";
import { isSupabaseConfigured, getSupabaseConfigStatus } from "@/supabase/client";
import { getMyStats } from "@/services/statsService";
import { getDailyLeaderboard, getGridLeaderboard } from "@/services/leaderboardService";
import { getMyAchievements } from "@/services/achievementsService";
import { getTodayDateString } from "@/daily/dailyPuzzle";

type LeaderboardView = "daily" | "3x3" | "4x4" | "5x5" | "6x6";

const LEADERBOARD_OPTIONS: { value: LeaderboardView; label: string }[] = [
  { value: "daily", label: "Today's Daily Puzzle" },
  { value: "3x3", label: "3×3 grid" },
  { value: "4x4", label: "4×4 grid" },
  { value: "5x5", label: "5×5 grid" },
  { value: "6x6", label: "6×6 grid" },
];

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

export function StatsScreen() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "leaderboard" | "achievements"
  >("dashboard");
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

  if (!configured) {
    const status = getSupabaseConfigStatus();
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Stats & Leaderboards</h1>
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
          <Button size="sm" onClick={() => nav("/")}>
            <ArrowLeft size={18} />
            Back
          </Button>
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
                  return entries.length === 0 ? (
                    <p className={styles.empty}>
                      No completions yet.
                      {leaderboardView === "daily"
                        ? " Be the first!"
                        : " Complete a puzzle to appear here."}
                    </p>
                  ) : (
                    <ol className={styles.leaderboard}>
                      {entries.map((entry) => (
                        <li key={entry.rank} className={styles.leaderboardItem}>
                          <span className={styles.rank}>#{entry.rank}</span>
                          <span className={styles.player}>{entry.displayName}</span>
                          <span className={styles.time}>
                            {formatTime(entry.elapsedSeconds)}
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
