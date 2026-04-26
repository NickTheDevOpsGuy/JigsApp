/**
 * DailyDifficultyModal – Today's Puzzle with difficulty picker (mockup design).
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import {
  GRID_OPTIONS,
  dismissFreezeOfferToday,
  getDailyPreferredModifier,
  getStreakFreezeCount,
  getYesterdayDateString,
  useStreakFreeze,
  wasFreezeOfferDismissedToday,
  wasYesterdayMissed,
  getDailyPreferredDifficultyIndex,
  setDailyPreferredDifficultyIndex,
} from "@/daily/dailyPuzzleCore";
import { setCurrentPuzzleId } from "@/data/packs/packCompletion";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { loadPlayScreenModule } from "@/screens/Play/loadPlayScreen";
import styles from "./DailyDifficultyModal.module.css";

const DIFFICULTY_COLORS = [
  "var(--color-easy, #22c55e)",
  "var(--color-medium, #3b82f6)",
  "var(--color-hard, #f97316)",
  "var(--color-expert, #ef4444)",
  "var(--color-master, #a855f7)",
  "var(--color-legend, #eab308)",
  "var(--color-extreme, #64748b)",
] as const;

const PRIMARY_COUNT = 3; // Easy, Medium, Hard
const RECOMMENDED_INDEX = 1; // Medium

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DailyDifficultyModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [dailyModule, setDailyModule] = useState<
    typeof import("@/daily/dailyPuzzle") | null
  >(null);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const preferredIdx = getDailyPreferredDifficultyIndex();
  const [showMore, setShowMore] = useState(false);
  const useFreezeBtnRef = useRef<HTMLButtonElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(preferredIdx ?? RECOMMENDED_INDEX);

  const showFreezeOffer =
    wasYesterdayMissed() &&
    getStreakFreezeCount() > 0 &&
    !freezeUsed &&
    !wasFreezeOfferDismissedToday();

  useEffect(() => {
    if (isOpen) {
      import("@/daily/dailyPuzzle").then(setDailyModule);
      const idx = getDailyPreferredDifficultyIndex();
      setSelectedIndex(idx ?? RECOMMENDED_INDEX);
      setShowMore(false);
    } else {
      setDailyModule(null);
      setShowMore(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showFreezeOffer && useFreezeBtnRef.current) {
      const id = setTimeout(() => useFreezeBtnRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [showFreezeOffer]);

  const puzzle = dailyModule ? dailyModule.getTodayDailyPuzzle() : null;
  const spotlight = dailyModule ? dailyModule.getTodayDailySpotlight() : null;
  const archiveItems =
    dailyModule && "getDailyArchiveItems" in dailyModule
      ? dailyModule.getDailyArchiveItems(5)
      : [];

  if (!isOpen) return null;
  if (!dailyModule)
    return (
      <Modal
        isOpen
        onClose={onClose}
        title="Today's Puzzle"
        showCloseButton
        variant="choosePuzzle"
      >
        <p className={styles.subtitle}>Loading…</p>
      </Modal>
    );
  if (!puzzle)
    return (
      <Modal
        isOpen
        onClose={onClose}
        title="Today's Puzzle"
        showCloseButton
        variant="choosePuzzle"
      >
        <p className={styles.subtitle}>No puzzles available.</p>
      </Modal>
    );

  const handleUseFreeze = () => {
    if (useStreakFreeze(getYesterdayDateString())) setFreezeUsed(true);
  };

  const handleStart = () => {
    clearPuzzleState();
    setCurrentPuzzleId(null);
    const grid = GRID_OPTIONS[selectedIndex] ?? GRID_OPTIONS[RECOMMENDED_INDEX];
    const modifier = getDailyPreferredModifier();
    const result = dailyModule.startDailyPuzzle(
      {
        rows: grid.rows,
        cols: grid.cols,
      },
      modifier,
    );
    if (result) {
      setDailyPreferredDifficultyIndex(selectedIndex);
      void loadPlayScreenModule();
      onClose();
      navigate("/play");
    }
  };

  const handleStartArchive = (dateStr: string) => {
    clearPuzzleState();
    setCurrentPuzzleId(null);
    const grid = GRID_OPTIONS[selectedIndex] ?? GRID_OPTIONS[RECOMMENDED_INDEX];
    const result = dailyModule.startDailyArchivePuzzle(dateStr, {
      rows: grid.rows,
      cols: grid.cols,
    });
    if (result) {
      void loadPlayScreenModule();
      onClose();
      navigate("/play");
    }
  };

  const primaryOptions = GRID_OPTIONS.slice(0, PRIMARY_COUNT);
  const moreOptions = GRID_OPTIONS.slice(PRIMARY_COUNT);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Today's Puzzle"
      showCloseButton={true}
      variant="choosePuzzle"
    >
      <div className={styles.headerCustom}>
        <Puzzle size={24} className={styles.headerIcon} />
        <p className={styles.subtitle}>
          {spotlight ? (
            <>
              <span className={styles.spotlightLead}>
                {spotlight.categoryEmoji} {spotlight.categoryName} ·{" "}
                {spotlight.puzzleName}
              </span>
              <span className={styles.spotlightSub}>Same puzzle for everyone today</span>
            </>
          ) : (
            "Same puzzle for everyone"
          )}
        </p>
      </div>

      <div className={styles.puzzleImageWrap}>
        <img src={puzzle.fullImage} alt="Today's puzzle" className={styles.puzzleImage} />
      </div>

      {showFreezeOffer && (
        <div
          className={styles.freezeOffer}
          role="alert"
          aria-labelledby="streak-freeze-label"
          aria-describedby="streak-freeze-hint"
        >
          <span id="streak-freeze-label">Missed yesterday? Use your freeze.</span>
          <span id="streak-freeze-hint" className={styles.freezeHint}>
            1 per week
          </span>
          <div className={styles.freezeActions}>
            <button
              ref={useFreezeBtnRef}
              type="button"
              className={styles.freezeBtn}
              onClick={handleUseFreeze}
              aria-label="Use streak freeze for yesterday"
              title="Use streak freeze"
            >
              🧊 Use Freeze
            </button>
            <button
              type="button"
              className={styles.freezeSkip}
              onClick={() => {
                setFreezeUsed(true);
                dismissFreezeOfferToday();
              }}
              aria-label="Decline streak freeze"
              title="No thanks"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      <div className={styles.difficultySection}>
        <div className={styles.difficultyStack}>
          {primaryOptions.map((opt, i) => (
            <DifficultyCard
              key={`${opt.rows}x${opt.cols}`}
              opt={opt}
              index={i}
              selected={selectedIndex === i}
              onSelect={() => setSelectedIndex(i)}
              isRecommended={i === RECOMMENDED_INDEX}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.moreOptionsBtn}
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          aria-label={showMore ? "Hide more options" : "More options"}
          title={showMore ? "Hide more options" : "More options"}
        >
          More Options
          {showMore ? (
            <ChevronUp size={18} className={styles.moreOptionsIcon} />
          ) : (
            <ChevronDown size={18} className={styles.moreOptionsIcon} />
          )}
        </button>

        {showMore && (
          <div className={styles.moreOptionsList}>
            {moreOptions.map((opt, i) => {
              const idx = PRIMARY_COUNT + i;
              return (
                <DifficultyCard
                  key={`${opt.rows}x${opt.cols}`}
                  opt={opt}
                  index={idx}
                  selected={selectedIndex === idx}
                  onSelect={() => setSelectedIndex(idx)}
                  isRecommended={false}
                />
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.startBtn}
        onClick={handleStart}
        aria-label="Start puzzle"
        title="Start puzzle"
      >
        Start Puzzle
        <span className={styles.startBtnArrow}>→</span>
      </button>

      {archiveItems.length > 0 && (
        <section className={styles.archiveSection} aria-label="Daily archive">
          <div className={styles.archiveHeader}>
            <span className={styles.archiveTitle}>Daily archive</span>
            <span className={styles.archiveHint}>Past dailies do not affect streaks</span>
          </div>
          <div className={styles.archiveRail}>
            {archiveItems.map((item) => (
              <button
                key={item.dateStr}
                type="button"
                className={styles.archiveItem}
                onClick={() => handleStartArchive(item.dateStr)}
                aria-label={`Play archived daily ${item.dateStr}`}
                title={`Play archived daily ${item.dateStr}`}
              >
                <img
                  src={item.puzzle.fullImage}
                  alt=""
                  className={styles.archiveThumb}
                  aria-hidden
                />
                <span className={styles.archiveDate}>{item.dateStr.slice(5)}</span>
                {item.completed && <span className={styles.archiveDone}>Done</span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </Modal>
  );
}

/** Display label: difficulty name + piece count only (no grid size like "3×3"). */
function getDifficultyDisplayLabel(
  opt: (typeof GRID_OPTIONS)[number],
  isRecommended: boolean,
): string {
  const name = opt.label.split(/\s/)[0] ?? opt.label;
  const recommended = isRecommended ? " (Recommended)" : "";
  return `${name} - ${opt.pieces} pieces${recommended}`;
}

function DifficultyCard({
  opt,
  index,
  selected,
  onSelect,
  isRecommended,
}: {
  opt: (typeof GRID_OPTIONS)[number];
  index: number;
  selected: boolean;
  onSelect: () => void;
  isRecommended: boolean;
}) {
  const color = DIFFICULTY_COLORS[index];
  const displayLabel = getDifficultyDisplayLabel(opt, isRecommended);
  return (
    <button
      type="button"
      className={`${styles.difficultyCard} ${selected ? styles.difficultyCardSelected : ""}`}
      onClick={onSelect}
      style={{ "--difficulty-accent": color } as React.CSSProperties}
      aria-label={displayLabel}
      title={displayLabel}
    >
      <span className={styles.difficultyCardLine}>
        <span className={styles.difficultyCardLabel}>{displayLabel}</span>
      </span>
      {selected && <Check size={18} className={styles.difficultyCardCheck} />}
    </button>
  );
}
