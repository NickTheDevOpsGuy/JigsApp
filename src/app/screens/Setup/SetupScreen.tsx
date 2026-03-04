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
import { ArrowLeft, Trash2, Play, Grid3X3 } from "lucide-react";
import {
  useImagePicker,
  useGridConfig,
  useSetupScreenGalleryScroll,
  GRID_KEY,
  GRID_OPTIONS,
} from "./hooks";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { useTimeModeConfig } from "../Play/hooks/useTimeModeConfig";
import { getBestTime } from "../Play/timeMode";
import { getAdaptiveSuggestion } from "@/services/adaptiveDifficultyService";
import { GRID_ONCE_KEY } from "../Play/playScreenUtils";
import { STORAGE_KEY, type ImageSource } from "./setupScreenConstants";
import { SetupImageSourcePanel } from "./components/SetupImageSourcePanel";
import { SetupConfigSection } from "./components/SetupConfigSection";

/** Grid preview overlay to show where cuts will land */
function GridPreviewOverlay({
  rows,
  cols,
  visible,
}: {
  rows: number;
  cols: number;
  visible: boolean;
}) {
  if (!visible || rows < 2 || cols < 2) return null;

  const lines = [];

  // Vertical lines (cols - 1 lines)
  for (let c = 1; c < cols; c++) {
    const pct = (c / cols) * 100;
    lines.push(
      <div
        key={`v-${c}`}
        className={styles.gridLine}
        style={{
          left: `${pct}%`,
          top: 0,
          bottom: 0,
          width: "2px",
        }}
      />,
    );
  }

  // Horizontal lines (rows - 1 lines)
  for (let r = 1; r < rows; r++) {
    const pct = (r / rows) * 100;
    lines.push(
      <div
        key={`h-${r}`}
        className={styles.gridLine}
        style={{
          top: `${pct}%`,
          left: 0,
          right: 0,
          height: "2px",
        }}
      />,
    );
  }

  return <div className={styles.gridOverlay}>{lines}</div>;
}

export function SetupScreen() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get("source");
  const puzzleIdParam = searchParams.get("puzzle");
  const gridParam = searchParams.get("grid");
  const [imageSource, setImageSource] = useState<ImageSource>(
    sourceParam === "camera" ? "camera" : sourceParam === "upload" ? "upload" : "gallery",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showGridPreview, setShowGridPreview] = useState(true);

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

  // Apply grid from query (?grid=RxC) so challenge links can prefill exact difficulty.
  useEffect(() => {
    if (!gridParam) return;
    const m = gridParam.toLowerCase().match(/^(\d+)x(\d+)$/);
    if (!m) return;
    const rows = Number(m[1]);
    const cols = Number(m[2]);
    if (!Number.isFinite(rows) || !Number.isFinite(cols)) return;

    const presetIdx = GRID_OPTIONS.findIndex((g) => g.rows === rows && g.cols === cols);
    if (presetIdx >= 0) {
      setGridIndex(presetIdx);
      return;
    }
    const customIdx = GRID_OPTIONS.length - 1;
    setGridIndex(customIdx);
    setCustomRows(Math.min(maxGrid, Math.max(minGrid, rows)));
    setCustomCols(Math.min(maxGrid, Math.max(minGrid, cols)));
  }, [gridParam, setGridIndex, setCustomRows, setCustomCols, minGrid, maxGrid]);

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

          <SetupConfigSection
            suggestedGrid={suggestedGrid}
            gridIndex={gridIndex}
            setGridIndex={setGridIndex}
            customRows={customRows}
            setCustomRows={setCustomRows}
            customCols={customCols}
            setCustomCols={setCustomCols}
            isCustom={isCustom}
            minGrid={minGrid}
            maxGrid={maxGrid}
            timeMode={timeMode}
            setTimeMode={setTimeMode}
            countdownMinutes={countdownMinutes}
            setCountdownMinutes={setCountdownMinutes}
            rememberChoice={rememberChoice}
            setRememberChoice={setRememberChoice}
            styles={styles}
          />

          <div className={styles.preview} ref={previewRef}>
            {isLoading ? (
              <div className={styles.previewEmpty}>Loading...</div>
            ) : imgDataUrl ? (
              <div className={styles.previewImageWrap}>
                <img className={styles.previewImg} src={imgDataUrl} alt="Preview" />
                <GridPreviewOverlay
                  rows={effectiveRows}
                  cols={effectiveCols}
                  visible={showGridPreview}
                />
                <button
                  type="button"
                  className={`${styles.gridToggleBtn} ${showGridPreview ? styles.gridToggleBtnActive : ""}`}
                  onClick={() => setShowGridPreview((v) => !v)}
                  title={showGridPreview ? "Hide grid preview" : "Show grid preview"}
                  aria-label={showGridPreview ? "Hide grid preview" : "Show grid preview"}
                >
                  <Grid3X3 size={18} />
                </button>
              </div>
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
