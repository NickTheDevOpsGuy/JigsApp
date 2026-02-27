/**
 * DashboardTab – streak, weekly progress, overall stats, next unlock.
 */
import { formatDuration } from "../statsFormatting";
import { getStreakFreezeCount } from "@/daily/dailyPuzzleCore";
import styles from "../StatsScreen.module.css";

interface Stats {
  puzzlesCompleted: number;
  totalPlayTimeSeconds: number;
  dailyStreak: number;
  bestDailyStreak: number;
  masteryStreak: number;
  [key: string]: unknown;
}

interface DashboardTabProps {
  stats: Stats | null;
  weeklyAlbumProgress: number;
  weeklyRemaining: number;
  masteryPuzzlesRemaining: number;
}

export function DashboardTab({
  stats,
  weeklyAlbumProgress,
  weeklyRemaining,
  masteryPuzzlesRemaining,
}: DashboardTabProps) {
  const weeklyCompleted = Math.max(0, Math.min(7, weeklyAlbumProgress));

  return (
    <div className={styles.section}>
      <div className={styles.retentionHero}>
        <p className={styles.retentionHeading}>🔥 CURRENT STREAK</p>
        <div className={styles.retentionDivider} />
        <p className={styles.retentionBig}>{stats?.dailyStreak ?? 0} days</p>
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
            <strong>{formatDuration(stats?.totalPlayTimeSeconds ?? 0)}</strong>
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
  );
}
