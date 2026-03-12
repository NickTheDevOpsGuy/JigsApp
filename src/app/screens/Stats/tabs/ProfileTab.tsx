/**
 * ProfileTab – identity, streak, tier, stats, finished puzzles grid, daily mastery, settings.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { getBestTime } from "@/screens/Play/core/time/timeMode";
import { formatDuration } from "../statsFormatting";
import { prestigeReset } from "@/services/player/prestigeService";
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
    bestDailyStreak?: number;
    level?: number;
    masteryStreak?: number;
    [key: string]: unknown;
  } | null;
  onSeeRankingFor4x4?: () => void;
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
  onSeeRankingFor4x4,
}: ProfileTabProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const displayName = (
    displayNameInput.trim() ||
    profile?.displayName ||
    "Puzzler"
  ).slice(0, 32);
  const streak = stats?.dailyStreak ?? 0;
  const bestStreak = stats?.bestDailyStreak ?? 0;
  const level = stats?.level ?? 1;
  const tier = levelToTier(level);
  const puzzles = stats?.puzzlesCompleted ?? 0;
  const bestSeconds = getBestTime(4, 4);
  const hasBest = bestSeconds != null;
  const bestStr = hasBest ? formatBestTime(bestSeconds) : "—";
  const totalTime = formatDuration(stats?.totalPlayTimeSeconds ?? 0);
  const masteryCount = Math.min(7, weeklyAlbumProgress);

  return (
    <div className={styles.profileLayout}>
      {/* Identity */}
      <section className={styles.profileBlock}>
        <p className={styles.profileIdentity}>
          <strong>{displayName}</strong>
        </p>
        <p className={styles.profileStreak}>🔥 {streak} day streak</p>
        {bestStreak > 0 && bestStreak !== streak && (
          <p className={styles.profileStatMuted}>Best: {bestStreak} days</p>
        )}
        <p className={styles.profileTier}>{tier}</p>
      </section>

      {/* Stats: Puzzles + Best (4×4) on one line, Total Time below */}
      <section className={styles.profileBlock}>
        <h2 className={styles.profileBlockTitle}>Stats</h2>
        <div className={styles.profileStatsRow}>
          <span>Puzzles: {puzzles}</span>
          <span>
            Best (4×4):{" "}
            <span className={!hasBest ? styles.profileStatMuted : undefined}>
              {bestStr}
            </span>
            {onSeeRankingFor4x4 && (
              <>
                {" "}
                <button
                  type="button"
                  className={styles.profileInlineLink}
                  onClick={onSeeRankingFor4x4}
                >
                  See ranking
                </button>
              </>
            )}
          </span>
        </div>
        <div className={styles.profileStatsRow}>
          <span>Total Time: {totalTime}</span>
        </div>
      </section>

      {/* Finished Puzzles – only show when there are completed puzzles */}
      {puzzles > 0 && (
        <section className={styles.profileBlock}>
          <h2 className={styles.profileBlockTitle}>Finished Puzzles</h2>
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
        </section>
      )}

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
