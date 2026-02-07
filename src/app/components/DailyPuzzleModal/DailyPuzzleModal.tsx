import { Modal } from "@/components/Modal/Modal";
import { Button } from "@/components/Button/Button";
import {
  getDailyPuzzleForDate,
  getTodayDateString,
  startDailyPuzzleWithDifficulty,
  DAILY_DIFFICULTY_GRIDS,
  type DailyDifficulty,
} from "@/daily/dailyPuzzle";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import styles from "./DailyPuzzleModal.module.css";

const DIFFICULTY_OPTIONS: { id: DailyDifficulty; label: string; emoji: string }[] = [
  { id: "easy", label: "Easy", emoji: "🌱" },
  { id: "medium", label: "Medium", emoji: "🌿" },
  { id: "hard", label: "Hard", emoji: "🌳" },
  { id: "expert", label: "Expert", emoji: "⛰️" },
];

type DailyPuzzleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
};

export function DailyPuzzleModal({ isOpen, onClose, onStart }: DailyPuzzleModalProps) {
  const handleStart = (difficulty: DailyDifficulty) => {
    const config = getDailyPuzzleForDate(getTodayDateString());
    if (!config) return;

    const grid = DAILY_DIFFICULTY_GRIDS[difficulty];
    clearPuzzleState();
    startDailyPuzzleWithDifficulty(config.puzzle, grid);
    onClose();
    onStart();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Today's Puzzle" showCloseButton={true}>
      <p className={styles.message}>
        Choose your difficulty. The puzzle stays the same for everyone today — only the
        grid size changes.
      </p>
      <div className={styles.options}>
        {DIFFICULTY_OPTIONS.map((opt) => {
          const grid = DAILY_DIFFICULTY_GRIDS[opt.id];
          return (
            <button
              key={opt.id}
              type="button"
              className={styles.option}
              onClick={() => handleStart(opt.id)}
            >
              <span className={styles.optionEmoji}>{opt.emoji}</span>
              <span className={styles.optionLabel}>{opt.label}</span>
              <span className={styles.optionGrid}>
                {grid.rows}×{grid.cols}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
