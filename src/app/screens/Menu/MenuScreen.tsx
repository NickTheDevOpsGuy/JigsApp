/**
 * MenuScreen – full-bleed mobile home. Fills the screen, no floating card.
 * Primary: Play Today. Secondary: Packs + Quick Play as rows. Tertiary: Feedback link.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ImagePlus, ChevronRight, Flame, Snowflake, Trophy } from "lucide-react";
import { useHomeData } from "./hooks/useHomeData";
import type { WeekDot } from "./hooks/useHomeData";
import { ChoosePuzzleModal } from "@/components/ChoosePuzzleModal";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { PackChoiceModal } from "@/components/PackChoiceModal";
import { FeedbackChoiceModal } from "@/components/FeedbackChoiceModal";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { loadPlayScreenModule } from "@/screens/Play/loadPlayScreen";
import { loadStatsScreenModule } from "@/screens/routeLoaders";
import styles from "./MenuScreen.module.css";

export function MenuScreen() {
  const navigate = useNavigate();
  const [showDailyDifficultyModal, setShowDailyDifficultyModal] = useState(false);
  const [showChoosePuzzleModal, setShowChoosePuzzleModal] = useState(false);
  const [showPackChoiceModal, setShowPackChoiceModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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

  const handlePacks = () => {
    void loadPlayScreenModule();
    setShowPackChoiceModal(true);
  };
  const handleStats = () => {
    void loadStatsScreenModule();
    navigate("/stats");
  };

  const handleFeedback = () => setShowFeedbackModal(true);

  return (
    <>
      <div className={styles.canvas}>
        <div className={styles.page}>
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
            {/* Daily puzzle label */}
            <div className={styles.puzzleLabel}>
              <span className={styles.puzzleLabelTag}>TODAY'S PUZZLE</span>
              <span className={styles.puzzleLabelNum}>Daily #{puzzleNumber}</span>
            </div>

            {dailySpotlight && (
              <p className={styles.dailySpotlightLine} title={dailySpotlight.description}>
                {dailySpotlight.line}
              </p>
            )}
            <p className={styles.dailySpotlightHint}>
              Each day highlights a different category with a featured puzzle to encourage
              variety and return visits.
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
                {weekDots.map(({ day, done, isToday, isFuture }: WeekDot, i: number) => {
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
                })}
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
                  <span className={styles.secondaryDesc}>Hand-picked themed puzzles</span>
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
                  <span className={styles.secondaryDesc}>Pick any image and jump in</span>
                </span>
                <ChevronRight size={16} className={styles.secondaryArrow} aria-hidden />
              </button>
            </nav>
          </div>
        </div>
      </div>
      <ChoosePuzzleModal
        isOpen={showChoosePuzzleModal}
        onClose={() => setShowChoosePuzzleModal(false)}
      />
      <DailyDifficultyModal
        isOpen={showDailyDifficultyModal}
        onClose={() => setShowDailyDifficultyModal(false)}
      />
      <PackChoiceModal
        isOpen={showPackChoiceModal}
        onClose={() => setShowPackChoiceModal(false)}
      />
      <FeedbackChoiceModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
}
