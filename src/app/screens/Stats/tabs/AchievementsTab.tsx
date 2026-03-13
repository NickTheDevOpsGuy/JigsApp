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
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <div className={`${styles.section} ${styles.badgesSection}`}>
      <div className={styles.badgesHeader}>
        <div>
          <p className={styles.profileSectionEyebrow}>Progress</p>
          <h2 className={styles.badgesTitle}>Badges</h2>
        </div>
        <div className={styles.badgesProgress}>
          <strong>{unlockedCount}</strong>
          <span>/ {achievements.length}</span>
        </div>
      </div>
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
            <div className={styles.achievementMeta}>
              <span className={styles.achievementStatus}>
                {a.unlocked ? "Unlocked" : "Locked"}
              </span>
              {a.unlocked && <span className={styles.achievementBadge}>✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
