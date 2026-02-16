/**
 * DailyDifficultyModal – shows today's daily puzzle, grid picker, and launch action.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import styles from "./DailyDifficultyModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DailyDifficultyModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [dailyModule, setDailyModule] = useState<
    typeof import("@/daily/dailyPuzzle") | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      import("@/daily/dailyPuzzle").then(setDailyModule);
    } else {
      setDailyModule(null);
    }
  }, [isOpen]);

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
      title="Today's Puzzle"
      showCloseButton={true}
    >
      <p className={styles.subtitle}>Same puzzle for everyone — pick your difficulty</p>
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
    </Modal>
  );
}
