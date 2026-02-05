import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Trophy,
  Award,
  RefreshCw,
  Crown,
  User,
} from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "./StatsScreen.module.css";
import { isSupabaseConfigured, getSupabaseConfigStatus } from "@/supabase/client";
import {
  getMyStats,
  getMyCompletionHistory,
  type CompletionHistoryEntry,
} from "@/services/statsService";
import {
  getDailyLeaderboard,
  getAllTimeLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getStreakLeaderboard,
  getCompletionsLeaderboard,
  getMyDailyRank,
  type LeaderboardEntry,
  type LeaderboardType,
} from "@/services/leaderboardService";
import { getMyDisplayName, setMyDisplayName } from "@/services/profileService";
import { getMyAchievements } from "@/services/achievementsService";
import { getTodayDateString } from "@/daily/dailyPuzzle";

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

const LEADERBOARD_LABELS: Record<LeaderboardType, string> = {
  daily: "Today's Daily",
  "daily-date": "Historical Daily",
  weekly: "This Week",
  monthly: "This Month",
  "all-time": "All-Time Best",
  streak: "Longest Streaks",
  completions: "Most Completions",
};

const GRID_OPTIONS = [
  { rows: 3, cols: 3, label: "3×3" },
  { rows: 4, cols: 4, label: "4×4" },
  { rows: 5, cols: 5, label: "5×5" },
  { rows: 6, cols: 6, label: "6×6" },
];

export function StatsScreen() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "leaderboard" | "achievements"
  >("dashboard");
  const [stats, setStats] = useState<{
    puzzlesCompleted: number;
    totalPlayTimeSeconds: number;
    dailyStreak: number;
    bestDailyStreak: number;
    lastPlayedAt: string | null;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("daily");
  const [historicalDate, setHistoricalDate] = useState(getTodayDateString());
  const [allTimeGrid, setAllTimeGrid] = useState({ rows: 4, cols: 4 });
  const [myRank, setMyRank] = useState<{
    rank: number;
    total: number;
    secondsBehindAbove?: number;
  } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [history, setHistory] = useState<CompletionHistoryEntry[]>([]);
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
  const [lbLoading, setLbLoading] = useState(false);

  const configured = isSupabaseConfigured();

  const loadLeaderboard = useCallback(async () => {
    if (!configured) return;
    setLbLoading(true);
    try {
      let entries: LeaderboardEntry[] = [];
      switch (leaderboardType) {
        case "daily":
          entries = await getDailyLeaderboard(getTodayDateString());
          break;
        case "daily-date":
          entries = await getDailyLeaderboard(historicalDate);
          break;
        case "weekly":
          entries = await getWeeklyLeaderboard();
          break;
        case "monthly":
          entries = await getMonthlyLeaderboard();
          break;
        case "all-time":
          entries = await getAllTimeLeaderboard(allTimeGrid.rows, allTimeGrid.cols);
          break;
        case "streak":
          entries = await getStreakLeaderboard();
          break;
        case "completions":
          entries = await getCompletionsLeaderboard();
          break;
      }
      setLeaderboard(entries);
      if (leaderboardType === "daily") {
        const rank = await getMyDailyRank();
        setMyRank(rank);
      } else {
        setMyRank(null);
      }
    } finally {
      setLbLoading(false);
    }
  }, [configured, leaderboardType, historicalDate, allTimeGrid]);

  const loadAll = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [s, a, dn, hist] = await Promise.all([
        getMyStats(),
        getMyAchievements(),
        getMyDisplayName(),
        getMyCompletionHistory(30),
      ]);
      setStats(s ?? null);
      setAchievements(a);
      setDisplayName(dn ?? "");
      setDisplayNameInput(dn ?? "");
      setHistory(hist);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (configured) loadLeaderboard();
  }, [configured, loadLeaderboard]);

  const handleSaveDisplayName = async () => {
    if (!displayNameInput.trim() || displayNameInput === displayName) return;
    setSavingName(true);
    const ok = await setMyDisplayName(displayNameInput);
    setSavingName(false);
    if (ok) {
      setDisplayName(displayNameInput.trim());
      loadLeaderboard();
    }
  };

  const formatLeaderboardValue = (entry: LeaderboardEntry): string => {
    if (leaderboardType === "streak")
      return `${entry.elapsedSeconds} day${entry.elapsedSeconds !== 1 ? "s" : ""}`;
    if (leaderboardType === "completions")
      return `${entry.elapsedSeconds} puzzle${entry.elapsedSeconds !== 1 ? "s" : ""}`;
    return formatTime(entry.elapsedSeconds);
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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
                <div className={styles.displayNameSection}>
                  <h3 className={styles.subtitle}>
                    <User size={16} />
                    Display Name
                  </h3>
                  <div className={styles.displayNameRow}>
                    <input
                      type="text"
                      className={styles.displayNameInput}
                      placeholder="Your name on leaderboards"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      maxLength={32}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveDisplayName}
                      disabled={
                        savingName ||
                        displayNameInput.trim() === displayName ||
                        !displayNameInput.trim()
                      }
                    >
                      {savingName ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>

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

                {myRank && (
                  <div className={styles.myRankCard}>
                    <Trophy size={20} />
                    <span>
                      Today&apos;s rank: <strong>#{myRank.rank}</strong> of {myRank.total}
                      {myRank.secondsBehindAbove != null &&
                        myRank.secondsBehindAbove > 0 && (
                          <span className={styles.behind}>
                            {" "}
                            ({myRank.secondsBehindAbove}s behind #{myRank.rank - 1})
                          </span>
                        )}
                    </span>
                  </div>
                )}

                {history.length > 0 && (
                  <>
                    <h2>Completion History (30 days)</h2>
                    <div className={styles.historyChart}>
                      {history.map((h, i) => (
                        <div
                          key={`${h.date}-${i}`}
                          className={styles.historyBar}
                          style={{
                            height: `${Math.min(100, (h.elapsedSeconds / 600) * 100)}%`,
                          }}
                          title={`${h.date}: ${formatTime(h.elapsedSeconds)}`}
                        />
                      ))}
                    </div>
                    <div className={styles.historyLabels}>
                      <span>Slower</span>
                      <span>Faster</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "leaderboard" && (
              <div className={styles.section}>
                <div className={styles.leaderboardControls}>
                  <select
                    className={styles.select}
                    value={leaderboardType}
                    onChange={(e) =>
                      setLeaderboardType(e.target.value as LeaderboardType)
                    }
                  >
                    {(
                      Object.entries(LEADERBOARD_LABELS) as [LeaderboardType, string][]
                    ).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  {leaderboardType === "daily-date" && (
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={historicalDate}
                      onChange={(e) => setHistoricalDate(e.target.value)}
                      max={getTodayDateString()}
                    />
                  )}
                  {leaderboardType === "all-time" && (
                    <select
                      className={styles.select}
                      value={`${allTimeGrid.rows}x${allTimeGrid.cols}`}
                      onChange={(e) => {
                        const [r, c] = e.target.value.split("x").map(Number);
                        setAllTimeGrid({ rows: r, cols: c });
                      }}
                    >
                      {GRID_OPTIONS.map((g) => (
                        <option key={g.label} value={`${g.rows}x${g.cols}`}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={loadLeaderboard}
                    disabled={lbLoading}
                  >
                    <RefreshCw
                      size={16}
                      className={lbLoading ? styles.spin : undefined}
                    />
                    Refresh
                  </Button>
                </div>

                {lbLoading ? (
                  <p className={styles.loading}>Loading...</p>
                ) : leaderboard.length === 0 ? (
                  <p className={styles.empty}>No entries yet. Be the first!</p>
                ) : (
                  <>
                    {top3.length > 0 && (
                      <div className={styles.podium}>
                        {top3[1] && (
                          <div className={styles.podiumSlot}>
                            <span className={styles.podiumRank}>2</span>
                            <span
                              className={`${styles.podiumName} ${top3[1].isYou ? styles.you : ""}`}
                            >
                              {top3[1].displayName}
                            </span>
                            <span className={styles.podiumValue}>
                              {formatLeaderboardValue(top3[1])}
                            </span>
                          </div>
                        )}
                        {top3[0] && (
                          <div className={`${styles.podiumSlot} ${styles.podiumFirst}`}>
                            <Crown size={24} className={styles.crown} />
                            <span className={styles.podiumRank}>1</span>
                            <span
                              className={`${styles.podiumName} ${top3[0].isYou ? styles.you : ""}`}
                            >
                              {top3[0].displayName}
                            </span>
                            <span className={styles.podiumValue}>
                              {formatLeaderboardValue(top3[0])}
                            </span>
                          </div>
                        )}
                        {top3[2] && (
                          <div className={styles.podiumSlot}>
                            <span className={styles.podiumRank}>3</span>
                            <span
                              className={`${styles.podiumName} ${top3[2].isYou ? styles.you : ""}`}
                            >
                              {top3[2].displayName}
                            </span>
                            <span className={styles.podiumValue}>
                              {formatLeaderboardValue(top3[2])}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <ol className={styles.leaderboard}>
                      {rest.map((entry) => (
                        <li
                          key={`${entry.userId}-${entry.rank}`}
                          className={`${styles.leaderboardItem} ${entry.isYou ? styles.leaderboardYou : ""}`}
                        >
                          <span className={styles.rank}>#{entry.rank}</span>
                          <span className={styles.player}>
                            {entry.displayName}
                            {entry.isYou && <span className={styles.youBadge}>You</span>}
                          </span>
                          <span className={styles.time}>
                            {formatLeaderboardValue(entry)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </>
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
