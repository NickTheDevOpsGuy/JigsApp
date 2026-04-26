/**
 * MenuScreen – full-bleed mobile home. Fills the screen, no floating card.
 * Primary: Play Today. Secondary: Packs + Quick Play as rows. Tertiary: Feedback link.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ImagePlus, ChevronRight, Flame, Snowflake, Trophy } from "lucide-react";
import { useHomeData } from "./hooks/useHomeData";
import type { WeekDot } from "./hooks/useHomeData";
import { ChoosePuzzleModal } from "@/components/ChoosePuzzleModal";
import { PackChoiceModal } from "@/components/PackChoiceModal";
import { FeedbackChoiceModal } from "@/components/FeedbackChoiceModal";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { WhatsNewModal } from "@/components/WhatsNew";
import { shouldShowChangelog } from "@/data/content/changelog";
import { DAILY_DATE_KEY, DAILY_MODIFIER_KEY } from "@/daily/dailyPuzzleCore";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { loadPlayScreenModule } from "@/screens/Play/loadPlayScreen";
import {
  GRID_KEY,
  GRID_ONCE_KEY,
  PUZZLE_ID_KEY,
  PUZZLE_NAME_KEY,
  STORAGE_KEY,
} from "@/screens/Play/core/utils/playScreenUtils";
import { loadPackListScreenModule, loadStatsScreenModule } from "@/screens/routeLoaders";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import styles from "./MenuScreen.module.css";

const FIRST_FAST_START_KEY = "phuzzle:firstFastStart";

function shouldShowFastStart(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (safeLocalStorage.getItem(FIRST_FAST_START_KEY) === "true") return false;
    if (safeLocalStorage.getItem("phuzzle:completedPuzzles")) return false;
    if (safeLocalStorage.getItem("phuzzle:completionHistory")) return false;
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i) ?? "";
      if (key.startsWith("phuzzle:daily:") && key.endsWith(":completed")) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function MenuScreen() {
  const navigate = useNavigate();
  const [showChoosePuzzleModal, setShowChoosePuzzleModal] = useState(false);
  const [showPackChoiceModal, setShowPackChoiceModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDailyDifficultyModal, setShowDailyDifficultyModal] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [hasUnreadWhatsNew, setHasUnreadWhatsNew] = useState(() => shouldShowChangelog());
  const [showFastStart, setShowFastStart] = useState(() => shouldShowFastStart());
  const {
    streak,
    freezes,
    puzzleNumber,
    gridLabel,
    isCompleted,
    todayTimeLabel,
    weekDots,
    weeklyCompleted,
    weeklyRemaining,
    dailySpotlight,
    nextDailyXpMultiplier,
    nextDailyXpMultiplierLabel,
  } = useHomeData();

  const handleDailyPlay = () => {
    void loadPlayScreenModule();
    setShowDailyDifficultyModal(true);
  };

  const handleQuickPlay = () => {
    void loadPlayScreenModule();
    setShowChoosePuzzleModal(true);
  };

  const handleFastStart = async () => {
    const { SAMPLE_PUZZLES } = await import("@/data/packs/samplePuzzles");
    const puzzle = SAMPLE_PUZZLES[0];
    if (!puzzle) {
      handleQuickPlay();
      return;
    }
    clearPuzzleState();
    safeLocalStorage.setItem(FIRST_FAST_START_KEY, "true");
    safeLocalStorage.setItem(STORAGE_KEY, puzzle.fullImage);
    safeLocalStorage.setItem(GRID_KEY, "3x3");
    safeLocalStorage.setItem(GRID_ONCE_KEY, "3x3");
    safeLocalStorage.setItem(PUZZLE_ID_KEY, puzzle.id);
    safeLocalStorage.setItem(PUZZLE_NAME_KEY, puzzle.name);
    safeLocalStorage.removeItem(DAILY_DATE_KEY);
    safeLocalStorage.removeItem(DAILY_MODIFIER_KEY);
    setShowFastStart(false);
    void loadPlayScreenModule();
    navigate("/play");
  };

  const handlePacks = () => {
    void loadPackListScreenModule();
    setShowPackChoiceModal(true);
  };
  const handleStats = () => {
    void loadStatsScreenModule();
    navigate("/stats");
  };

  const handleFeedback = () => setShowFeedbackModal(true);
  const handleWhatsNew = () => setShowWhatsNewModal(true);

  useEffect(() => {
    if (!hasUnreadWhatsNew) return;
    setShowWhatsNewModal(true);
  }, [hasUnreadWhatsNew]);

  const handleCloseWhatsNew = () => {
    setShowWhatsNewModal(false);
    setHasUnreadWhatsNew(false);
  };

  return (
    <>
      <div className={styles.canvas}>
        <div className={styles.page} data-testid="menu-shell">
          {/* ─── Header ─── */}
          <header className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoMark} aria-hidden>
                🧩
              </span>
              <span className={styles.logoText}>Phuzzle</span>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.whatsNewBtn}`}
                onClick={handleWhatsNew}
                aria-label="What's new"
                title="What's New"
                data-testid="menu-whats-new-action"
              >
                <span className={styles.whatsNewEmoji} aria-hidden>
                  ✨
                </span>
                {hasUnreadWhatsNew ? (
                  <span className={styles.iconUnreadDot} aria-hidden />
                ) : null}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleFeedback}
                aria-label="Feedback"
                title="Feedback"
                data-testid="menu-feedback-action"
              >
                <span className={styles.feedbackEmoji} aria-hidden>
                  📣
                </span>
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleStats}
                aria-label="View stats"
                title="Stats"
              >
                <Trophy size={18} aria-hidden />
              </button>
              <ThemeToggle size="compact" />
            </div>
          </header>

          {/* ─── Primary content (app shell provides <main id="main">) ─── */}
          <div className={styles.main}>
            <section className={styles.heroSection}>
              {/* Daily puzzle label */}
              <div className={styles.puzzleLabel}>
                <span className={styles.puzzleLabelTag}>TODAY'S PUZZLE</span>
                <span className={styles.puzzleLabelNum}>Daily #{puzzleNumber}</span>
              </div>

              {dailySpotlight && (
                <p
                  className={styles.dailySpotlightLine}
                  title={dailySpotlight.description}
                >
                  {dailySpotlight.line}
                </p>
              )}
              <p className={styles.dailySpotlightHint}>
                Each day highlights a different category with a featured puzzle to
                encourage variety and return visits.
              </p>

              {isCompleted && (
                <p className={styles.dailyComebackHint}>
                  A new daily drops every day — come back tomorrow to grow your streak and
                  fill the weekly album.
                </p>
              )}

              {/* Primary CTA */}
              <button
                type="button"
                className={`${styles.primaryBtn} ${isCompleted ? styles.primaryBtnDone : ""}`}
                onClick={handleDailyPlay}
                aria-label={
                  isCompleted
                    ? "Today's puzzle complete — play again"
                    : "Play today's puzzle"
                }
                title={isCompleted ? "Play today's puzzle again" : "Play today's puzzle"}
              >
                <div className={styles.primaryBtnInner}>
                  <span className={styles.primaryBtnTitle}>
                    {isCompleted ? "Completed ✓" : "Play Today"}
                  </span>
                  <span className={styles.primaryBtnSub}>
                    {gridLabel}
                    {todayTimeLabel ? ` · ${todayTimeLabel}` : ""}
                  </span>
                </div>
                <ChevronRight size={20} className={styles.primaryBtnArrow} aria-hidden />
              </button>

              {showFastStart ? (
                <button
                  type="button"
                  className={styles.fastStartBtn}
                  onClick={() => void handleFastStart()}
                  aria-label="Start fast 3 by 3 puzzle"
                >
                  <span className={styles.fastStartCopy}>
                    <span className={styles.fastStartTitle}>Start fast 3×3</span>
                    <span className={styles.fastStartSub}>
                      Tiny puzzle. Quick win. Then chase a better run.
                    </span>
                  </span>
                  <ChevronRight size={18} className={styles.fastStartArrow} aria-hidden />
                </button>
              ) : null}

              {/* ─── Streak strip ─── */}
              <div className={styles.streakRow}>
                {streak > 0 && (
                  <div className={styles.streakStat}>
                    <Flame size={14} className={styles.streakIcon} aria-hidden />
                    <span className={styles.streakVal}>{streak}</span>
                    <span className={styles.streakUnit}>streak</span>
                  </div>
                )}
                {freezes > 0 && (
                  <div className={styles.streakStat}>
                    <Snowflake size={13} className={styles.freezeIcon} aria-hidden />
                    <span className={styles.streakVal}>{freezes}</span>
                    <span className={styles.streakUnit}>
                      freeze{freezes !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <div className={styles.weekDots} role="list" aria-label="This week">
                  {weekDots.map(
                    ({ day, done, isToday, isFuture }: WeekDot, i: number) => {
                      const missed = !done && !isToday && !isFuture;
                      const dotClass = [
                        styles.dot,
                        done && styles.dotDone,
                        isToday && styles.dotToday,
                        !done && isFuture && styles.dotFuture,
                        missed && styles.dotMissed,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const wrapClass = [
                        styles.dotWrap,
                        !done && isFuture && styles.dotWrapFuture,
                        missed && styles.dotWrapMissed,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const dayLabelClass = [
                        styles.dotDay,
                        isToday && styles.dotDayToday,
                        !done && isFuture && styles.dotDayFuture,
                        missed && styles.dotDayMissed,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <div
                          key={i}
                          className={wrapClass}
                          role="listitem"
                          title={`${day}${done ? " — done" : ""}${isToday ? " (today)" : ""}${isFuture ? " (upcoming)" : ""}`}
                        >
                          <div className={dotClass} />
                          <span className={dayLabelClass}>{day}</span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
              {nextDailyXpMultiplier > 1.01 ? (
                <p
                  className={styles.streakXpHint}
                  title="Signed-in daily completes earn XP; streak multiplies that XP up to 2×, raising level and tier faster."
                >
                  Next daily solve · {nextDailyXpMultiplierLabel} XP (streak bonus)
                </p>
              ) : (
                <p className={styles.streakXpHint}>
                  Daily streaks multiply XP on each solve (up to 2×) for faster levels.
                </p>
              )}
            </section>

            <section className={styles.supportSection}>
              <section className={styles.weeklyCard} aria-label="Weekly progress">
                <div className={styles.weeklyCardHeader}>
                  <span className={styles.weeklyCardTag}>WEEKLY ALBUM</span>
                  <span className={styles.weeklyCardCount}>{weeklyCompleted}/7</span>
                </div>
                <p className={styles.weeklyCardText}>
                  {weeklyRemaining === 0
                    ? "Full week complete. Keep the streak alive with another daily solve."
                    : weeklyRemaining === 1
                      ? "One more daily puzzle fills this week's album."
                      : `${weeklyRemaining} more daily puzzles fill this week's album.`}
                </p>
              </section>

              {/* ─── Divider ─── */}
              <div className={styles.divider} aria-hidden />

              {/* ─── Secondary actions ─── */}
              <nav className={styles.secondaryNav} aria-label="More options">
                <p className={styles.secondarySectionLabel}>Explore</p>
                <button
                  type="button"
                  className={styles.secondaryRow}
                  onClick={handlePacks}
                  aria-label="Puzzle packs — browse themed collections"
                  title="Browse puzzle packs"
                >
                  <span className={styles.secondaryIcon} aria-hidden>
                    <Package size={18} strokeWidth={1.75} />
                  </span>
                  <span className={styles.secondaryText}>
                    <span className={styles.secondaryLabel}>Puzzle Packs</span>
                    <span className={styles.secondaryDesc}>
                      Hand-picked themed puzzles
                    </span>
                  </span>
                  <ChevronRight size={16} className={styles.secondaryArrow} aria-hidden />
                </button>

                <button
                  type="button"
                  className={styles.secondaryRow}
                  onClick={handleQuickPlay}
                  aria-label="Quick play — pick any image"
                  title="Start a quick play puzzle"
                >
                  <span className={styles.secondaryIcon} aria-hidden>
                    <ImagePlus size={18} strokeWidth={1.75} />
                  </span>
                  <span className={styles.secondaryText}>
                    <span className={styles.secondaryLabel}>Quick Play</span>
                    <span className={styles.secondaryDesc}>
                      Pick any image and jump in
                    </span>
                  </span>
                  <ChevronRight size={16} className={styles.secondaryArrow} aria-hidden />
                </button>
              </nav>
            </section>
          </div>
        </div>
      </div>
      <ChoosePuzzleModal
        isOpen={showChoosePuzzleModal}
        onClose={() => setShowChoosePuzzleModal(false)}
      />
      <PackChoiceModal
        isOpen={showPackChoiceModal}
        onClose={() => setShowPackChoiceModal(false)}
      />
      <FeedbackChoiceModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
      <DailyDifficultyModal
        isOpen={showDailyDifficultyModal}
        onClose={() => setShowDailyDifficultyModal(false)}
      />
      <WhatsNewModal isOpen={showWhatsNewModal} onClose={handleCloseWhatsNew} />
    </>
  );
}
