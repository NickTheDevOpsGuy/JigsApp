/**
 * PackChoiceModal – Strict 3-step flow with breadcrumbs.
 * Step 1: Choose Pack (packs only; cover, name, count, progress).
 * Step 2: Choose Puzzle (puzzles in pack; thumbnail, name, completion). No preview.
 * Step 3: Puzzle Setup (ONLY place with large preview + difficulty + Start).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { PACK_METADATA, type PackMetadata } from "@/data/packs/packMetadata";
import { loadPacksData } from "@/data/packs/loadPacksData";
import {
  getCompletedPuzzleIds,
  getPackProgress,
  setCurrentPuzzleId,
} from "@/data/packs/packCompletion";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import type { PuzzlePack } from "@/data/packs/puzzlePacks";
import styles from "@/components/ChoosePuzzleModal/ChoosePuzzleModal.module.css";
import localStyles from "./PackChoiceModal.module.css";

const PRIMARY_DIFFICULTIES = GRID_OPTIONS.slice(0, 4);
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard", "Expert"] as const;
const RECOMMENDED_INDEX = 1;

type Step = "pack" | "puzzle" | "setup";

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

  const packs = packsData?.PUZZLE_PACKS ?? [];
  const filteredPacks = packs;
  const puzzles: SamplePuzzle[] =
    selectedPack && packsData ? packsData.getPuzzlesForPack(selectedPack) : [];
  const completed = getCompletedPuzzleIds();

  const packScrollRef = useRef<HTMLDivElement>(null);
  const puzzleScrollRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
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
    const threshold = 2;
    setCanScrollPackLeft(maxScroll > threshold && left > threshold);
    setCanScrollPackRight(maxScroll > threshold && left < maxScroll - threshold);
    setPackScrollProgress(
      maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, left / maxScroll)),
    );
  }, []);

  const updatePuzzleScrollState = useCallback(() => {
    const el = puzzleScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 2;
    setCanScrollPuzzleLeft(maxScroll > threshold && left > threshold);
    setCanScrollPuzzleRight(maxScroll > threshold && left < maxScroll - threshold);
    setPuzzleScrollProgress(
      maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, left / maxScroll)),
    );
  }, []);

  const scrollPackBy = useCallback((direction: 1 | -1) => {
    const el = packScrollRef.current;
    if (!el) return;
    const grid = el.firstElementChild;
    const firstTile = grid?.firstElementChild as HTMLElement | undefined;
    const cardWidth = firstTile?.offsetWidth ?? 100;
    const gap = 8;
    const stepPx = Math.max(100, cardWidth + gap);
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + stepPx * direction));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  const scrollPuzzleBy = useCallback((direction: 1 | -1) => {
    const el = puzzleScrollRef.current;
    if (!el) return;
    const grid = el.firstElementChild;
    const firstTile = grid?.firstElementChild as HTMLElement | undefined;
    const cardWidth = firstTile?.offsetWidth ?? 100;
    const gap = 8;
    const stepPx = Math.max(100, cardWidth + gap);
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + stepPx * direction));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

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
    onClose();
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

  if (!isOpen) return null;

  const modalTitle =
    step === "pack"
      ? "Choose Pack"
      : step === "puzzle"
        ? (selectedPack?.name ?? "Choose Puzzle")
        : "Puzzle Setup";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={modalTitle}
      showCloseButton
      variant="choosePuzzle"
    >
      {/* Step indicator: numbered circles */}
      <nav
        className={styles.stepIndicator}
        role="navigation"
        aria-label="Steps: Pack, Puzzle, Setup"
      >
        <button
          type="button"
          className={[
            styles.stepItem,
            step === "pack" ? styles.stepItemActive : styles.stepItemDone,
          ].join(" ")}
          onClick={() => goToStep("pack")}
          aria-current={step === "pack" ? "step" : undefined}
          title="Back to pack selection"
        >
          <span className={styles.stepNum} aria-hidden>
            {step === "pack" ? "1" : "✓"}
          </span>
          <span className={styles.stepLabel}>Pack</span>
        </button>

        <span className={styles.stepConnector} aria-hidden />

        <button
          type="button"
          className={[
            styles.stepItem,
            step === "puzzle" ? styles.stepItemActive : "",
            step === "setup" ? styles.stepItemDone : "",
            step === "pack" ? styles.stepItemFuture : "",
          ].join(" ")}
          onClick={() => step !== "pack" && goToStep("puzzle")}
          disabled={step === "pack"}
          aria-current={step === "puzzle" ? "step" : undefined}
          title={step !== "pack" ? "Back to puzzle selection" : undefined}
        >
          <span className={styles.stepNum} aria-hidden>
            {step === "setup" ? "✓" : "2"}
          </span>
          <span className={styles.stepLabel}>Puzzle</span>
        </button>

        <span className={styles.stepConnector} aria-hidden />

        <span
          className={[
            styles.stepItem,
            step === "setup" ? styles.stepItemActive : styles.stepItemFuture,
          ].join(" ")}
          aria-current={step === "setup" ? "step" : undefined}
        >
          <span className={styles.stepNum} aria-hidden>3</span>
          <span className={styles.stepLabel}>Setup</span>
        </span>
      </nav>

      {/* Step 1: Pack selection only – clean Filter control + optional chips */}
      {step === "pack" && (
        <>
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
                    const meta = PACK_METADATA.find((p: PackMetadata) => p.id === pack.id);
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
                        aria-selected={false}
                        className={styles.puzzleTile}
                        onClick={() => {
                          setSelectedPack(pack);
                          setSelectedPuzzle(null);
                          setDifficultyIndex(RECOMMENDED_INDEX);
                          setStep("puzzle");
                        }}
                        title={`Select: ${pack.name}`}
                        aria-label={`${pack.name}, ${total} puzzles, ${completedCount} solved`}
                      >
                        <div className={styles.tileImageWrap}>
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
                            <span className={styles.tilePlaceholder}>
                              {meta?.emoji ?? "🧩"}
                            </span>
                          )}
                        </div>
                        <span className={styles.tileTitle}>{pack.name}</span>
                        <span className={localStyles.packMeta}>
                          {total} puzzle{total !== 1 ? "s" : ""}
                          {" · "}
                          {completedCount} / {total} solved
                        </span>
                        <div className={styles.tileHoverOverlay} aria-hidden />
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
          <div
            className={styles.gridScrollBar}
            role="progressbar"
            aria-valuenow={Math.round(packScrollProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Scroll position"
          >
            <div
              className={styles.gridScrollBarFill}
              style={{ width: `${packScrollProgress * 100}%` }}
            />
          </div>
        </>
      )}

      {/* Step 2: Puzzle selection only (no large preview) */}
      {step === "puzzle" && selectedPack && puzzles.length > 0 && (
        <>
          <p className={styles.railLabel}>Choose a puzzle</p>
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
                      aria-selected={false}
                      className={styles.puzzleTile}
                      onClick={() => {
                        setSelectedPuzzle(puzzle);
                        setDifficultyIndex(RECOMMENDED_INDEX);
                        setStep("setup");
                      }}
                      title={`Select: ${puzzle.name}${isDone ? " (completed)" : ""}`}
                      aria-label={`${puzzle.name}${isDone ? ", completed" : ""}`}
                    >
                      <div className={styles.tileImageWrap}>
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
                      </div>
                      <span className={styles.tileTitle}>
                        {puzzle.name}
                        {isDone ? " ✓" : ""}
                      </span>
                      <div className={styles.tileHoverOverlay} aria-hidden />
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
          <div
            className={styles.gridScrollBar}
            role="progressbar"
            aria-valuenow={Math.round(puzzleScrollProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Scroll position"
          >
            <div
              className={styles.gridScrollBarFill}
              style={{ width: `${puzzleScrollProgress * 100}%` }}
            />
          </div>
        </>
      )}

      {/* Step 3: Puzzle Setup */}
      {step === "setup" && selectedPuzzle && (
        <>
          <div className={localStyles.setupHeader}>
            <div className={localStyles.setupThumb}>
              <img src={selectedPuzzle.thumbnail} alt="" className={localStyles.setupThumbImg} />
            </div>
            <h2 className={localStyles.setupPuzzleName}>{selectedPuzzle.name}</h2>
          </div>
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
            title="Start puzzle with selected difficulty"
            aria-label="Start puzzle"
          >
            Start Puzzle
          </button>
        </>
      )}
    </Modal>
  );
}
