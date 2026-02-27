/**
 * AchievementsTab – list of achievements with unlock status.
 */
import styles from "../StatsScreen.module.css";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementsTabProps {
  achievements: Achievement[];
}

export function AchievementsTab({ achievements }: AchievementsTabProps) {
  return (
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
  );
}
