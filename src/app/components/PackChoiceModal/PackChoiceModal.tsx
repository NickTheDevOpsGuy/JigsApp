/**
 * PackChoiceModal – Puzzle Packs as a popup modal with steps: Pack → Puzzle → Difficulty.
 * Same pattern as Today's Puzzle: modal with steps, then navigate to /play.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Check, ChevronLeft, ChevronRight } from "lucide-react";
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

  const packScrollRef = useRef<HTMLDivElement>(null);
  const puzzleScrollRef = useRef<HTMLDivElement>(null);
  const [packScrollProgress, setPackScrollProgress] = useState(0);
  const [canScrollPackLeft, setCanScrollPackLeft] = useState(false);
  const [canScrollPackRight, setCanScrollPackRight] = useState(false);
  const [puzzleScrollProgress, setPuzzleScrollProgress] = useState(0);
  const [canScrollPuzzleLeft, setCanScrollPuzzleLeft] = useState(false);
  const [canScrollPuzzleRight, setCanScrollPuzzleRight] = useState(false);

  const updatePackScrollState = useCallback(() => {
    const el = packScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 1;
    setCanScrollPackLeft(maxScroll > threshold && left > threshold);
    setCanScrollPackRight(maxScroll > threshold && left < maxScroll - threshold);
    setPackScrollProgress(maxScroll <= 0 ? 0 : left / maxScroll);
  }, []);

  const updatePuzzleScrollState = useCallback(() => {
    const el = puzzleScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 1;
    setCanScrollPuzzleLeft(maxScroll > threshold && left > threshold);
    setCanScrollPuzzleRight(maxScroll > threshold && left < maxScroll - threshold);
    setPuzzleScrollProgress(maxScroll <= 0 ? 0 : left / maxScroll);
  }, []);

  const scrollPackBy = useCallback((direction: 1 | -1) => {
    const el = packScrollRef.current;
    if (!el) return;
    const rail = el.firstElementChild as HTMLElement | null;
    const first = rail?.firstElementChild as HTMLElement | null;
    const cardWidth = first?.offsetWidth ?? 92;
    const gap = 8;
    const stepPx = Math.max(90, cardWidth + gap);
    const step = stepPx * direction;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + step));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  const scrollPuzzleBy = useCallback((direction: 1 | -1) => {
    const el = puzzleScrollRef.current;
    if (!el) return;
    const rail = el.firstElementChild as HTMLElement | null;
    const first = rail?.firstElementChild as HTMLElement | null;
    const cardWidth = first?.offsetWidth ?? 88;
    const gap = 8;
    const stepPx = Math.max(85, cardWidth + gap);
    const step = stepPx * direction;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + step));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPacksData().then(setPacksData);
      setStep("pack");
      setSelectedPack(null);
      setSelectedPuzzle(null);
      setDifficultyIndex(RECOMMENDED_INDEX);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== "pack" || !packsData) return;
    const el = packScrollRef.current;
    const run = () => {
      requestAnimationFrame(() => {
        updatePackScrollState();
      });
    };
    run();
    const t0 = setTimeout(updatePackScrollState, 0);
    const t1 = setTimeout(updatePackScrollState, 150);
    const t2 = setTimeout(updatePackScrollState, 400);
    const t3 = setTimeout(updatePackScrollState, 600);
    const t4 = setTimeout(updatePackScrollState, 900);
    if (el) {
      el.addEventListener("scroll", updatePackScrollState);
      const ro = new ResizeObserver(updatePackScrollState);
      ro.observe(el);
      const inner = el.firstElementChild;
      if (inner) ro.observe(inner);
      return () => {
        el.removeEventListener("scroll", updatePackScrollState);
        ro.disconnect();
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [step, packsData, updatePackScrollState]);

  useEffect(() => {
    if (step !== "puzzle" || !selectedPack) return;
    const run = () => {
      requestAnimationFrame(() => {
        updatePuzzleScrollState();
      });
    };
    run();
    const t0 = setTimeout(updatePuzzleScrollState, 0);
    const t1 = setTimeout(updatePuzzleScrollState, 150);
    const t2 = setTimeout(updatePuzzleScrollState, 400);
    const t3 = setTimeout(updatePuzzleScrollState, 600);
    const t4 = setTimeout(updatePuzzleScrollState, 900);
    const el = puzzleScrollRef.current;
    if (el) {
      el.addEventListener("scroll", updatePuzzleScrollState);
      const ro = new ResizeObserver(updatePuzzleScrollState);
      ro.observe(el);
      const inner = el.firstElementChild;
      if (inner) ro.observe(inner);
      return () => {
        el.removeEventListener("scroll", updatePuzzleScrollState);
        ro.disconnect();
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [step, selectedPack, packsData, updatePuzzleScrollState]);

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

  const goToStep = (target: Step) => {
    if (target === "pack") {
      setStep("pack");
      setSelectedPack(null);
      setSelectedPuzzle(null);
    } else if (target === "puzzle" && selectedPack) {
      setStep("puzzle");
    } else if (target === "difficulty" && selectedPuzzle) {
      setStep("difficulty");
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={title} showCloseButton>
      <div className={styles.stepIndicator} role="navigation" aria-label="Steps">
        <button
          type="button"
          className={`${styles.stepLink} ${step === "pack" ? styles.stepCurrent : ""}`}
          onClick={() => goToStep("pack")}
          aria-current={step === "pack" ? "step" : undefined}
          title="Go to pack selection"
        >
          Pack
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${step === "puzzle" ? styles.stepCurrent : ""}`}
          onClick={() => goToStep("puzzle")}
          disabled={!selectedPack}
          aria-current={step === "puzzle" ? "step" : undefined}
          title={selectedPack ? "Go to puzzle selection" : "Select a pack first"}
        >
          Puzzle
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${step === "difficulty" ? styles.stepCurrent : ""}`}
          onClick={() => goToStep("difficulty")}
          disabled={!selectedPuzzle}
          aria-current={step === "difficulty" ? "step" : undefined}
          title={selectedPuzzle ? "Go to difficulty selection" : "Select a puzzle first"}
        >
          Difficulty
        </button>
      </div>

      {step === "pack" && (
        <div className={styles.stepBody}>
          <p className={styles.railLabel}>Choose a pack</p>
          {!packsData ? (
            <p className={styles.loading}>Loading…</p>
          ) : (
            <>
              <div className={styles.railScrollWrap}>
                <button
                  type="button"
                  className={styles.railScrollBtn}
                  onClick={() => scrollPackBy(-1)}
                  disabled={!canScrollPackLeft}
                  aria-label="Scroll left"
                  title="Scroll left"
                >
                  <ChevronLeft size={22} aria-hidden />
                </button>
                <div
                  ref={packScrollRef}
                  className={styles.railScroller}
                  role="list"
                  aria-label="Pack list"
                >
                  <div className={styles.packRail}>
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
                          title={`Select pack: ${pack.name}`}
                          aria-label={`Select pack: ${pack.name}`}
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
                              <span className={styles.packEmoji}>
                                {meta?.emoji ?? "🧩"}
                              </span>
                            )}
                          </div>
                          <span className={styles.packName}>{pack.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.railScrollBtn}
                  onClick={() => scrollPackBy(1)}
                  disabled={!canScrollPackRight}
                  aria-label="Scroll right"
                  title="Scroll right"
                >
                  <ChevronRight size={22} aria-hidden />
                </button>
              </div>
              <div
                className={styles.railScrollBar}
                role="progressbar"
                aria-valuenow={Math.round(packScrollProgress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Scroll position"
                title="Scroll position"
              >
                <div
                  className={styles.railScrollBarFill}
                  style={{ width: `${packScrollProgress * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {step === "puzzle" && selectedPack && (
        <div className={styles.stepBody}>
          <p className={styles.railLabel}>Choose a puzzle</p>
          <div className={styles.railScrollWrap}>
            <button
              type="button"
              className={styles.railScrollBtn}
              onClick={() => scrollPuzzleBy(-1)}
              disabled={!canScrollPuzzleLeft}
              aria-label="Scroll left"
              title="Scroll left"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <div
              ref={puzzleScrollRef}
              className={styles.railScroller}
              role="list"
              aria-label="Puzzle list"
            >
              <div className={styles.puzzleRail}>
                {puzzles.map((puzzle) => {
                  const isDone = completed.has(puzzle.id);
                  return (
                    <button
                      key={puzzle.id}
                      type="button"
                      className={`${styles.puzzleCard} ${selectedPuzzle?.id === puzzle.id ? styles.puzzleCardSelected : ""}`}
                      onClick={() => setSelectedPuzzle(puzzle)}
                      title={
                        isDone
                          ? `Select: ${puzzle.name} (completed)`
                          : `Select: ${puzzle.name}`
                      }
                      aria-label={isDone ? `${puzzle.name} (completed)` : puzzle.name}
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
            </div>
            <button
              type="button"
              className={styles.railScrollBtn}
              onClick={() => scrollPuzzleBy(1)}
              disabled={!canScrollPuzzleRight}
              aria-label="Scroll right"
              title="Scroll right"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
          </div>
          <div
            className={styles.railScrollBar}
            role="progressbar"
            aria-valuenow={Math.round(puzzleScrollProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Scroll position"
            title="Scroll position"
          >
            <div
              className={styles.railScrollBarFill}
              style={{ width: `${puzzleScrollProgress * 100}%` }}
            />
          </div>
          <button
            type="button"
            className={styles.nextBtn}
            disabled={!selectedPuzzle}
            onClick={() => setStep("difficulty")}
            title="Continue to difficulty selection"
            aria-label="Continue to difficulty selection"
          >
            Next: Difficulty
          </button>
        </div>
      )}

      {step === "difficulty" && selectedPuzzle && (
        <div className={styles.stepBody}>
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
                  title={`Select ${name}: ${pieces} pieces`}
                  aria-label={`${name}, ${pieces} pieces`}
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
          <button
            type="button"
            className={styles.startBtn}
            onClick={handleStart}
            title="Start puzzle with selected options"
            aria-label="Start puzzle"
          >
            Start Puzzle →
          </button>
        </div>
      )}
    </Modal>
  );
}
