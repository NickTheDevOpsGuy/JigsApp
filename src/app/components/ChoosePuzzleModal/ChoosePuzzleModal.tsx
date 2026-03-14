/**
 * ChoosePuzzleModal – Flow: Image → Difficulty → Start.
 * State machine: Choose Image (State 1) → Choose Difficulty (State 2) → Start Puzzle (State 3).
 * Puzzle rail: horizontal left-to-right scroll with arrows, snap, and blue progress bar.
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
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const [filterCategory, setFilterCategory] = useState("all");
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const filteredPuzzles = useMemo(
    () => filterPuzzles(SAMPLE_PUZZLES, filterCategory),
    [filterCategory],
  );

  const gridScrollRef = useRef<HTMLDivElement>(null);
  const difficultySectionRef = useRef<HTMLDivElement>(null);
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
    const el = gridScrollRef.current;
    const runUpdate = () => {
      requestAnimationFrame(() => updateScrollState());
    };
    runUpdate();
    const t0 = setTimeout(updateScrollState, 0);
    const t1 = setTimeout(updateScrollState, 80);
    const t2 = setTimeout(updateScrollState, 250);
    const t3 = setTimeout(updateScrollState, 500);
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
        clearTimeout(t3);
      };
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, updateScrollState, filteredPuzzles.length]);

  const scrollGridBy = useCallback((direction: 1 | -1) => {
    const el = gridScrollRef.current;
    if (!el) return;
    const grid = el.firstElementChild;
    const firstTile = grid?.firstElementChild as HTMLElement | undefined;
    const cardWidth = firstTile?.offsetWidth ?? 100;
    const gap = 8;
    const stepPx = Math.max(100, cardWidth + gap);
    const step = stepPx * direction;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + step));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedPuzzle(null);
      setDifficultyIndex(1);
      setFilterCategory("all");
    }
  }, [isOpen]);

  const onSelectImage = (puzzle: SamplePuzzle) => {
    setSelectedPuzzle(puzzle);
    setDifficultyIndex(1);
  };

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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Choose Puzzle"
      showCloseButton
      variant="choosePuzzle"
    >
      {/* StepIndicator: Image → Difficulty → Start (clickable: focus/scroll to section) */}
      <div
        className={styles.stepIndicator}
        role="navigation"
        aria-label="Steps: Image, Difficulty, Start"
      >
        <button
          type="button"
          className={`${styles.stepLink} ${styles.stepCurrent}`}
          onClick={() =>
            gridScrollRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            })
          }
          title="Puzzle image selection"
          aria-label="Image selection"
        >
          Image
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${selectedPuzzle ? styles.stepCurrent : ""}`}
          onClick={() =>
            difficultySectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            })
          }
          title="Difficulty selection"
          aria-label="Difficulty selection"
        >
          Difficulty
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${canStart ? styles.stepCurrent : ""}`}
          onClick={() => startButtonRef.current?.focus()}
          title={canStart ? "Start puzzle" : "Jump to Start"}
          aria-label="Start puzzle"
        >
          Start
        </button>
      </div>

      {/* FilterBar: FilterChips */}
      <div className={styles.filterBar} role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.filterChip} ${filterCategory === cat.id ? styles.filterChipActive : ""}`}
            onClick={() => setFilterCategory(cat.id)}
            aria-pressed={filterCategory === cat.id}
            aria-label={`Filter: ${cat.name}`}
            title={`Filter by ${cat.name}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Puzzle rail: horizontal left→right scroll */}
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
          aria-label="Choose a puzzle image"
        >
          <div className={styles.puzzleGrid}>
            {filteredPuzzles.map((puzzle) => (
              <PuzzleTile
                key={puzzle.id}
                puzzle={puzzle}
                selected={selectedPuzzle?.id === puzzle.id}
                imgError={imgError[puzzle.id]}
                onSelect={() => onSelectImage(puzzle)}
                onImgError={() => setImgError((prev) => ({ ...prev, [puzzle.id]: true }))}
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
      {/* Blue bar: scroll position indicator underneath */}
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

      {/* SelectedPreview + PreviewImage */}
      {selectedPuzzle && (
        <div className={styles.selectedPreview}>
          <img src={selectedPuzzle.fullImage} alt="" className={styles.previewImage} />
        </div>
      )}

      {/* DifficultySelector: DifficultyButtons[] – enabled only when image selected */}
      <div
        ref={difficultySectionRef}
        className={styles.difficultySelector}
        role="group"
        aria-label="Choose difficulty"
        aria-disabled={!selectedPuzzle}
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
              disabled={!selectedPuzzle}
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

      {/* StartPuzzleButton */}
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

      {/* UploadLink */}
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
    </Modal>
  );
}

type PuzzleTileProps = {
  puzzle: SamplePuzzle;
  selected: boolean;
  imgError: boolean;
  onSelect: () => void;
  onImgError: () => void;
};

function PuzzleTile({
  puzzle,
  selected,
  imgError,
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
            loading="lazy"
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
