/**
 * PackChoiceModal – 2-step flow with breadcrumbs.
 * Step 1: Choose Pack (cover, name, count, progress).
 * Step 2: Choose Puzzle (thumbnail rail + difficulty + Start on the same screen).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Puzzle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { loadPacksData } from "@/data/packs/loadPacksData";
import {
  getCompletedPuzzleIds,
  getPackProgress,
  setCurrentPuzzleId,
} from "@/data/packs/packCompletion";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { loadPlayScreenModule } from "@/screens/Play/loadPlayScreen";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import type { PuzzlePack } from "@/data/packs/puzzlePacks";
import styles from "@/components/ChoosePuzzleModal/ChoosePuzzleModal.module.css";
import localStyles from "./PackChoiceModal.module.css";

const PRIMARY_DIFFICULTIES = GRID_OPTIONS.slice(0, 4);
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard", "Expert"] as const;
const RECOMMENDED_INDEX = 1;

type Step = "pack" | "puzzle";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function PackChoiceModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>("pack");
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);
  const [selectedPack, setSelectedPack] = useState<PuzzlePack | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(RECOMMENDED_INDEX);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const packs = packsData?.PUZZLE_PACKS ?? [];
  const filteredPacks = packs;
  const puzzles: SamplePuzzle[] =
    selectedPack && packsData ? packsData.getPuzzlesForPack(selectedPack) : [];
  const completed = getCompletedPuzzleIds();

  const packScrollRef = useRef<HTMLDivElement>(null);
  const puzzleScrollRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const [canScrollPackLeft, setCanScrollPackLeft] = useState(false);
  const [canScrollPackRight, setCanScrollPackRight] = useState(false);
  const [canScrollPuzzleLeft, setCanScrollPuzzleLeft] = useState(false);
  const [canScrollPuzzleRight, setCanScrollPuzzleRight] = useState(false);

  const getScrollMetrics = useCallback((el: HTMLDivElement) => {
    const grid = el.firstElementChild as HTMLElement | null;
    const firstTile = grid?.firstElementChild as HTMLElement | null;
    if (!firstTile) return null;
    const styles = window.getComputedStyle(grid ?? el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const cardWidth = firstTile.getBoundingClientRect().width;
    const step = Math.max(1, cardWidth + gap);
    const visibleCount = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    const maxIndex = Math.max(0, (grid?.children.length ?? 1) - visibleCount);
    return { step, visibleCount, maxIndex };
  }, []);

  const updatePackScrollState = useCallback(() => {
    const el = packScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 2;
    setCanScrollPackLeft(maxScroll > threshold && left > threshold);
    setCanScrollPackRight(maxScroll > threshold && left < maxScroll - threshold);
  }, []);

  const updatePuzzleScrollState = useCallback(() => {
    const el = puzzleScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 2;
    setCanScrollPuzzleLeft(maxScroll > threshold && left > threshold);
    setCanScrollPuzzleRight(maxScroll > threshold && left < maxScroll - threshold);
  }, []);

  const scrollPackBy = useCallback(
    (direction: 1 | -1) => {
      const el = packScrollRef.current;
      if (!el) return;
      const metrics = getScrollMetrics(el);
      if (!metrics) return;
      const currentIndex = Math.round(el.scrollLeft / metrics.step);
      const targetIndex = Math.max(
        0,
        Math.min(metrics.maxIndex, currentIndex + metrics.visibleCount * direction),
      );
      const target = Math.min(
        Math.max(0, el.scrollWidth - el.clientWidth),
        targetIndex * metrics.step,
      );
      el.scrollTo({ left: target, behavior: "smooth" });
    },
    [getScrollMetrics],
  );

  const scrollPuzzleBy = useCallback(
    (direction: 1 | -1) => {
      const el = puzzleScrollRef.current;
      if (!el) return;
      const metrics = getScrollMetrics(el);
      if (!metrics) return;
      const currentIndex = Math.round(el.scrollLeft / metrics.step);
      const targetIndex = Math.max(
        0,
        Math.min(metrics.maxIndex, currentIndex + metrics.visibleCount * direction),
      );
      const target = Math.min(
        Math.max(0, el.scrollWidth - el.clientWidth),
        targetIndex * metrics.step,
      );
      el.scrollTo({ left: target, behavior: "smooth" });
    },
    [getScrollMetrics],
  );

  useEffect(() => {
    if (isOpen) loadPacksData().then(setPacksData);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDifficultyIndex(RECOMMENDED_INDEX);
    setSelectedPack(null);
    setSelectedPuzzle(null);
    setStep("pack");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !packsData) return;
    const el = packScrollRef.current;
    const run = () => requestAnimationFrame(updatePackScrollState);
    run();
    const t0 = setTimeout(updatePackScrollState, 0);
    const t1 = setTimeout(updatePackScrollState, 80);
    const t2 = setTimeout(updatePackScrollState, 250);
    const t3 = setTimeout(updatePackScrollState, 500);
    if (el) {
      el.addEventListener("scroll", updatePackScrollState);
      const ro = new ResizeObserver(updatePackScrollState);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", updatePackScrollState);
        ro.disconnect();
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, packsData, updatePackScrollState, filteredPacks.length, step]);

  useEffect(() => {
    if (step === "puzzle" && selectedPack && puzzles.length > 0 && !selectedPuzzle) {
      setSelectedPuzzle(puzzles[0]);
    }
  }, [step, selectedPack, puzzles, selectedPuzzle]);

  useEffect(() => {
    if (step !== "puzzle" || !selectedPack || puzzles.length === 0) return;
    const el = puzzleScrollRef.current;
    const run = () => requestAnimationFrame(updatePuzzleScrollState);
    run();
    const t0 = setTimeout(updatePuzzleScrollState, 0);
    const t1 = setTimeout(updatePuzzleScrollState, 80);
    const t2 = setTimeout(updatePuzzleScrollState, 250);
    const t3 = setTimeout(updatePuzzleScrollState, 500);
    if (el) {
      el.addEventListener("scroll", updatePuzzleScrollState);
      const ro = new ResizeObserver(updatePuzzleScrollState);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", updatePuzzleScrollState);
        ro.disconnect();
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step, selectedPack, updatePuzzleScrollState, puzzles.length]);

  const handleStart = () => {
    if (!selectedPuzzle || !packsData) return;
    const grid =
      PRIMARY_DIFFICULTIES[difficultyIndex] ?? PRIMARY_DIFFICULTIES[RECOMMENDED_INDEX];
    clearPuzzleState();
    safeLocalStorage.setItem(STORAGE_KEY, selectedPuzzle.fullImage);
    safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
    setCurrentPuzzleId(selectedPuzzle.id);
    safeLocalStorage.removeItem("phuzzle:dailyDate");
    void loadPlayScreenModule();
    if (location.pathname === "/play") onClose();
    navigate("/play");
  };

  const goToStep = (target: Step) => {
    setStep(target);
    if (target === "pack") {
      setSelectedPack(null);
      setSelectedPuzzle(null);
    } else if (target === "puzzle") {
      setSelectedPuzzle(null);
    }
  };

  const canStart = selectedPuzzle != null;

  if (!isOpen) return null;

  const modalTitle =
    step === "pack" ? "Choose Pack" : (selectedPack?.name ?? "Choose Puzzle");

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={modalTitle}
      showCloseButton
      variant="choosePuzzle"
    >
      {/* Compact step label */}
      <p
        className={styles.stepCompactLabel}
        aria-label={`Step ${step === "pack" ? 1 : 2} of 2`}
      >
        {step === "pack" ? (
          <span>Step 1 of 2</span>
        ) : (
          <>
            <button
              type="button"
              className={styles.stepBackLink}
              onClick={() => goToStep("pack")}
              title="Back to pack selection"
            >
              ← Step 1
            </button>
            <span className={styles.stepCompactSep}>·</span>
            <strong>Step 2 of 2</strong>
          </>
        )}
      </p>

      {/* Step 1: Pack selection only – clean Filter control + optional chips */}
      {step === "pack" && (
        <div className={styles.stepPanel}>
          <p className={styles.railLabel}>Choose a pack</p>
          <div className={styles.gridScrollWrap}>
            <button
              type="button"
              className={styles.gridScrollBtn}
              onClick={() => scrollPackBy(-1)}
              disabled={!canScrollPackLeft}
              aria-label="Scroll left"
              title="Scroll left"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <div
              ref={packScrollRef}
              className={styles.puzzleGridScroller}
              role="listbox"
              aria-label="Choose a pack"
            >
              <div className={styles.puzzleGrid}>
                {!packsData ? (
                  <div className={styles.puzzleTile} style={{ pointerEvents: "none" }}>
                    <div className={styles.tileImageWrap}>
                      <span className={styles.tilePlaceholder}>…</span>
                    </div>
                    <span className={styles.tileTitle}>Loading…</span>
                  </div>
                ) : (
                  filteredPacks.map((pack, packIndex) => {
                    const puzzleList = packsData.getPuzzlesForPack(pack);
                    const hero = puzzleList[0];
                    const { completed: completedCount, total } = getPackProgress(
                      puzzleList.map((p) => p.id),
                    );
                    const eagerLoad = packIndex < 8;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        role="option"
                        aria-selected={selectedPack?.id === pack.id}
                        className={`${styles.puzzleTile} ${localStyles.packTile} ${selectedPack?.id === pack.id ? localStyles.packTileSelected : ""}`}
                        onClick={() => {
                          setSelectedPack(pack);
                          setSelectedPuzzle(null);
                          setDifficultyIndex(RECOMMENDED_INDEX);
                          setStep("puzzle");
                        }}
                        title={`Select: ${pack.name}`}
                        aria-label={`${pack.name}, ${total} puzzles, ${completedCount} solved`}
                      >
                        <div
                          className={`${styles.tileImageWrap} ${styles.tileImageWrapPackHero}`}
                        >
                          {hero && !imgError[pack.id] ? (
                            <img
                              src={hero.thumbnail}
                              alt=""
                              loading={eagerLoad ? "eager" : "lazy"}
                              decoding="async"
                              className={styles.tileImage}
                              onError={() =>
                                setImgError((prev) => ({ ...prev, [pack.id]: true }))
                              }
                            />
                          ) : (
                            <span className={styles.tilePlaceholder}>{pack.emoji}</span>
                          )}
                        </div>
                        <span
                          className={`${styles.tileTitle} ${localStyles.packTileTitle}`}
                        >
                          {pack.name}
                        </span>
                        <span className={localStyles.packMeta}>
                          {completedCount}/{total} solved
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <button
              type="button"
              className={styles.gridScrollBtn}
              onClick={() => scrollPackBy(1)}
              disabled={!canScrollPackRight}
              aria-label="Scroll right"
              title="Scroll right"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Puzzle rail + difficulty + start */}
      {step === "puzzle" && selectedPack && puzzles.length > 0 && (
        <div className={`${styles.stepPanel} ${styles.stepPanelCompact}`}>
          <p className={styles.railLabel}>{selectedPack.name} — pick a puzzle</p>
          <div className={styles.gridScrollWrap}>
            <button
              type="button"
              className={styles.gridScrollBtn}
              onClick={() => scrollPuzzleBy(-1)}
              disabled={!canScrollPuzzleLeft}
              aria-label="Scroll left"
              title="Scroll left"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <div
              ref={puzzleScrollRef}
              className={styles.puzzleGridScroller}
              role="listbox"
              aria-label="Choose a puzzle"
            >
              <div className={styles.puzzleGrid}>
                {puzzles.map((puzzle, puzzleIndex) => {
                  const isDone = completed.has(puzzle.id);
                  const eagerLoad = puzzleIndex < 12;
                  return (
                    <button
                      key={puzzle.id}
                      type="button"
                      role="option"
                      aria-selected={selectedPuzzle?.id === puzzle.id}
                      className={`${styles.puzzleTile} ${styles.puzzleTileBare} ${selectedPuzzle?.id === puzzle.id ? styles.puzzleTileSelected : ""}`}
                      onClick={() => setSelectedPuzzle(puzzle)}
                      title={`Select: ${puzzle.name}${isDone ? " (completed)" : ""}`}
                      aria-label={`${puzzle.name}${isDone ? ", completed" : ""}`}
                    >
                      {imgError[puzzle.id] ? (
                        <span className={styles.tilePlaceholder}>?</span>
                      ) : (
                        <img
                          src={puzzle.thumbnail}
                          alt=""
                          loading={eagerLoad ? "eager" : "lazy"}
                          decoding="async"
                          className={styles.tileImage}
                          onError={() =>
                            setImgError((prev) => ({
                              ...prev,
                              [puzzle.id]: true,
                            }))
                          }
                        />
                      )}
                      {isDone && (
                        <span className={localStyles.completedBadge} aria-hidden>
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              className={styles.gridScrollBtn}
              onClick={() => scrollPuzzleBy(1)}
              disabled={!canScrollPuzzleRight}
              aria-label="Scroll right"
              title="Scroll right"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
          </div>

          {selectedPuzzle && (
            <>
              <div
                className={styles.difficultySelector}
                role="group"
                aria-label="Choose difficulty"
              >
                {PRIMARY_DIFFICULTIES.map((opt, i) => {
                  const name = DIFFICULTY_NAMES[i] ?? opt.label.split(" ")[0];
                  const pieces = opt.rows * opt.cols;
                  const active = difficultyIndex === i;
                  return (
                    <button
                      key={`${opt.rows}x${opt.cols}`}
                      type="button"
                      className={`${styles.difficultyBtn} ${active ? styles.difficultyBtnActive : ""}`}
                      onClick={() => setDifficultyIndex(i)}
                      aria-pressed={active}
                      aria-label={`${name}, ${pieces} pieces`}
                      title={`Select ${name}: ${pieces} pieces`}
                    >
                      <Puzzle size={16} aria-hidden />
                      <span>
                        {name} – {pieces} pieces
                      </span>
                      {active && (
                        <Check size={16} className={styles.difficultyCheck} aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                ref={startButtonRef}
                type="button"
                className={styles.startPuzzleButton}
                onClick={handleStart}
                disabled={!canStart}
                title="Start puzzle with selected difficulty"
                aria-label="Start puzzle"
              >
                Start Puzzle
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
