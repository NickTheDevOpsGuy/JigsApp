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
      <section className={`${styles.profileBlock} ${styles.profileHeroBlock}`}>
        <div className={styles.profileHeroHeader}>
          <div>
            <p className={styles.profileSectionEyebrow}>Player</p>
            <p className={styles.profileIdentity}>
              <strong>{displayName}</strong>
            </p>
            <p className={styles.profileTier}>{tier}</p>
          </div>
          <div className={styles.profileHeroMeta}>
            <div className={styles.profileMetaBadge}>
              <span className={styles.profileMetaLabel}>Streak</span>
              <strong>{streak}d</strong>
            </div>
            <div className={styles.profileMetaBadge}>
              <span className={styles.profileMetaLabel}>Level</span>
              <strong>{level}</strong>
            </div>
          </div>
        </div>
        {bestStreak > 0 && bestStreak !== streak && (
          <p className={styles.profileStatMuted}>Best streak: {bestStreak} days</p>
        )}
      </section>

      <section className={`${styles.profileBlock} ${styles.profileStatsBlock}`}>
        <div className={styles.profileBlockHeader}>
          <div>
            <p className={styles.profileSectionEyebrow}>Progress</p>
            <h2 className={styles.profileBlockTitle}>Stats</h2>
          </div>
        </div>
        <div className={styles.profileStatTiles}>
          <div className={styles.profileStatTile}>
            <span className={styles.profileStatTileLabel}>Puzzles</span>
            <strong className={styles.profileStatTileValue}>{puzzles}</strong>
          </div>
          <div className={styles.profileStatTile}>
            <span className={styles.profileStatTileLabel}>4x4 best</span>
            <strong
              className={`${styles.profileStatTileValue} ${!hasBest ? styles.profileStatMuted : ""}`}
            >
              {bestStr}
            </strong>
            {onSeeRankingFor4x4 && (
              <button
                type="button"
                className={styles.profileInlineLink}
                onClick={onSeeRankingFor4x4}
              >
                See ranking
              </button>
            )}
          </div>
          <div className={styles.profileStatTile}>
            <span className={styles.profileStatTileLabel}>Total time</span>
            <strong className={styles.profileStatTileValue}>{totalTime}</strong>
          </div>
        </div>
      </section>

      {puzzles > 0 && (
        <section className={styles.profileBlock}>
          <div className={styles.profileBlockHeader}>
            <div>
              <p className={styles.profileSectionEyebrow}>Collection</p>
              <h2 className={styles.profileBlockTitle}>Finished Puzzles</h2>
            </div>
            {onNavigateToBoard && (
              <button
                type="button"
                className={styles.profileViewAll}
                onClick={onNavigateToBoard}
              >
                View board
              </button>
            )}
          </div>
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
        </section>
      )}

      <section className={`${styles.profileBlock} ${styles.profileBlockMastery}`}>
        <div className={styles.profileBlockHeader}>
          <div>
            <p className={styles.profileSectionEyebrow}>Consistency</p>
            <h2 className={styles.profileBlockTitle}>Daily Mastery</h2>
          </div>
          <strong className={styles.profileMasteryCount}>{masteryCount}/7</strong>
        </div>
        <div
          className={styles.profileMasteryBar}
          aria-label={`Daily mastery ${masteryCount} out of 7`}
        >
          <div
            className={styles.profileMasteryFill}
            style={{ width: `${(masteryCount / 7) * 100}%` }}
          />
        </div>
      </section>

      <section className={styles.profileBlock}>
        <button
          type="button"
          className={styles.profileSettingsToggle}
          onClick={() => setSettingsOpen((o) => !o)}
          aria-expanded={settingsOpen}
        >
          <span>
            <span className={styles.profileSectionEyebrow}>Account</span>
            <span className={styles.profileSettingsTitle}>Settings</span>
          </span>
          {settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {settingsOpen && (
          <div className={styles.profileSettingsContent}>
            <div className={styles.profileSettingsField}>
              <label className={styles.profileSettingsLabel} htmlFor="stats-display-name">
                Display name
              </label>
              <input
                id="stats-display-name"
                type="text"
                className={styles.displayNameInput}
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Puzzler"
                maxLength={32}
                aria-label="Display name"
              />
            </div>
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
              <div className={styles.profilePrestigeBox}>
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
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
