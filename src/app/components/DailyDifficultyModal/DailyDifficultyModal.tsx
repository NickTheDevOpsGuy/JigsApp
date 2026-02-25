/**
 * DailyDifficultyModal – Today's Puzzle with difficulty picker (mockup design).
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Puzzle,
  ChevronDown,
  ChevronUp,
  Check,
  Leaf,
  Zap,
  Flame,
  Crown,
  Gem,
  Sparkles,
  Square,
} from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import {
  GRID_OPTIONS,
  dismissFreezeOfferToday,
  getStreakFreezeCount,
  getYesterdayDateString,
  useStreakFreeze,
  wasFreezeOfferDismissedToday,
  wasYesterdayMissed,
  getDailyPreferredDifficultyIndex,
  setDailyPreferredDifficultyIndex,
  clearDailyPreferredDifficulty,
} from "@/daily/dailyPuzzleCore";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import styles from "./DailyDifficultyModal.module.css";

const DIFFICULTY_ICONS = [Leaf, Zap, Flame, Crown, Gem, Sparkles, Square] as const;
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
const MODIFIER_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fog", label: "Fog" },
  { value: "night", label: "Night" },
  { value: "sepia", label: "Sepia" },
] as const;
type VisualModifier = (typeof MODIFIER_OPTIONS)[number]["value"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DailyDifficultyModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 520px)");
  const [dailyModule, setDailyModule] = useState<
    typeof import("@/daily/dailyPuzzle") | null
  >(null);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const preferredIdx = getDailyPreferredDifficultyIndex();
  const [showMore, setShowMore] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(!!preferredIdx);
  const useFreezeBtnRef = useRef<HTMLButtonElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(preferredIdx ?? RECOMMENDED_INDEX);
  const [modifier, setModifier] = useState<VisualModifier>("none");

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
    } else {
      setDailyModule(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showFreezeOffer && useFreezeBtnRef.current) {
      const id = setTimeout(() => useFreezeBtnRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [showFreezeOffer]);

  const puzzle = dailyModule ? dailyModule.getTodayDailyPuzzle() : null;

  if (!isOpen) return null;
  if (!dailyModule)
    return (
      <Modal isOpen onClose={onClose} title="Today's Puzzle" showCloseButton>
        <p className={styles.subtitle}>Loading…</p>
      </Modal>
    );
  if (!puzzle)
    return (
      <Modal isOpen onClose={onClose} title="Today's Puzzle" showCloseButton>
        <p className={styles.subtitle}>No puzzles available.</p>
      </Modal>
    );

  const handleUseFreeze = () => {
    if (useStreakFreeze(getYesterdayDateString())) setFreezeUsed(true);
  };

  const handleStart = () => {
    clearPuzzleState();
    const grid = GRID_OPTIONS[selectedIndex];
    const result = dailyModule.startDailyPuzzle(
      {
        rows: grid.rows,
        cols: grid.cols,
      },
      modifier,
    );
    if (result) {
      if (rememberChoice) {
        setDailyPreferredDifficultyIndex(selectedIndex);
      } else {
        clearDailyPreferredDifficulty();
      }
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
    >
      <div className={styles.headerCustom}>
        <Puzzle size={24} className={styles.headerIcon} />
        <p className={styles.subtitle}>Same puzzle for everyone</p>
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
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      <div className={styles.difficultySection}>
        <div className={isMobile ? styles.difficultyStack : styles.difficultyRow}>
          {primaryOptions.map((opt, i) => (
            <DifficultyCard
              key={`${opt.rows}x${opt.cols}`}
              opt={opt}
              index={i}
              selected={selectedIndex === i}
              recommended={i === RECOMMENDED_INDEX}
              onSelect={() => setSelectedIndex(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.moreOptionsBtn}
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
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
                />
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.modifierSection}>
        <p className={styles.modifierLabel}>Optional Modifier</p>
        <p className={styles.modifierHint}>
          This affects the run and leaderboard bracket.
        </p>
        <div className={styles.modifierList}>
          {MODIFIER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.modifierBtn} ${
                modifier === opt.value ? styles.modifierBtnSelected : ""
              }`}
              onClick={() => setModifier(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.rememberLabel}>
        <input
          type="checkbox"
          checked={rememberChoice}
          onChange={(e) => setRememberChoice(e.target.checked)}
          className={styles.rememberCheckbox}
        />
        <span>Remember my choice</span>
      </label>

      <button type="button" className={styles.startBtn} onClick={handleStart}>
        Start Puzzle
        <span className={styles.startBtnArrow}>→</span>
      </button>
    </Modal>
  );
}

function DifficultyCard({
  opt,
  index,
  selected,
  recommended,
  onSelect,
}: {
  opt: (typeof GRID_OPTIONS)[number];
  index: number;
  selected: boolean;
  recommended?: boolean;
  onSelect: () => void;
}) {
  const Icon = DIFFICULTY_ICONS[index];
  const color = DIFFICULTY_COLORS[index];
  return (
    <button
      type="button"
      className={`${styles.difficultyCard} ${selected ? styles.difficultyCardSelected : ""}`}
      onClick={onSelect}
    >
      {recommended && <span className={styles.recommendedBadge}>Recommended</span>}
      <div className={styles.difficultyCardIcon} style={{ color }}>
        <Icon size={24} />
      </div>
      <span className={styles.difficultyCardLabel}>{opt.label.split(" ")[0]}</span>
      <span className={styles.difficultyCardMeta}>
        {opt.rows}×{opt.cols} · {opt.pieces} pieces
      </span>
      {selected && <Check size={18} className={styles.difficultyCardCheck} />}
    </button>
  );
}
