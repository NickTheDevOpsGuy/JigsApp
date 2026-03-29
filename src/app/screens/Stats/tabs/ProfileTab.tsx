/**
 * ProfileTab – identity, streak, tier, stats, finished puzzles grid, daily mastery, settings.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { getBestTime } from "@/screens/Play/core/time/timeMode";
import { formatDuration } from "../statsFormatting";
import { prestigeReset } from "@/services/player/prestigeService";
import {
  dailyStreakXpMultiplier,
  formatStreakXpMultiplierLabel,
} from "@/services/player/dailyStreakXp";
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

function displayHandleFromName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `@${(s || "puzzler").slice(0, 20)}`;
}

function avatarInitial(name: string): string {
  const c = name.trim().charAt(0);
  return c && /[a-zA-Z0-9]/.test(c) ? c.toUpperCase() : "?";
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
  onNavigateToAchievements?: () => void;
  /** Defaults to home / play when portfolio is empty */
  onNavigateHome?: () => void;
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
  onNavigateToAchievements,
  onSeeRankingFor4x4,
  onNavigateHome,
}: ProfileTabProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const displayNameInputRef = useRef<HTMLInputElement>(null);

  const displayName = (
    displayNameInput.trim() ||
    profile?.displayName ||
    "Puzzler"
  ).slice(0, 32);
  const handle = displayHandleFromName(displayName);
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
  const nextDailyXpMult = dailyStreakXpMultiplier(streak + 1);

  useEffect(() => {
    if (settingsOpen && displayNameInputRef.current) {
      const id = window.requestAnimationFrame(() => {
        displayNameInputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [settingsOpen]);

  return (
    <div className={styles.profilePageShell}>
      <section className={`${styles.profileBlock} ${styles.profileSummaryBlock}`}>
        <div className={styles.profileSummaryTop}>
          <div className={styles.profileAvatar} aria-hidden>
            {avatarInitial(displayName)}
          </div>
          <div className={styles.profileSummaryIdentity}>
            <p className={styles.profileSectionEyebrow}>Player</p>
            <p className={styles.profileIdentity}>
              <strong>{displayName}</strong>
            </p>
            <p className={styles.profileHandle}>{handle}</p>
            <div className={styles.profileIdentityChips} aria-label="Player highlights">
              <span className={styles.profileChip}>{tier}</span>
              <span className={styles.profileChip}>{puzzles} puzzles</span>
              {streak > 0 ? (
                <span className={styles.profileChip}>{streak}d streak</span>
              ) : null}
            </div>
          </div>
          <div className={styles.profileSummaryStatRail}>
            <div className={styles.profileMiniStat}>
              <span className={styles.profileMiniStatLabel}>Streak</span>
              <strong className={styles.profileMiniStatValue}>{streak}d</strong>
            </div>
            <div className={styles.profileMiniStat}>
              <span className={styles.profileMiniStatLabel}>Level</span>
              <strong className={styles.profileMiniStatValue}>{level}</strong>
            </div>
            <div className={styles.profileMiniStat}>
              <span className={styles.profileMiniStatLabel}>Puzzles</span>
              <strong className={styles.profileMiniStatValue}>{puzzles}</strong>
            </div>
          </div>
        </div>
        {bestStreak > 0 && bestStreak !== streak ? (
          <p className={styles.profileStatMuted}>Best streak: {bestStreak} days</p>
        ) : null}
        <p className={styles.profileStatMuted}>
          {nextDailyXpMult > 1.02 ? (
            <>
              Next daily solve earns {formatStreakXpMultiplierLabel(nextDailyXpMult)} XP
              toward level (streak bonus, max 2×).
            </>
          ) : (
            <>
              Consecutive daily solves multiply XP (up to 2×), so streaks level you up
              faster.
            </>
          )}
        </p>

        <div className={styles.profileSummaryDivider} />

        <div className={styles.profileSummaryStatsHeader}>
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

        <div className={styles.profileToolbar}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSettingsOpen(true)}
            aria-expanded={settingsOpen}
            aria-controls="profile-settings-panel"
          >
            Edit profile
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onNavigateToBoard?.()}
            disabled={!onNavigateToBoard}
          >
            Board
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onNavigateToAchievements?.()}
            disabled={!onNavigateToAchievements}
          >
            Badges
          </Button>
        </div>
      </section>

      <section className={styles.profileSpotlightSection} aria-label="Shortcuts">
        <div className={styles.profileSpotlightHeader}>
          <p className={styles.profileSectionEyebrow}>Explore</p>
          <h2 className={styles.profileBlockTitle}>Links</h2>
        </div>
        <div className={styles.profileSpotlightGrid}>
          <div className={styles.profileSpotlightCard}>
            <p className={styles.profileSpotlightCardTitle}>Board & rankings</p>
            <p className={styles.profileSpotlightCardText}>
              Compare times, browse filters, and see where you land on the leaderboards.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              fullWidth
              onClick={() => onNavigateToBoard?.()}
              disabled={!onNavigateToBoard}
            >
              Open board
            </Button>
          </div>
          <div className={styles.profileSpotlightCard}>
            <p className={styles.profileSpotlightCardTitle}>Badges & milestones</p>
            <p className={styles.profileSpotlightCardText}>
              Track streaks, unlocks, and long-term goals as you keep playing.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              fullWidth
              onClick={() => onNavigateToAchievements?.()}
              disabled={!onNavigateToAchievements}
            >
              View badges
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.profileBlock}>
        <div className={styles.profileBlockHeader}>
          <div>
            <p className={styles.profileSectionEyebrow}>Collection</p>
            <h2 className={styles.profileBlockTitle}>Portfolio</h2>
          </div>
          {puzzles > 0 && onNavigateToBoard && (
            <button
              type="button"
              className={styles.profileViewAll}
              onClick={onNavigateToBoard}
            >
              View board
            </button>
          )}
        </div>
        {puzzles > 0 ? (
          <>
            <p className={styles.profileSectionLead}>
              Recent finishes fill your weekly album thumbnails below.
            </p>
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
                        loading={i < 7 ? "eager" : "lazy"}
                        decoding="async"
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
          </>
        ) : (
          <div className={styles.profilePortfolioEmpty}>
            <p className={styles.profilePortfolioEmptyTitle}>
              Nothing in your showcase yet
            </p>
            <p className={styles.profilePortfolioEmptyText}>
              Your album and highlights appear here as you complete puzzles. Start with a
              quick round, then check the board to see how you stack up.
            </p>
            <ul className={styles.profilePortfolioEmptyActions}>
              <li>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  fullWidth
                  onClick={() => onNavigateHome?.()}
                  disabled={!onNavigateHome}
                >
                  Play a puzzle
                </Button>
              </li>
              <li>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  fullWidth
                  onClick={() => onNavigateToBoard?.()}
                  disabled={!onNavigateToBoard}
                >
                  Open board
                </Button>
              </li>
              <li>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  fullWidth
                  onClick={() => onNavigateToAchievements?.()}
                  disabled={!onNavigateToAchievements}
                >
                  Browse badges
                </Button>
              </li>
            </ul>
          </div>
        )}
      </section>

      <section className={`${styles.profileBlock} ${styles.profileBlockMastery}`}>
        <div className={styles.profileBlockHeader}>
          <div>
            <p className={styles.profileSectionEyebrow}>Consistency</p>
            <h2 className={styles.profileBlockTitle}>Daily Mastery</h2>
          </div>
          <strong className={styles.profileMasteryCount}>{masteryCount}/7</strong>
        </div>
        <p className={styles.profileSectionLead}>
          Complete the daily puzzle each day this week to fill the bar.
        </p>
        <div
          className={styles.profileMasteryBar}
          aria-label={`Daily mastery ${masteryCount} out of 7`}
          title={`Daily mastery: ${masteryCount} of 7 this week`}
        >
          <div
            className={styles.profileMasteryFill}
            style={{ width: `${(masteryCount / 7) * 100}%` }}
          />
        </div>
      </section>

      <section className={styles.profileBlock} id="profile-settings-section">
        <button
          type="button"
          className={styles.profileSettingsToggle}
          onClick={() => setSettingsOpen((o) => !o)}
          aria-expanded={settingsOpen}
          aria-controls="profile-settings-panel"
          aria-label="Account settings"
          title="Account settings"
        >
          <span>
            <span className={styles.profileSectionEyebrow}>Account</span>
            <span className={styles.profileSettingsTitle}>Profile & privacy</span>
          </span>
          {settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {settingsOpen && (
          <div
            className={styles.profileSettingsContent}
            id="profile-settings-panel"
            role="region"
            aria-label="Profile and privacy settings"
          >
            <div className={styles.profileSettingsField}>
              <label className={styles.profileSettingsLabel} htmlFor="stats-display-name">
                Display name
              </label>
              <input
                ref={displayNameInputRef}
                id="stats-display-name"
                type="text"
                className={styles.displayNameInput}
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Puzzler"
                maxLength={32}
                aria-label="Display name"
                title="Display name on leaderboards"
              />
            </div>
            <p className={styles.profileSettingsHint}>
              This name appears on leaderboards when enabled below.
            </p>
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
              {profileSaving ? "Saving…" : "Save changes"}
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
