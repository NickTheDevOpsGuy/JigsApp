import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS, getTodayDailyPuzzle, startDailyPuzzle } from "@/daily/dailyPuzzle";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import styles from "./DailyDifficultyModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DailyDifficultyModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const puzzle = getTodayDailyPuzzle();

  if (!puzzle) return null;

  const handleStart = (grid: { rows: number; cols: number }) => {
    clearPuzzleState();
    const result = startDailyPuzzle(grid);
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
