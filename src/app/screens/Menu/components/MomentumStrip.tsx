import { CheckCircle2, Flame, Snowflake } from "lucide-react";

import type { RecentDailyStatus } from "../hooks/useMenuHomeData";
import styles from "../MenuScreen.module.css";

type MomentumStripProps = {
  streak: number;
  streakFreezeCount: number;
  momentumHint: string;
  recentDailyStatuses: RecentDailyStatus[];
};

export function MomentumStrip({
  streak,
  streakFreezeCount,
  momentumHint,
  recentDailyStatuses,
}: MomentumStripProps) {
  return (
    <div className={`${styles.momentumCard} ${styles.actionCardFullWidth}`}>
      <div className={styles.momentumSummary} aria-label="Daily progress summary">
        <div className={styles.momentumMetric}>
          <Flame size={16} aria-hidden />
          <span>{streak} day streak</span>
        </div>
        <div className={styles.momentumMetric}>
          <Snowflake size={16} aria-hidden />
          <span>
            {streakFreezeCount} freeze{streakFreezeCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className={styles.momentumMetric}>
          <CheckCircle2 size={16} aria-hidden />
          <span>{momentumHint}</span>
        </div>
      </div>
      <div className={styles.dailyHistory} aria-label="Last seven daily results">
        {recentDailyStatuses.map((entry) => (
          <div key={entry.date} className={styles.dailyHistoryItem}>
            <span
              className={`${styles.dailyHistoryDot} ${
                entry.completed
                  ? styles.dailyHistoryDotComplete
                  : styles.dailyHistoryDotMiss
              } ${entry.isToday ? styles.dailyHistoryDotToday : ""}`}
              aria-hidden
            />
            <span className={styles.dailyHistoryLabel}>{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
