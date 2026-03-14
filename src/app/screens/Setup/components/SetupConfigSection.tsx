/**
 * Setup screen config: difficulty suggestion/cards and custom grid inputs.
 */
import { Puzzle } from "lucide-react";
import { GRID_OPTIONS } from "../hooks";

export type SetupConfigSectionProps = {
  gridIndex: number;
  setGridIndex: (i: number) => void;
  customRows: number;
  setCustomRows: (n: number) => void;
  customCols: number;
  setCustomCols: (n: number) => void;
  isCustom: boolean;
  minGrid: number;
  maxGrid: number;
  styles: Record<string, string>;
  /** When true (pack flow), only show Easy/Medium/Hard/Expert; no custom grid. */
  packFlow?: boolean;
};

export function SetupConfigSection({
  gridIndex,
  setGridIndex,
  customRows,
  setCustomRows,
  customCols,
  setCustomCols,
  isCustom,
  minGrid,
  maxGrid,
  styles,
  packFlow = false,
}: SetupConfigSectionProps) {
  const primaryDifficulties = GRID_OPTIONS.slice(0, 4).map((opt, index) => ({
    index,
    title: ["Easy", "Medium", "Hard", "Expert"][index],
    rows: opt.rows,
    cols: opt.cols,
    pieces: opt.rows * opt.cols,
  }));
  const isAdvancedSelection = !packFlow && gridIndex >= primaryDifficulties.length;
  const selectedAdvanced = GRID_OPTIONS[gridIndex];
  const effectiveGridIndex = packFlow && gridIndex > 3 ? 1 : gridIndex;

  return (
    <>
      <section className={styles.difficultySection} aria-label="Difficulty">
        <p className={styles.configSectionLabel}>Difficulty</p>
        <div className={styles.difficultyGrid}>
          {primaryDifficulties.map((difficulty) => (
            <button
              key={difficulty.index}
              type="button"
              className={`${styles.difficultyCard} ${effectiveGridIndex === difficulty.index ? styles.difficultyCardActive : ""}`}
              onClick={() => setGridIndex(difficulty.index)}
              aria-pressed={effectiveGridIndex === difficulty.index}
              title={difficulty.title}
            >
              <span className={styles.difficultyCardTitle}>
                <Puzzle size={16} />
                {difficulty.title}
              </span>
              <span className={styles.difficultyCardPieces}>
                {difficulty.pieces} pieces
              </span>
            </button>
          ))}
          {isAdvancedSelection && (
            <button
              type="button"
              className={`${styles.difficultyCard} ${styles.difficultyCardActive}`}
              onClick={() => setGridIndex(gridIndex)}
              aria-pressed
              title={
                selectedAdvanced.rows > 0
                  ? selectedAdvanced.label.split(" ")[0]
                  : "Custom"
              }
            >
              <span className={styles.difficultyCardTitle}>
                <Puzzle size={16} />
                {selectedAdvanced.rows > 0
                  ? selectedAdvanced.label.split(" ")[0]
                  : "Custom"}
              </span>
              {selectedAdvanced.rows > 0 && (
                <span className={styles.difficultyCardPieces}>
                  {selectedAdvanced.rows * selectedAdvanced.cols} pieces
                </span>
              )}
            </button>
          )}
        </div>
      </section>

      {!packFlow && isCustom && (
        <div>
          <div className={styles.customGrid}>
            <label className={styles.customGridLabel}>
              Rows
              <input
                type="number"
                min={minGrid}
                max={maxGrid}
                value={customRows}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setCustomRows(
                    isNaN(v) ? minGrid : Math.min(maxGrid, Math.max(minGrid, v)),
                  );
                }}
                className={styles.customGridInput}
                title={`Rows (${minGrid}–${maxGrid})`}
                aria-label={`Rows, ${minGrid} to ${maxGrid}`}
              />
            </label>
            <span className={styles.customGridTimes}>×</span>
            <label className={styles.customGridLabel}>
              Cols
              <input
                type="number"
                min={minGrid}
                max={maxGrid}
                value={customCols}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setCustomCols(
                    isNaN(v) ? minGrid : Math.min(maxGrid, Math.max(minGrid, v)),
                  );
                }}
                className={styles.customGridInput}
                title={`Columns (${minGrid}–${maxGrid})`}
                aria-label={`Columns, ${minGrid} to ${maxGrid}`}
              />
            </label>
          </div>
          {customRows * customCols >= 81 && (
            <p className={styles.customGridHint}>
              Larger puzzles may run slower on some devices.
            </p>
          )}
        </div>
      )}
    </>
  );
}
