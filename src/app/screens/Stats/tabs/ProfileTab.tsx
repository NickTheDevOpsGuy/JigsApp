/**
 * ProfileTab – identity, streak, tier, stats, finished puzzles grid, daily mastery, settings.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { getBestTime } from "@/screens/Play/timeMode";
import { formatDuration } from "../statsFormatting";
import { prestigeReset } from "@/services/prestigeService";
import styles from "../StatsScreen.module.css";

function formatBestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Level to tier label e.g. 7 -> "Gold III" */
function levelToTier(level: number): string {
  if (level < 1) return "—";
  const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
  const tierIndex = Math.min(Math.floor((level - 1) / 3), tiers.length - 1);
  const rank = ((level - 1) % 3) + 1;
  const roman = rank === 1 ? "I" : rank === 2 ? "II" : "III";
  return `${tiers[tierIndex]} ${roman}`;
}

interface ProfileTabProps {
  profile: { displayName: string; showOnLeaderboard: boolean } | null;
  setProfile: React.Dispatch<
    React.SetStateAction<{ displayName: string; showOnLeaderboard: boolean } | null>
  >;
  displayNameInput: string;
  setDisplayNameInput: (v: string) => void;
  raccoonName: string | null;
  stats: {
    puzzlesCompleted?: number;
    totalPlayTimeSeconds?: number;
    dailyStreak?: number;
    level?: number;
    masteryStreak?: number;
    [key: string]: unknown;
  } | null;
  weeklyAlbumSlots: {
    date: string;
    dayLabel: string;
    imageUrl: string | null;
    completed: boolean;
  }[];
  weeklyAlbumProgress: number;
  onSave: () => Promise<void>;
  profileSaving: boolean;
  loadData: () => Promise<void>;
  onNavigateToBoard?: () => void;
}

export function ProfileTab({
  profile,
  setProfile,
  displayNameInput,
  setDisplayNameInput,
  raccoonName: _raccoonName,
  stats,
  weeklyAlbumSlots,
  weeklyAlbumProgress,
  onSave,
  profileSaving,
  loadData,
  onNavigateToBoard,
}: ProfileTabProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const displayName = (
    displayNameInput.trim() ||
    profile?.displayName ||
    "Puzzler"
  ).slice(0, 32);
  const streak = stats?.dailyStreak ?? 0;
  const level = stats?.level ?? 1;
  const tier = levelToTier(level);
  const puzzles = stats?.puzzlesCompleted ?? 0;
  const bestSeconds = getBestTime(4, 4);
  const bestStr =
    bestSeconds != null ? formatBestTime(bestSeconds) : "Awaiting your first finish";
  const totalTime = formatDuration(stats?.totalPlayTimeSeconds ?? 0);
  const masteryCount = Math.min(7, weeklyAlbumProgress);

  return (
    <div className={styles.profileLayout}>
      {/* Identity */}
      <section className={styles.profileBlock}>
        <p className={styles.profileIdentity}>
          <strong>{displayName}</strong>
        </p>
        <p className={styles.profileSubtitle}>Puzzler</p>
        <p className={styles.profileStreak}>🔥 {streak} day streak</p>
        <p className={styles.profileTier}>{tier}</p>
      </section>

      {/* Stats */}
      <section className={styles.profileBlock}>
        <h2 className={styles.profileBlockTitle}>Stats</h2>
        <div className={styles.profileStatsRow}>
          <span>Puzzles: {puzzles}</span>
          <span>Best: {bestStr}</span>
        </div>
        <div className={styles.profileStatsRow}>
          <span>Total Time: {totalTime}</span>
        </div>
      </section>

      {/* Finished Puzzles – gallery when any completed, empty state otherwise */}
      <section className={styles.profileBlock}>
        <h2 className={styles.profileBlockTitle}>Finished Puzzles</h2>
        {puzzles > 0 ? (
          <>
            <div className={styles.profilePuzzleGrid}>
              {Array.from({ length: 7 }, (_, i) => {
                const slot = weeklyAlbumSlots[i];
                const filled = slot?.completed ?? false;
                return (
                  <div
                    key={slot?.date ?? i}
                    className={`${styles.profilePuzzleSlot} ${filled ? styles.profilePuzzleSlotFilled : ""}`}
                    aria-hidden
                  >
                    {filled && slot?.imageUrl ? (
                      <img
                        src={slot.imageUrl}
                        alt=""
                        className={styles.profilePuzzleThumb}
                        loading="lazy"
                      />
                    ) : filled ? (
                      <span className={styles.profilePuzzlePlaceholder} aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {onNavigateToBoard && (
              <button
                type="button"
                className={styles.profileViewAll}
                onClick={onNavigateToBoard}
              >
                View All →
              </button>
            )}
          </>
        ) : (
          <div className={styles.profileGalleryEmpty}>
            <span className={styles.profileGalleryEmptyIcon} aria-hidden>
              🧩
            </span>
            <p className={styles.profileGalleryEmptyTitle}>No finished puzzles yet</p>
            <p className={styles.profileGalleryEmptyText}>
              Solve one to build your personal gallery.
            </p>
            <Link to="/play?daily=1&grid=4x4" className={styles.profileGalleryEmptyBtn}>
              Start Today's Puzzle
            </Link>
          </div>
        )}
      </section>

      {/* Daily Mastery */}
      <section className={`${styles.profileBlock} ${styles.profileBlockMastery}`}>
        <h2 className={styles.profileBlockTitle}>Daily Mastery {masteryCount} / 7</h2>
      </section>

      {/* Settings (expandable) */}
      <section className={styles.profileBlock}>
        <button
          type="button"
          className={styles.profileSettingsToggle}
          onClick={() => setSettingsOpen((o) => !o)}
          aria-expanded={settingsOpen}
        >
          Settings {settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {settingsOpen && (
          <div className={styles.profileSettingsContent}>
            <p className={styles.hint}>Display name (for leaderboards)</p>
            <input
              type="text"
              className={styles.displayNameInput}
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="Puzzler"
              maxLength={32}
              aria-label="Display name"
            />
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
            <Button onClick={onSave} disabled={profileSaving} className={styles.saveBtn}>
              {profileSaving ? "Saving…" : "Save"}
            </Button>
            {stats && (stats.level ?? 1) >= 5 && (
              <>
                <p className={styles.hint}>
                  Prestige: reset to Level 1 and earn ★. Completions kept.
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
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
