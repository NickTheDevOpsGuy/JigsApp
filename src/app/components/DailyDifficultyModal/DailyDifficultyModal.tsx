/**
 * DailyDifficultyModal – shows today's daily puzzle, grid picker, and launch action.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Modal } from "@/components/Modal/Modal";
import { Dropdown } from "@/components/DropDown/Dropdown";
import {
  GRID_OPTIONS,
  dismissFreezeOfferToday,
  getStreakFreezeCount,
  getYesterdayDateString,
  useStreakFreeze,
  wasFreezeOfferDismissedToday,
  wasYesterdayMissed,
} from "@/daily/dailyPuzzleCore";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import styles from "./DailyDifficultyModal.module.css";

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const useFreezeBtnRef = useRef<HTMLButtonElement>(null);
  const showFreezeOffer =
    wasYesterdayMissed() &&
    getStreakFreezeCount() > 0 &&
    !freezeUsed &&
    !wasFreezeOfferDismissedToday();

  useEffect(() => {
    if (isOpen) {
      import("@/daily/dailyPuzzle").then(setDailyModule);
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

  const handleStart = (grid: { rows: number; cols: number }) => {
    clearPuzzleState();
    const result = dailyModule.startDailyPuzzle(grid);
    if (result) {
      onClose();
      navigate("/play");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🧩 Today's Puzzle"
      showCloseButton={true}
    >
      {showFreezeOffer && (
        <div
          className={styles.freezeOffer}
          role="alert"
          aria-labelledby="streak-freeze-label"
          aria-describedby="streak-freeze-hint"
        >
          <span id="streak-freeze-label">
            You missed yesterday. Use your streak freeze to protect your streak?
          </span>
          <span id="streak-freeze-hint" className={styles.freezeHint}>
            One per week — your streak won&apos;t break.
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
      <p className={styles.subtitle}>Same puzzle for everyone — pick your difficulty</p>
      {isMobile ? (
        <div className={styles.difficultyMobile}>
          <Dropdown
            label="Difficulty"
            compact
            fullWidth
            value={selectedIndex}
            onChange={(val) => setSelectedIndex(Number(val))}
            options={GRID_OPTIONS.map((opt, i) => ({
              value: i,
              label: opt.labelCompact,
            }))}
          />
          <button
            type="button"
            className={styles.startBtn}
            onClick={() =>
              handleStart({
                rows: GRID_OPTIONS[selectedIndex].rows,
                cols: GRID_OPTIONS[selectedIndex].cols,
              })
            }
          >
            Start daily puzzle
          </button>
        </div>
      ) : (
        <div className={styles.difficulties}>
          {GRID_OPTIONS.map((opt) => (
            <button
              key={`${opt.rows}x${opt.cols}`}
              type="button"
              className={styles.difficultyBtn}
              onClick={() => handleStart({ rows: opt.rows, cols: opt.cols })}
            >
              <span className={styles.difficultyLabel}>{opt.label}</span>
              <span className={styles.difficultyPieces}>
                {opt.rows}×{opt.cols} · {opt.pieces} pieces
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
