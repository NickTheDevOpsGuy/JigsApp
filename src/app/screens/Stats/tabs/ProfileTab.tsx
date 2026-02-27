/**
 * ProfileTab – display name, show on leaderboard, mastery info, prestige.
 */
import { Button } from "@/components/Button/Button";
import { prestigeReset } from "@/services/prestigeService";
import styles from "../StatsScreen.module.css";

interface ProfileTabProps {
  profile: { displayName: string; showOnLeaderboard: boolean } | null;
  setProfile: React.Dispatch<
    React.SetStateAction<{ displayName: string; showOnLeaderboard: boolean } | null>
  >;
  displayNameInput: string;
  setDisplayNameInput: (v: string) => void;
  raccoonName: string | null;
  stats: { level?: number; masteryStreak?: number; [key: string]: unknown } | null;
  onSave: () => Promise<void>;
  profileSaving: boolean;
  loadData: () => Promise<void>;
}

export function ProfileTab({
  profile,
  setProfile,
  displayNameInput,
  setDisplayNameInput,
  raccoonName,
  stats,
  onSave,
  profileSaving,
  loadData,
}: ProfileTabProps) {
  return (
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
        🏅 Mastery badge: complete the daily puzzle with no hints and no undo. Current
        mastery streak: <strong>{stats?.masteryStreak ?? 0}</strong>.
      </p>
      {stats && (stats.level ?? 1) >= 5 && (
        <div className={styles.prestigeSection}>
          <h3>Prestige</h3>
          <p className={styles.hint}>
            Reset to Level 1 and earn a rare cosmetic badge. Your puzzles completed and
            challenge wins are kept.
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
      <Button onClick={onSave} disabled={profileSaving} className={styles.saveBtn}>
        {profileSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
