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
import { Puzzle, Check, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { SAMPLE_PUZZLES, CATEGORIES } from "@/data/packs/samplePuzzles";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import styles from "./ChoosePuzzleModal.module.css";
import { FilterPanel } from "@/components/FilterPanel/FilterPanel";

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
  const [filterOpen, setFilterOpen] = useState(false);
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
    setStep("category");
    setSelectedPuzzle(null);
    setDifficultyIndex(1);
    setFilterCategory("all");
    setFilterOpen(false);
  }, [isOpen]);

  const activeFilterOption = CATEGORIES.find((c) => c.id === filterCategory);
  const filterTriggerLabel =
    filterCategory === "all"
      ? "✨ All Packs"
      : activeFilterOption
        ? `${activeFilterOption.label ?? ""} ${activeFilterOption.name}`.trim()
        : "Filter";

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
      {/* Breadcrumb: Category → Puzzle → Setup → Start */}
      <nav
        className={styles.stepIndicator}
        role="navigation"
        aria-label="Steps: Category, Puzzle, Setup, Start"
      >
        <button
          type="button"
          className={`${styles.stepLink} ${step === "category" ? styles.stepCurrent : ""}`}
          onClick={() => goToStep("category")}
          title="Category selection"
          aria-current={step === "category" ? "step" : undefined}
        >
          Category
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${step === "puzzle" ? styles.stepCurrent : ""}`}
          onClick={() => step !== "category" && goToStep("puzzle")}
          disabled={step === "category"}
          title="Puzzle selection"
          aria-current={step === "puzzle" ? "step" : undefined}
        >
          Puzzle
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${step === "setup" ? styles.stepCurrent : ""}`}
          disabled={step !== "setup" || !selectedPuzzle}
          title="Setup"
          aria-current={step === "setup" ? "step" : undefined}
        >
          Setup
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${step === "setup" && canStart ? styles.stepCurrent : ""}`}
          onClick={() => canStart && startButtonRef.current?.focus()}
          disabled={!canStart}
          title={canStart ? "Start puzzle" : "Select a puzzle and difficulty first"}
          aria-label="Start"
        >
          Start
        </button>
      </nav>

      {/* Step 1: Category only – filter trigger shows active filter (e.g. 🌿 Nature ▾) */}
      {step === "category" && (
        <>
          <div className={styles.filterControlRow}>
            <button
              type="button"
              className={styles.filterTriggerBtn}
              onClick={() => setFilterOpen(true)}
              aria-label="Open filter"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
            >
              {filterTriggerLabel} <ChevronDown size={16} aria-hidden />
            </button>
          </div>
          <FilterPanel
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
            title="Filter by category"
            categoryOptions={CATEGORIES.map((c) => ({
              id: c.id,
              name: c.name,
              label:
                c.id === "all" ? "✨ All Packs" : `${c.label ?? ""} ${c.name}`.trim(),
            }))}
            selectedCategoryId={filterCategory}
            onCategorySelect={setFilterCategory}
            onApply={(selectedId) => {
              setFilterOpen(false);
              if (selectedId && selectedId !== "all") setStep("puzzle");
            }}
            onReset={() => setFilterCategory("all")}
            autoApplyOnSelect
          />
          <p className={styles.railLabel}>Choose a category</p>
        </>
      )}

      {/* Step 2: Puzzle rail — same Filter control + chips, then rail */}
      {step === "puzzle" && (
        <>
          <div className={styles.filterControlRow}>
            <button
              type="button"
              className={styles.filterTriggerBtn}
              onClick={() => setFilterOpen(true)}
              aria-label="Open filter"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
            >
              {filterTriggerLabel} <ChevronDown size={16} aria-hidden />
            </button>
          </div>
          <FilterPanel
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
            title="Filter by category"
            categoryOptions={CATEGORIES.map((c) => ({
              id: c.id,
              name: c.name,
              label:
                c.id === "all" ? "✨ All Packs" : `${c.label ?? ""} ${c.name}`.trim(),
            }))}
            selectedCategoryId={filterCategory}
            onCategorySelect={setFilterCategory}
            onApply={(id) => {
              setFilterOpen(false);
              if (id && id !== "all") setStep("puzzle");
            }}
            onReset={() => setFilterCategory("all")}
            autoApplyOnSelect
          />
          <p className={styles.railLabel}>Choose a puzzle</p>
          <div className={styles.gridScrollWrap}>
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
                    eagerLoad={index < 12}
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

      {/* Step 3: Setup — difficulty + Start only (image already seen on puzzle step) */}
      {step === "setup" && selectedPuzzle && (
        <>
          <h2 className={styles.setupPuzzleName}>{selectedPuzzle.name}</h2>
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

      {(step === "category" || step === "puzzle") && (
        <p className={styles.uploadLinkWrap}>
          Or{" "}
          <button
            type="button"
            className={styles.uploadLink}
            onClick={() => {
              onClose();
              navigate("/new");
            }}
            title="Open custom image upload"
            aria-label="Upload your own image"
          >
            upload your own image
          </button>
        </p>
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
