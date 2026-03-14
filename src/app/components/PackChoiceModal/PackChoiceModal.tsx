/**
 * PackChoiceModal – Puzzle Packs as a popup modal with steps: Pack → Puzzle → Difficulty.
 * Same pattern as Today's Puzzle: modal with steps, then navigate to /play.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Check, ChevronLeft } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { PACK_METADATA } from "@/data/packs/packMetadata";
import { loadPacksData } from "@/data/packs/loadPacksData";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import type { PuzzlePack } from "@/data/packs/puzzlePacks";
import { getCompletedPuzzleIds, setCurrentPuzzleId } from "@/data/packs/packCompletion";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import styles from "./PackChoiceModal.module.css";

const PRIMARY_DIFFICULTIES = GRID_OPTIONS.slice(0, 4);
const RECOMMENDED_INDEX = 1;

type Step = "pack" | "puzzle" | "difficulty";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function PackChoiceModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("pack");
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);
  const [selectedPack, setSelectedPack] = useState<PuzzlePack | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(RECOMMENDED_INDEX);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadPacksData().then(setPacksData);
      setStep("pack");
      setSelectedPack(null);
      setSelectedPuzzle(null);
      setDifficultyIndex(RECOMMENDED_INDEX);
    }
  }, [isOpen]);

  const puzzles: SamplePuzzle[] =
    selectedPack && packsData ? packsData.getPuzzlesForPack(selectedPack) : [];
  const completed = getCompletedPuzzleIds();

  const handleStart = () => {
    if (!selectedPuzzle || !packsData) return;
    const grid =
      PRIMARY_DIFFICULTIES[difficultyIndex] ?? PRIMARY_DIFFICULTIES[RECOMMENDED_INDEX];
    clearPuzzleState();
    safeLocalStorage.setItem(STORAGE_KEY, selectedPuzzle.fullImage);
    safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
    setCurrentPuzzleId(selectedPuzzle.id);
    safeLocalStorage.removeItem("phuzzle:dailyDate");
    onClose();
    navigate("/play");
  };

  if (!isOpen) return null;

  const title =
    step === "pack"
      ? "Puzzle Packs"
      : step === "puzzle"
        ? (selectedPack?.name ?? "Choose puzzle")
        : "Choose difficulty";

  return (
    <Modal isOpen onClose={onClose} title={title} showCloseButton>
      <div className={styles.stepIndicator}>
        <span className={step === "pack" ? styles.stepCurrent : ""}>Pack</span>
        <span className={styles.stepSep}>→</span>
        <span className={step === "puzzle" ? styles.stepCurrent : ""}>Puzzle</span>
        <span className={styles.stepSep}>→</span>
        <span className={step === "difficulty" ? styles.stepCurrent : ""}>
          Difficulty
        </span>
      </div>

      {step === "pack" && (
        <div className={styles.stepBody}>
          <p className={styles.subtitle}>Choose a pack</p>
          {!packsData ? (
            <p className={styles.loading}>Loading…</p>
          ) : (
            <div className={styles.packList}>
              {packsData.PUZZLE_PACKS.map((pack) => {
                const meta = PACK_METADATA.find((p) => p.id === pack.id);
                const puzzleList = packsData.getPuzzlesForPack(pack);
                const hero = puzzleList[0];
                return (
                  <button
                    key={pack.id}
                    type="button"
                    className={styles.packCard}
                    onClick={() => {
                      setSelectedPack(pack);
                      setStep("puzzle");
                    }}
                  >
                    <div className={styles.packThumb}>
                      {hero && !imgError[pack.id] ? (
                        <img
                          src={hero.thumbnail}
                          alt=""
                          onError={() =>
                            setImgError((prev) => ({ ...prev, [pack.id]: true }))
                          }
                        />
                      ) : (
                        <span className={styles.packEmoji}>{meta?.emoji ?? "🧩"}</span>
                      )}
                    </div>
                    <span className={styles.packName}>{pack.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "puzzle" && selectedPack && (
        <div className={styles.stepBody}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => {
              setSelectedPack(null);
              setStep("pack");
            }}
            aria-label="Back to packs"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <p className={styles.subtitle}>Choose a puzzle</p>
          <div className={styles.puzzleList}>
            {puzzles.map((puzzle) => {
              const isDone = completed.has(puzzle.id);
              return (
                <button
                  key={puzzle.id}
                  type="button"
                  className={`${styles.puzzleCard} ${selectedPuzzle?.id === puzzle.id ? styles.puzzleCardSelected : ""}`}
                  onClick={() => setSelectedPuzzle(puzzle)}
                >
                  <div className={styles.puzzleThumb}>
                    {imgError[puzzle.id] ? (
                      <span>?</span>
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
                    {isDone && (
                      <span className={styles.completedBadge} aria-hidden>
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <span className={styles.puzzleName}>{puzzle.name}</span>
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
        </div>
      )}

      {step === "difficulty" && selectedPuzzle && (
        <div className={styles.stepBody}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setStep("puzzle")}
            aria-label="Back to puzzles"
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
