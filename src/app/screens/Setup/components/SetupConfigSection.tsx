/**
 * Setup screen: difficulty suggestion, Difficulty/Time/Countdown dropdowns, custom grid, remember choice.
 */
import { Dropdown } from "@/components/DropDown/Dropdown";
import { GRID_OPTIONS } from "../hooks";
import { COUNTDOWN_OPTIONS, type TimeMode } from "../../Play/timeMode";
import { TIME_MODE_LABELS } from "../setupScreenConstants";

export type SetupConfigSectionProps = {
  suggestedGrid: { gridIndex: number; hint: string } | null;
  gridIndex: number;
  setGridIndex: (i: number) => void;
  customRows: number;
  setCustomRows: (n: number) => void;
  customCols: number;
  setCustomCols: (n: number) => void;
  isCustom: boolean;
  minGrid: number;
  maxGrid: number;
  timeMode: TimeMode;
  setTimeMode: (m: TimeMode) => void;
  countdownMinutes: number;
  setCountdownMinutes: (n: number) => void;
  rememberChoice: boolean;
  setRememberChoice: (v: boolean) => void;
  styles: Record<string, string>;
};

export function SetupConfigSection({
  suggestedGrid,
  gridIndex,
  setGridIndex,
  customRows,
  setCustomRows,
  customCols,
  setCustomCols,
  isCustom,
  minGrid,
  maxGrid,
  timeMode,
  setTimeMode,
  countdownMinutes,
  setCountdownMinutes,
  rememberChoice,
  setRememberChoice,
  styles,
}: SetupConfigSectionProps) {
  return (
    <>
      <div className={styles.difficultySuggestionSlot}>
        {suggestedGrid &&
          gridIndex !== suggestedGrid.gridIndex &&
          suggestedGrid.gridIndex < GRID_OPTIONS.length - 1 && (
            <button
              type="button"
              className={styles.difficultySuggestion}
              onClick={() => setGridIndex(suggestedGrid.gridIndex)}
            >
              {suggestedGrid.hint}
            </button>
          )}
      </div>
      <div className={styles.configGrid}>
        <Dropdown
          label="Difficulty"
          compact
          value={gridIndex}
          onChange={(val: string) => setGridIndex(Number(val))}
          options={GRID_OPTIONS.map((opt, i) => ({
            value: i,
            label:
              opt.rows > 0
                ? opt.label
                : `Custom (${customRows}×${customCols} – ${customRows * customCols} pieces)`,
          }))}
          fullWidth
        />

        <Dropdown
          label="Time"
          compact
          value={timeMode}
          onChange={(val: string) => setTimeMode(val as TimeMode)}
          options={(
            [
              "elapsed",
              "countdown",
              "active",
              "relaxed",
              "best",
              "speedrun",
              "timeattack",
            ] as TimeMode[]
          ).map((m) => ({ value: m, label: TIME_MODE_LABELS[m] }))}
          fullWidth
        />

        {timeMode === "countdown" && (
          <Dropdown
            label="Countdown"
            compact
            value={countdownMinutes}
            onChange={(val: string) => setCountdownMinutes(Number(val))}
            options={COUNTDOWN_OPTIONS.map((m) => ({
              value: m,
              label: `${m} min`,
            }))}
            fullWidth
          />
        )}
      </div>

      {isCustom && (
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

      <label className={styles.rememberLabel}>
        <input
          type="checkbox"
          checked={rememberChoice}
          onChange={(e) => setRememberChoice(e.target.checked)}
          className={styles.rememberCheckbox}
        />
        <span>Remember my choice</span>
      </label>
    </>
  );
}
