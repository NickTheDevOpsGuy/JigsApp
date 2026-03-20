/**
 * ChoosePuzzleModal – Strict 4-step flow (same model as Puzzle Packs).
 * Step 1: Choose Source Category (categories only; no preview, no difficulty).
 * Step 2: Choose Puzzle (puzzle rail only; thumbnail + title; no large preview).
 * Step 3: Puzzle Setup (ONLY place with large preview + difficulty + Start).
 * Step 4: Start (action: Start Puzzle button on Setup step).
 * Breadcrumb: Category → Puzzle → Setup → Start.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { SAMPLE_PUZZLES, CATEGORIES } from "@/data/packs/samplePuzzles";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import styles from "./ChoosePuzzleModal.module.css";

const PRIMARY_DIFFICULTIES = GRID_OPTIONS.slice(0, 4);
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard", "Expert"] as const;

type Step = "category" | "puzzle" | "setup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function filterPuzzles(puzzles: SamplePuzzle[], categoryId: string): SamplePuzzle[] {
  return categoryId === "all"
    ? puzzles
    : puzzles.filter((p) => p.category === categoryId);
}

export function ChoosePuzzleModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("category");
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const [filterCategory, setFilterCategory] = useState("all");
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const filteredPuzzles = useMemo(
    () => filterPuzzles(SAMPLE_PUZZLES, filterCategory),
    [filterCategory],
  );

  const gridScrollRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = gridScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 2;
    setCanScrollLeft(maxScroll > threshold && left > threshold);
    setCanScrollRight(maxScroll > threshold && left < maxScroll - threshold);
    setScrollProgress(maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, left / maxScroll)));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setDifficultyIndex(1);
    setFilterCategory("all");
    const filtered = filterPuzzles(SAMPLE_PUZZLES, "all");
    const firstPuzzle = filtered[0] ?? null;
    setSelectedPuzzle(firstPuzzle);
    setStep("category");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const inList =
      selectedPuzzle && filteredPuzzles.some((p) => p.id === selectedPuzzle.id);
    if (!inList && filteredPuzzles.length > 0) {
      setSelectedPuzzle(filteredPuzzles[0]);
    } else if (!inList) {
      setSelectedPuzzle(null);
    }
  }, [isOpen, filterCategory, filteredPuzzles, selectedPuzzle?.id]);

  useEffect(() => {
    if (!isOpen || step !== "puzzle") return;
    const el = gridScrollRef.current;
    const runUpdate = () => requestAnimationFrame(updateScrollState);
    runUpdate();
    const t0 = setTimeout(updateScrollState, 0);
    const t1 = setTimeout(updateScrollState, 80);
    const t2 = setTimeout(updateScrollState, 250);
    if (el) {
      el.addEventListener("scroll", updateScrollState);
      const ro = new ResizeObserver(updateScrollState);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", updateScrollState);
        ro.disconnect();
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, step, updateScrollState, filteredPuzzles.length]);

  const scrollGridBy = useCallback((direction: 1 | -1) => {
    const el = gridScrollRef.current;
    if (!el) return;
    const grid = el.firstElementChild;
    const firstTile = grid?.firstElementChild as HTMLElement | undefined;
    const cardWidth = firstTile?.offsetWidth ?? 100;
    const gap = 8;
    const stepPx = Math.max(100, cardWidth + gap);
    const target = Math.max(
      0,
      Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + stepPx * direction),
    );
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  const handleStart = () => {
    if (!selectedPuzzle) return;
    const grid = PRIMARY_DIFFICULTIES[difficultyIndex] ?? PRIMARY_DIFFICULTIES[1];
    clearPuzzleState();
    safeLocalStorage.setItem(STORAGE_KEY, selectedPuzzle.fullImage);
    safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
    safeLocalStorage.removeItem("phuzzle:dailyDate");
    // Preload image into browser cache before navigating so play screen starts instantly
    const preload = new Image();
    preload.src = selectedPuzzle.fullImage;
    onClose();
    navigate("/play");
  };

  const canStart = selectedPuzzle != null;

  const goToStep = (target: Step) => {
    setStep(target);
    if (target === "category") {
      setFilterCategory("all");
      setSelectedPuzzle(null);
    } else if (target === "puzzle") {
      setSelectedPuzzle(null);
    }
  };

  if (!isOpen) return null;

  const modalTitle =
    step === "category"
      ? "Choose Category"
      : step === "puzzle"
        ? "Choose Puzzle"
        : "Puzzle Setup";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={modalTitle}
      showCloseButton
      variant="choosePuzzle"
    >
      {/* Step indicator */}
      <nav
        className={styles.stepIndicator}
        role="navigation"
        aria-label="Steps: Category, Puzzle, Setup"
      >
        {/* Step 1: Category */}
        <button
          type="button"
          className={[
            styles.stepItem,
            step === "category" ? styles.stepItemActive : "",
            step !== "category" ? styles.stepItemDone : "",
          ].join(" ")}
          onClick={() => goToStep("category")}
          aria-current={step === "category" ? "step" : undefined}
          title="Back to category selection"
        >
          <span className={styles.stepNum} aria-hidden>
            {step !== "category" ? "✓" : "1"}
          </span>
          <span className={styles.stepLabel}>Pack</span>
        </button>

        <span className={styles.stepConnector} aria-hidden />

        {/* Step 2: Puzzle */}
        <button
          type="button"
          className={[
            styles.stepItem,
            step === "puzzle" ? styles.stepItemActive : "",
            step === "setup" ? styles.stepItemDone : "",
            step === "category" ? styles.stepItemFuture : "",
          ].join(" ")}
          onClick={() => step !== "category" && goToStep("puzzle")}
          disabled={step === "category"}
          aria-current={step === "puzzle" ? "step" : undefined}
          title={step !== "category" ? "Back to puzzle selection" : undefined}
        >
          <span className={styles.stepNum} aria-hidden>
            {step === "setup" ? "✓" : "2"}
          </span>
          <span className={styles.stepLabel}>Puzzle</span>
        </button>

        <span className={styles.stepConnector} aria-hidden />

        {/* Step 3: Setup */}
        <span
          className={[
            styles.stepItem,
            step === "setup" ? styles.stepItemActive : "",
            step !== "setup" ? styles.stepItemFuture : "",
          ].join(" ")}
          aria-current={step === "setup" ? "step" : undefined}
        >
          <span className={styles.stepNum} aria-hidden>
            3
          </span>
          <span className={styles.stepLabel}>Setup</span>
        </span>
      </nav>

      {/* Step 1: Category grid — click a category to go straight to puzzle rail */}
      {step === "category" && (
        <div className={styles.categoryGrid}>
          {CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={styles.categoryCard}
              onClick={() => {
                setFilterCategory(cat.id);
                setSelectedPuzzle(null);
                setStep("puzzle");
              }}
            >
              <span className={styles.categoryCardEmoji}>{cat.label}</span>
              <span className={styles.categoryCardName}>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Puzzle rail */}
      {step === "puzzle" && (
        <>
          <p className={styles.railLabel}>
            {filterCategory !== "all" && CATEGORIES.find((c) => c.id === filterCategory)
              ? `${CATEGORIES.find((c) => c.id === filterCategory)!.label ?? ""} ${CATEGORIES.find((c) => c.id === filterCategory)!.name}`.trim()
              : "All Packs"}{" "}
            — pick a puzzle
          </p>
          <div className={styles.gridScrollWrap}>
            {(canScrollLeft || canScrollRight) && (
              <button
                type="button"
                className={styles.gridScrollBtn}
                onClick={() => scrollGridBy(-1)}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                title="Scroll left"
              >
                <ChevronLeft size={22} aria-hidden />
              </button>
            )}
            <div
              ref={gridScrollRef}
              className={styles.puzzleGridScroller}
              role="listbox"
              aria-label="Choose a puzzle"
            >
              <div className={styles.puzzleGrid}>
                {filteredPuzzles.map((puzzle, index) => (
                  <PuzzleTile
                    key={puzzle.id}
                    puzzle={puzzle}
                    selected={selectedPuzzle?.id === puzzle.id}
                    imgError={imgError[puzzle.id]}
                    eagerLoad={index < 32}
                    onSelect={() => {
                      setSelectedPuzzle(puzzle);
                      setDifficultyIndex(1);
                      setStep("setup");
                    }}
                    onImgError={() =>
                      setImgError((prev) => ({ ...prev, [puzzle.id]: true }))
                    }
                  />
                ))}
              </div>
            </div>
            {(canScrollLeft || canScrollRight) && (
              <button
                type="button"
                className={styles.gridScrollBtn}
                onClick={() => scrollGridBy(1)}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                title="Scroll right"
              >
                <ChevronRight size={22} aria-hidden />
              </button>
            )}
          </div>
          <div
            className={styles.gridScrollBar}
            role="progressbar"
            aria-valuenow={Math.round(scrollProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Scroll position"
          >
            <div
              className={styles.gridScrollBarFill}
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </>
      )}

      {/* Step 3: Setup — thumbnail + difficulty + Start */}
      {step === "setup" && selectedPuzzle && (
        <>
          <div className={styles.setupHeader}>
            <div className={styles.setupThumb}>
              <img
                src={selectedPuzzle.thumbnail}
                alt=""
                className={styles.setupThumbImg}
              />
            </div>
            <div className={styles.setupHeaderText}>
              <h2 className={styles.setupPuzzleName}>{selectedPuzzle.name}</h2>
            </div>
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
            disabled={!canStart}
            title="Start puzzle with selected image and difficulty"
            aria-label="Start puzzle"
          >
            Start Puzzle
          </button>
        </>
      )}
    </Modal>
  );
}

type PuzzleTileProps = {
  puzzle: SamplePuzzle;
  selected: boolean;
  imgError: boolean;
  eagerLoad?: boolean;
  onSelect: () => void;
  onImgError: () => void;
};

function PuzzleTile({
  puzzle,
  selected,
  imgError,
  eagerLoad = false,
  onSelect,
  onImgError,
}: PuzzleTileProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={`${styles.puzzleTile} ${selected ? styles.puzzleTileSelected : ""}`}
      onClick={onSelect}
      title={`Select: ${puzzle.name}`}
      aria-label={`Select ${puzzle.name}`}
    >
      <div className={styles.tileImageWrap}>
        {imgError ? (
          <span className={styles.tilePlaceholder}>?</span>
        ) : (
          <img
            src={puzzle.thumbnail}
            alt=""
            loading={eagerLoad ? "eager" : "lazy"}
            decoding="async"
            className={styles.tileImage}
            onError={onImgError}
          />
        )}
      </div>
      <span className={styles.tileTitle}>{puzzle.name}</span>
      <div className={styles.tileHoverOverlay} aria-hidden />
      {selected && <div className={styles.tileSelectedIndicator} aria-hidden />}
    </button>
  );
}
