/**
 * ChoosePhotoModal – Choose image from gallery as a popup modal with steps: Image → Difficulty.
 * Same pattern as Today's Puzzle. Custom upload/URL/camera remain on /new for now.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Check, ChevronLeft } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { SAMPLE_PUZZLES } from "@/data/packs/samplePuzzles";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import styles from "./ChoosePhotoModal.module.css";

const PRIMARY_DIFFICULTIES = GRID_OPTIONS.slice(0, 4);
const RECOMMENDED_INDEX = 1;

type Step = "image" | "difficulty";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ChoosePhotoModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("image");
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(RECOMMENDED_INDEX);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setStep("image");
      setSelectedPuzzle(null);
      setDifficultyIndex(RECOMMENDED_INDEX);
    }
  }, [isOpen]);

  const handleStart = () => {
    if (!selectedPuzzle) return;
    const grid =
      PRIMARY_DIFFICULTIES[difficultyIndex] ?? PRIMARY_DIFFICULTIES[RECOMMENDED_INDEX];
    clearPuzzleState();
    safeLocalStorage.setItem(STORAGE_KEY, selectedPuzzle.fullImage);
    safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
    safeLocalStorage.removeItem("phuzzle:dailyDate");
    onClose();
    navigate("/play");
  };

  if (!isOpen) return null;

  const title = step === "image" ? "Choose Photo" : "Choose difficulty";

  return (
    <Modal isOpen onClose={onClose} title={title} showCloseButton>
      <div className={styles.stepIndicator}>
        <span className={step === "image" ? styles.stepCurrent : ""}>Image</span>
        <span className={styles.stepSep}>→</span>
        <span className={step === "difficulty" ? styles.stepCurrent : ""}>
          Difficulty
        </span>
      </div>

      {step === "image" && (
        <div className={styles.stepBody}>
          <p className={styles.subtitle}>Pick from the gallery.</p>
          <div className={styles.galleryGrid}>
            {SAMPLE_PUZZLES.slice(0, 24).map((puzzle) => {
              return (
                <button
                  key={puzzle.id}
                  type="button"
                  className={`${styles.galleryCard} ${selectedPuzzle?.id === puzzle.id ? styles.galleryCardSelected : ""}`}
                  onClick={() => setSelectedPuzzle(puzzle)}
                >
                  {imgError[puzzle.id] ? (
                    <span className={styles.placeholder}>?</span>
                  ) : (
                    <img
                      src={puzzle.thumbnail}
                      alt=""
                      onError={() =>
                        setImgError((prev) => ({
                          ...prev,
                          [puzzle.id]: true,
                        }))
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.nextBtn}
            disabled={!selectedPuzzle}
            onClick={() => setStep("difficulty")}
          >
            Next: Difficulty
          </button>
          <p className={styles.uploadHint}>
            Or{" "}
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                onClose();
                navigate("/new");
              }}
            >
              upload your own image
            </button>
          </p>
        </div>
      )}

      {step === "difficulty" && selectedPuzzle && (
        <div className={styles.stepBody}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setStep("image")}
            aria-label="Back to gallery"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <div className={styles.previewWrap}>
            <img
              src={selectedPuzzle.fullImage}
              alt={selectedPuzzle.name}
              className={styles.previewImg}
            />
          </div>
          <div className={styles.difficultyStack}>
            {PRIMARY_DIFFICULTIES.map((opt, i) => {
              const name =
                ["Easy", "Medium", "Hard", "Expert"][i] ?? opt.label.split(" ")[0];
              const pieces = opt.rows * opt.cols;
              const selected = difficultyIndex === i;
              return (
                <button
                  key={`${opt.rows}x${opt.cols}`}
                  type="button"
                  className={`${styles.difficultyCard} ${selected ? styles.difficultyCardSelected : ""}`}
                  onClick={() => setDifficultyIndex(i)}
                >
                  <Puzzle size={16} />
                  <span>
                    {name} – {pieces} pieces
                  </span>
                  {selected && <Check size={16} className={styles.difficultyCheck} />}
                </button>
              );
            })}
          </div>
          <button type="button" className={styles.startBtn} onClick={handleStart}>
            Start Puzzle →
          </button>
        </div>
      )}
    </Modal>
  );
}
