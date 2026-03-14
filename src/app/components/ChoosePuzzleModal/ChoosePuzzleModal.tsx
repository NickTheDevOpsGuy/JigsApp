/**
 * ChoosePuzzleModal – Flow: Image → Difficulty → Start.
 * State machine: Choose Image (State 1) → Choose Difficulty (State 2) → Start Puzzle (State 3).
 * No additional states, no confirmation screens, no preview modals.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Check } from "lucide-react";
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

function filterPuzzles(
  puzzles: SamplePuzzle[],
  categoryId: string,
  searchQuery: string,
): SamplePuzzle[] {
  let out =
    categoryId === "all" ? puzzles : puzzles.filter((p) => p.category === categoryId);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    out = out.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }
  return out;
}

export function ChoosePuzzleModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const filteredPuzzles = useMemo(
    () => filterPuzzles(SAMPLE_PUZZLES, filterCategory, searchQuery),
    [filterCategory, searchQuery],
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedPuzzle(null);
      setDifficultyIndex(1);
      setFilterCategory("all");
      setSearchQuery("");
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
      {/* StepIndicator: Image → Difficulty → Start */}
      <div
        className={styles.stepIndicator}
        aria-label="Progress: Image, Difficulty, Start"
      >
        <span className={styles.stepCurrent}>Image</span>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <span className={selectedPuzzle ? styles.stepCurrent : ""}>Difficulty</span>
        <span className={styles.stepSep} aria-hidden>
          →
        </span>
        <span className={canStart ? styles.stepCurrent : ""}>Start</span>
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
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* SearchBar */}
      <div className={styles.searchBarWrap}>
        <input
          type="search"
          className={styles.searchBar}
          placeholder="Search puzzles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search puzzles"
        />
      </div>

      {/* PuzzleGrid: PuzzleTile[] – only scrolling region; grid expands naturally */}
      <div
        className={styles.puzzleGrid}
        role="listbox"
        aria-label="Choose a puzzle image"
      >
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

      {/* SelectedPreview + PreviewImage */}
      {selectedPuzzle && (
        <div className={styles.selectedPreview}>
          <img src={selectedPuzzle.fullImage} alt="" className={styles.previewImage} />
        </div>
      )}

      {/* DifficultySelector: DifficultyButtons[] – enabled only when image selected */}
      <div
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
        type="button"
        className={styles.startPuzzleButton}
        onClick={handleStart}
        disabled={!canStart}
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
      <div className={styles.tileHoverOverlay} aria-hidden />
      {selected && <div className={styles.tileSelectedIndicator} aria-hidden />}
    </button>
  );
}
