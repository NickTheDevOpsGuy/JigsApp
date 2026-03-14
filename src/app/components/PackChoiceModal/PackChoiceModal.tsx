/**
 * PackChoiceModal – Visually matches Choose Puzzle dialog.
 * Flow: Pack → Puzzle → Difficulty → Start. Same layout structure, spacing, and interaction pattern.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import styles from "@/components/ChoosePuzzleModal/ChoosePuzzleModal.module.css";

const PRIMARY_DIFFICULTIES = GRID_OPTIONS.slice(0, 4);
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard", "Expert"] as const;
const RECOMMENDED_INDEX = 1;

const PACK_FILTERS = [
  { id: "all", name: "All", label: "All" },
  ...PACK_METADATA.map((p) => ({ id: p.id, name: p.name, label: p.name })),
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function filterPacks(packs: PuzzlePack[], categoryId: string): PuzzlePack[] {
  return categoryId === "all" ? packs : packs.filter((p) => p.id === categoryId);
}

export function PackChoiceModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);
  const [selectedPack, setSelectedPack] = useState<PuzzlePack | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(RECOMMENDED_INDEX);
  const [filterCategory, setFilterCategory] = useState("all");
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const packs = packsData?.PUZZLE_PACKS ?? [];
  const filteredPacks = useMemo(
    () => filterPacks(packs, filterCategory),
    [packs, filterCategory],
  );
  const puzzles: SamplePuzzle[] =
    selectedPack && packsData ? packsData.getPuzzlesForPack(selectedPack) : [];
  const completed = getCompletedPuzzleIds();

  const packScrollRef = useRef<HTMLDivElement>(null);
  const puzzleScrollRef = useRef<HTMLDivElement>(null);
  const packSectionRef = useRef<HTMLDivElement>(null);
  const puzzleSectionRef = useRef<HTMLDivElement>(null);
  const difficultySectionRef = useRef<HTMLDivElement>(null);
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
    const step = stepPx * direction;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + step));
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
    const step = stepPx * direction;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + step));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) loadPacksData().then(setPacksData);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPack(null);
    setSelectedPuzzle(null);
    setDifficultyIndex(RECOMMENDED_INDEX);
    setFilterCategory("all");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !packsData) return;
    const el = packScrollRef.current;
    const runUpdate = () => requestAnimationFrame(updatePackScrollState);
    runUpdate();
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
  }, [isOpen, packsData, updatePackScrollState, filteredPacks.length]);

  useEffect(() => {
    if (!selectedPack || puzzles.length === 0) return;
    const el = puzzleScrollRef.current;
    const runUpdate = () => requestAnimationFrame(updatePuzzleScrollState);
    runUpdate();
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
  }, [selectedPack, updatePuzzleScrollState, puzzles.length]);

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

  const canStart = selectedPuzzle != null;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Choose Pack"
      showCloseButton
      variant="choosePuzzle"
    >
      {/* Step indicator: Pack → Puzzle → Difficulty → Start (same as Choose Puzzle) */}
      <div
        className={styles.stepIndicator}
        role="navigation"
        aria-label="Steps: Pack, Puzzle, Difficulty, Start"
      >
        <button
          type="button"
          className={`${styles.stepLink} ${!selectedPack ? styles.stepCurrent : ""}`}
          onClick={() =>
            packSectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            })
          }
          title="Pack selection"
          aria-label="Pack selection"
        >
          Pack
        </button>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`${styles.stepLink} ${selectedPack ? styles.stepCurrent : ""}`}
          onClick={() =>
            puzzleSectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            })
          }
          title="Puzzle selection"
          aria-label="Puzzle selection"
        >
          Puzzle
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

      {/* Filter chips (same as Choose Puzzle) */}
      <div className={styles.filterBar} role="group" aria-label="Filter by category">
        {PACK_FILTERS.map((cat) => (
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

      {/* Pack rail: same structure as Choose Puzzle rail */}
      <p className={styles.railLabel} ref={packSectionRef}>
        Choose a pack
      </p>
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
              filteredPacks.map((pack) => {
                const meta = PACK_METADATA.find((p) => p.id === pack.id);
                const puzzleList = packsData.getPuzzlesForPack(pack);
                const hero = puzzleList[0];
                const selected = selectedPack?.id === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`${styles.puzzleTile} ${selected ? styles.puzzleTileSelected : ""}`}
                    onClick={() => {
                      setSelectedPack(pack);
                      setSelectedPuzzle(null);
                      setDifficultyIndex(RECOMMENDED_INDEX);
                    }}
                    title={`Select: ${pack.name}`}
                    aria-label={`Select ${pack.name}`}
                  >
                    <div className={styles.tileImageWrap}>
                      {hero && !imgError[pack.id] ? (
                        <img
                          src={hero.thumbnail}
                          alt=""
                          loading="lazy"
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
                    <div className={styles.tileHoverOverlay} aria-hidden />
                    {selected && (
                      <div className={styles.tileSelectedIndicator} aria-hidden />
                    )}
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

      {/* Puzzle section: always in DOM so breadcrumb "Puzzle" can scroll here */}
      <p className={styles.railLabel} ref={puzzleSectionRef}>
        Choose a puzzle
      </p>
      {selectedPack && puzzles.length > 0 ? (
        <>
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
                {puzzles.map((puzzle) => {
                  const selected = selectedPuzzle?.id === puzzle.id;
                  const isDone = completed.has(puzzle.id);
                  return (
                    <button
                      key={puzzle.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`${styles.puzzleTile} ${selected ? styles.puzzleTileSelected : ""}`}
                      onClick={() => setSelectedPuzzle(puzzle)}
                      title={`Select: ${puzzle.name}${isDone ? " (completed)" : ""}`}
                      aria-label={`Select ${puzzle.name}${isDone ? " (completed)" : ""}`}
                    >
                      <div className={styles.tileImageWrap}>
                        {imgError[puzzle.id] ? (
                          <span className={styles.tilePlaceholder}>?</span>
                        ) : (
                          <img
                            src={puzzle.thumbnail}
                            alt=""
                            loading="lazy"
                            className={styles.tileImage}
                            onError={() =>
                              setImgError((prev) => ({ ...prev, [puzzle.id]: true }))
                            }
                          />
                        )}
                      </div>
                      <span className={styles.tileTitle}>
                        {puzzle.name}
                        {isDone ? " ✓" : ""}
                      </span>
                      <div className={styles.tileHoverOverlay} aria-hidden />
                      {selected && (
                        <div className={styles.tileSelectedIndicator} aria-hidden />
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
      ) : (
        <p
          className={styles.railLabel}
          style={{
            marginTop: 0,
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            fontSize: "13px",
          }}
        >
          Select a pack above to choose a puzzle
        </p>
      )}

      {/* Selected preview (same as Choose Puzzle) */}
      {selectedPuzzle && (
        <div className={styles.selectedPreview}>
          <img src={selectedPuzzle.fullImage} alt="" className={styles.previewImage} />
        </div>
      )}

      {/* Difficulty section (identical to Choose Puzzle) */}
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

      {/* Start Puzzle button (same as Choose Puzzle) */}
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

      {/* Footer link (same as Choose Puzzle) */}
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
