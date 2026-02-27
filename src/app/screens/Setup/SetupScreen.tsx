/**
 * SetupScreen – image picker (gallery/upload/camera), grid config, time mode, launch to Play.
 *
 * Sections: 1–220 GalleryThumbnail + state + useImagePicker/useGridConfig + effects;
 * 221–350 handleStart/handleClear + scroll/gallery logic; 351–531 main JSX (card, gallery, preview, buttons).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./SetupScreen.module.css";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import { setCurrentPuzzleId } from "@/data/packCompletion";
import { Button } from "@/components/Button/Button";
import { Dropdown } from "@/components/DropDown/Dropdown";
import { ArrowLeft, Trash2, Play } from "lucide-react";
import {
  useImagePicker,
  useGridConfig,
  useSetupScreenGalleryScroll,
  GRID_OPTIONS,
  GRID_KEY,
} from "./hooks";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { useTimeModeConfig } from "../Play/hooks/useTimeModeConfig";
import { COUNTDOWN_OPTIONS, getBestTime, type TimeMode } from "../Play/timeMode";
import { getAdaptiveSuggestion } from "@/services/adaptiveDifficultyService";
import { GRID_ONCE_KEY } from "../Play/playScreenUtils";
import { TIME_MODE_LABELS, STORAGE_KEY, type ImageSource } from "./setupScreenConstants";
import { SetupImageSourcePanel } from "./components/SetupImageSourcePanel";

export function SetupScreen() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get("source");
  const puzzleIdParam = searchParams.get("puzzle");
  const [imageSource, setImageSource] = useState<ImageSource>(
    sourceParam === "camera" ? "camera" : sourceParam === "upload" ? "upload" : "gallery",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    gridIndex,
    setGridIndex,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    isCustom,
    effectiveRows,
    effectiveCols,
    saveGrid,
    clearGrid,
    minGrid,
    maxGrid,
  } = useGridConfig();

  const [rememberChoice, setRememberChoice] = useState(
    () => !!safeLocalStorage.getItem(GRID_KEY),
  );

  const {
    imgDataUrl,
    setImgDataUrl,
    error,
    setError,
    isLoading,
    selectedPuzzle,
    clearError,
    selectGalleryPuzzle,
    pickFile,
    setFromBlob,
    clearImage,
    validateBeforeStart,
  } = useImagePicker({
    gridRows: effectiveRows,
    gridCols: effectiveCols,
  });

  const { timeMode, setTimeMode, countdownMinutes, setCountdownMinutes } =
    useTimeModeConfig();

  const suggestedGrid = useMemo(() => getAdaptiveSuggestion(getBestTime), []);
  const filteredPuzzles =
    selectedCategory === "all"
      ? SAMPLE_PUZZLES
      : SAMPLE_PUZZLES.filter((p) => p.category === selectedCategory);
  const previewRef = useRef<HTMLDivElement>(null);
  const { galleryRef, canScrollLeft, canScrollRight } = useSetupScreenGalleryScroll([
    filteredPuzzles.length,
    selectedCategory,
  ]);

  // Scroll preview into view when image is selected
  useEffect(() => {
    if (imgDataUrl && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [imgDataUrl]);

  // Load existing image on mount
  useEffect(() => {
    const existingImg = safeLocalStorage.getItem(STORAGE_KEY);
    if (existingImg) setImgDataUrl(existingImg);
  }, [setImgDataUrl]);

  // Pre-select puzzle when navigating from pack (?puzzle=id)
  useEffect(() => {
    if (!puzzleIdParam) return;
    const puzzle = SAMPLE_PUZZLES.find((p) => p.id === puzzleIdParam);
    if (puzzle) {
      setImageSource("gallery");
      setSelectedCategory(puzzle.category);
      selectGalleryPuzzle(puzzle);
      setCurrentPuzzleId(puzzleIdParam);
    }
  }, [puzzleIdParam, selectGalleryPuzzle]);

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await pickFile(file);
    if (!success) e.currentTarget.value = "";
  };

  const handleStart = async () => {
    if (!imgDataUrl) return;

    const valid = await validateBeforeStart(effectiveRows, effectiveCols);
    if (!valid) return;

    try {
      safeLocalStorage.setItem(STORAGE_KEY, imgDataUrl);
      // Always pin the selected grid for the very next run.
      safeLocalStorage.setItem(GRID_ONCE_KEY, `${effectiveRows}x${effectiveCols}`);
      if (rememberChoice) {
        saveGrid();
      } else {
        clearGrid();
      }
      safeLocalStorage.removeItem("phuzzle:dailyDate");
      if (selectedPuzzle) setCurrentPuzzleId(selectedPuzzle.id);
      else setCurrentPuzzleId(null);
      nav("/play");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (import.meta.env.DEV) console.error("Could not save", e);
      setError(msg || "Could not save. Please try again.");
    }
  };

  const handleClear = () => {
    safeLocalStorage.removeItem(STORAGE_KEY);
    setCurrentPuzzleId(null);
    clearImage();
  };

  const isPackFlow = !!puzzleIdParam;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <h1 className={styles.title}>
            {isPackFlow && selectedPuzzle ? selectedPuzzle.name : "🧩 New Puzzle"}
          </h1>

          {error && (
            <div className={styles.error} role="alert">
              <span>{error}</span>
              <button
                type="button"
                className={styles.errorClose}
                onClick={clearError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Standard workflow: source tabs + gallery/upload/camera */}
          {!isPackFlow && (
            <SetupImageSourcePanel
              imageSource={imageSource}
              setImageSource={setImageSource}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredPuzzles={filteredPuzzles}
              galleryRef={galleryRef}
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              selectGalleryPuzzle={selectGalleryPuzzle}
              selectedPuzzle={selectedPuzzle}
              isLoading={isLoading}
              onPickFile={handlePickFile}
              setFromBlob={setFromBlob}
              styles={styles}
            />
          )}

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

          <div className={styles.preview} ref={previewRef}>
            {isLoading ? (
              <div className={styles.previewEmpty}>Loading...</div>
            ) : imgDataUrl ? (
              <img className={styles.previewImg} src={imgDataUrl} alt="Preview" />
            ) : (
              <div className={styles.previewEmpty}>Select an image above</div>
            )}
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button onClick={() => nav("/")} aria-label="Back to menu">
            <ArrowLeft size={18} />
            Back
          </Button>

          <Button onClick={handleClear} disabled={isLoading} aria-label="Clear image">
            <Trash2 size={18} />
            Clear
          </Button>

          <Button
            variant="primary"
            size="sm"
            className={styles.startBtn}
            onClick={handleStart}
            disabled={isLoading || !imgDataUrl}
            aria-label="Start puzzle"
          >
            <Play size={18} />
            Start Puzzle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SetupScreen;
