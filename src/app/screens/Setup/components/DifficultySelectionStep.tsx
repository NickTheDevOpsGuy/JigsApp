/**
 * Step 3: Choose difficulty and start. Shows large preview with grid overlay,
 * four difficulty cards, and Start Puzzle CTA.
 */
import { Sparkles } from "lucide-react";
import { GRID_OPTIONS } from "../hooks";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";

const DIFFICULTY_OPTIONS = GRID_OPTIONS.slice(0, 4);
const TITLES = ["Easy", "Medium", "Hard", "Expert"] as const;

export type DifficultySelectionStepProps = {
  useCustomSource: boolean;
  selectedPackPuzzle: SamplePuzzle | null;
  customImageDataUrl: string | null;
  gridIndex: number;
  setGridIndex: (i: number) => void;
  onStart: (
    imageDataUrl: string,
    rows: number,
    cols: number,
    puzzleId: string | null,
  ) => void;
  showStartButton?: boolean;
  styles: Record<string, string>;
};

export function DifficultySelectionStep({
  useCustomSource,
  selectedPackPuzzle,
  customImageDataUrl,
  gridIndex,
  setGridIndex,
  onStart,
  showStartButton = true,
  styles,
}: DifficultySelectionStepProps) {
  const imageDataUrl = useCustomSource
    ? customImageDataUrl
    : selectedPackPuzzle?.fullImage ?? null;
  const puzzleId = useCustomSource ? null : selectedPackPuzzle?.id ?? null;

  const opt = DIFFICULTY_OPTIONS[gridIndex] ?? GRID_OPTIONS[1];
  const rows = opt.rows;
  const cols = opt.cols;

  const handleStart = () => {
    if (!imageDataUrl || rows < 1 || cols < 1) return;
    onStart(imageDataUrl, rows, cols, puzzleId);
  };

  if (!imageDataUrl) {
    return (
      <div className={styles.difficultyStep}>
        <p className={styles.stepSubtitle}>No image selected. Go back to choose one.</p>
      </div>
    );
  }

  const cellCount = rows * cols;

  return (
    <div className={styles.difficultyStep}>
      <div className={styles.previewWithGridWrap}>
        <img
          src={imageDataUrl}
          alt="Puzzle preview"
          className={styles.previewImage}
        />
        <div
          className={styles.gridOverlay}
          style={{
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {Array.from({ length: cellCount }, (_, i) => (
            <div key={i} className={styles.gridOverlayCell} />
          ))}
        </div>
      </div>

      <p className={styles.difficultyStepTitle}>Choose difficulty</p>
      <div className={styles.difficultyGrid}>
        {DIFFICULTY_OPTIONS.map((option, index) => {
          const title = TITLES[index] ?? option.label.split(" ")[0];
          const isActive = gridIndex === index;
          const pieces = option.rows * option.cols;
          return (
            <button
              key={index}
              type="button"
              className={`${styles.difficultyCard} ${isActive ? styles.difficultyCardActive : ""}`}
              onClick={() => setGridIndex(index)}
              aria-pressed={isActive}
              title={title}
            >
              <span className={styles.difficultyCardTitle}>{title}</span>
              <span className={styles.difficultyCardPieces}>{pieces} pieces</span>
              {isActive && (
                <span className={styles.difficultyCardActiveHint}>
                  <Sparkles size={14} />
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showStartButton && (
        <div className={styles.startRow}>
          <button
            type="button"
            className={styles.startBtn}
            onClick={handleStart}
            disabled={!imageDataUrl}
          >
            Start Puzzle
          </button>
        </div>
      )}
    </div>
  );
}
