/**
 * ChoosePuzzleModal – 2-step flow (matches PackChoiceModal parity).
 * Step 1: Choose Category.
 * Step 2: Choose Puzzle + difficulty + Start (all on one screen).
 */
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type KeyboardEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Puzzle, Check, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { SAMPLE_PUZZLES, CATEGORIES } from "@/data/packs/samplePuzzles";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { loadPlayScreenModule } from "@/screens/Play/loadPlayScreen";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import styles from "./ChoosePuzzleModal.module.css";

const PRIMARY_DIFFICULTIES = GRID_OPTIONS.slice(0, 4);
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard", "Expert"] as const;

type Step = "category" | "puzzle";

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
  const location = useLocation();
  const [step, setStep] = useState<Step>("category");
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const [filterCategory, setFilterCategory] = useState("all");
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const filteredPuzzles = useMemo(
    () => filterPuzzles(SAMPLE_PUZZLES, filterCategory),
    [filterCategory],
  );

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const [canScrollCategoryLeft, setCanScrollCategoryLeft] = useState(false);
  const [canScrollCategoryRight, setCanScrollCategoryRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const updateScrollState = useCallback(() => {
    const el = gridScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 2;
    setCanScrollLeft(maxScroll > threshold && left > threshold);
    setCanScrollRight(maxScroll > threshold && left < maxScroll - threshold);
  }, []);

  const updateCategoryScrollState = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const threshold = 2;
    setCanScrollCategoryLeft(maxScroll > threshold && left > threshold);
    setCanScrollCategoryRight(maxScroll > threshold && left < maxScroll - threshold);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setDifficultyIndex(1);
    setFilterCategory("all");
    setSelectedPuzzle(null);
    setStep("category");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Clear selection when category changes so user must pick intentionally
    setSelectedPuzzle(null);
  }, [isOpen, filterCategory]);

  useEffect(() => {
    if (!isOpen || step !== "category") return;
    const el = categoryScrollRef.current;
    const runUpdate = () => requestAnimationFrame(updateCategoryScrollState);
    runUpdate();
    const t0 = setTimeout(updateCategoryScrollState, 0);
    const t1 = setTimeout(updateCategoryScrollState, 80);
    const t2 = setTimeout(updateCategoryScrollState, 250);
    if (el) {
      el.addEventListener("scroll", updateCategoryScrollState);
      const ro = new ResizeObserver(updateCategoryScrollState);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", updateCategoryScrollState);
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
  }, [isOpen, step, updateCategoryScrollState]);

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

  const scrollGridBy = useCallback(
    (direction: 1 | -1) => {
      const el = gridScrollRef.current;
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

  const scrollCategoryBy = useCallback(
    (direction: 1 | -1) => {
      const el = categoryScrollRef.current;
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
    void loadPlayScreenModule();
    if (location.pathname === "/play") onClose();
    navigate("/play");
  };

  const canStart = selectedPuzzle != null;

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const grid = PRIMARY_DIFFICULTIES[difficultyIndex] ?? PRIMARY_DIFFICULTIES[1];
      clearPuzzleState();
      safeLocalStorage.setItem(STORAGE_KEY, dataUrl);
      safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
      safeLocalStorage.removeItem("phuzzle:dailyDate");
      void loadPlayScreenModule();
      if (location.pathname === "/play") onClose();
      navigate("/play");
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const onUploadCtaKeyDown = (e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.currentTarget.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  };

  const goToStep = (target: Step) => {
    setStep(target);
    if (target === "category") {
      setFilterCategory("all");
      setSelectedPuzzle(null);
    }
  };

  if (!isOpen) return null;

  const categoryMeta = CATEGORIES.find((c) => c.id === filterCategory);

  const modalTitle =
    step === "category" ? "Choose a Puzzle" : (categoryMeta?.name ?? "Choose Puzzle");

  const stepNumber = step === "category" ? 1 : 2;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={modalTitle}
      showCloseButton
      variant="choosePuzzle"
    >
      {/* Compact step label */}
      <p className={styles.stepCompactLabel} aria-label={`Step ${stepNumber} of 2`}>
        {step === "category" ? (
          <span>Step 1 of 2</span>
        ) : (
          <>
            <button
              type="button"
              className={styles.stepBackLink}
              onClick={() => goToStep("category")}
              title="Back to category selection"
            >
              ← Step 1
            </button>
            <span className={styles.stepCompactSep}>·</span>
            <strong>Step 2 of 2</strong>
          </>
        )}
      </p>

      {/* Step 1: Category grid — click a category to go straight to puzzle rail */}
      {step === "category" && (
        <div className={styles.stepPanel}>
          <p className={styles.railLabel}>Choose a category</p>
          <div className={`${styles.gridScrollWrap} ${styles.categoryScrollWrap}`}>
            <button
              type="button"
              className={styles.gridScrollBtn}
              onClick={() => scrollCategoryBy(-1)}
              disabled={!canScrollCategoryLeft}
              aria-label="Scroll left"
              title="Scroll left"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <div
              ref={categoryScrollRef}
              className={styles.puzzleGridScroller}
              role="listbox"
              aria-label="Choose a category"
            >
              <div className={styles.categoryGrid}>
                {CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={styles.categoryCard}
                    role="option"
                    aria-label={cat.name}
                    title={`Choose ${cat.name}`}
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
                <div className={styles.categoryUploadRow}>
                  <label
                    className={styles.uploadCta}
                    tabIndex={0}
                    onKeyDown={onUploadCtaKeyDown}
                    aria-label="Custom image: upload an image from your device"
                    title="Choose a custom image"
                    role="button"
                  >
                    <span className={styles.uploadCtaIconWrap} aria-hidden>
                      <Camera size={22} strokeWidth={2} />
                    </span>
                    <span className={styles.uploadCtaCopy}>
                      <span className={styles.uploadCtaTitle}>Custom image</span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.uploadCtaInput}
                      onChange={handleCustomUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
            <button
              type="button"
              className={styles.gridScrollBtn}
              onClick={() => scrollCategoryBy(1)}
              disabled={!canScrollCategoryRight}
              aria-label="Scroll right"
              title="Scroll right"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Puzzle rail + difficulty + start */}
      {step === "puzzle" && (
        <div className={`${styles.stepPanel} ${styles.stepPanelCompact}`}>
          <p className={styles.railLabel}>
            {filterCategory !== "all" && categoryMeta ? categoryMeta.name : "All puzzles"} —
            pick a puzzle
          </p>
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
                    eagerLoad={index < 32}
                    onSelect={() => {
                      setSelectedPuzzle(puzzle);
                      setDifficultyIndex(1);
                      const preloadOnSelect = new Image();
                      preloadOnSelect.src = puzzle.fullImage;
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
                title="Start puzzle with selected image and difficulty"
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
      className={`${styles.puzzleTile} ${styles.puzzleTileBare} ${selected ? styles.puzzleTileSelected : ""}`}
      onClick={onSelect}
      title={`Select: ${puzzle.name}`}
      aria-label={`Select ${puzzle.name}`}
    >
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
    </button>
  );
}
