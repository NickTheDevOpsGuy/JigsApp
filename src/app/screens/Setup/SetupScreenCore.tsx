/**
 * SetupScreen – image picker (gallery/upload/camera), grid config, and launch to Play.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "@/screens/Setup/styles/SetupScreen.module.css";
import { SAMPLE_PUZZLES } from "@/data/packs/samplePuzzles";
import { setCurrentPuzzleId } from "@/data/packs/packCompletion";
import {
  useImagePicker,
  useGridConfig,
  GRID_OPTIONS,
  useSetupScreenGalleryScroll,
} from "./hooks";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { STORAGE_KEY, type ImageSource } from "./setupScreenConstants";
import { logger } from "@/utils/logger";
import { SetupScreenShell } from "./components/SetupScreenShell";

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
    minGrid,
    maxGrid,
  } = useGridConfig();

  const {
    imgDataUrl,
    error,
    setError,
    isLoading,
    selectedPuzzle,
    clearError,
    selectGalleryPuzzle,
    pickFile,
    setFromBlob,
    validateBeforeStart,
  } = useImagePicker({
    gridRows: effectiveRows,
    gridCols: effectiveCols,
  });

  const filteredPuzzles =
    selectedCategory === "all"
      ? SAMPLE_PUZZLES
      : SAMPLE_PUZZLES.filter((p) => p.category === selectedCategory);
  const previewRef = useRef<HTMLDivElement>(null);
  const { galleryRef, canScrollLeft, canScrollRight } = useSetupScreenGalleryScroll([
    filteredPuzzles.length,
    selectedCategory,
  ]);

  useEffect(() => {
    if (imgDataUrl && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [imgDataUrl]);

  useEffect(() => {
    if (!puzzleIdParam) return;
    const puzzle = SAMPLE_PUZZLES.find((p) => p.id === puzzleIdParam);
    if (!puzzle) return;
    setImageSource("gallery");
    setSelectedCategory(puzzle.category);
    selectGalleryPuzzle(puzzle);
    setCurrentPuzzleId(puzzleIdParam);
  }, [puzzleIdParam, selectGalleryPuzzle]);

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
    setGridIndex(GRID_OPTIONS.length - 1);
    setCustomRows(Math.min(maxGrid, Math.max(minGrid, rows)));
    setCustomCols(Math.min(maxGrid, Math.max(minGrid, cols)));
  }, [gridParam, maxGrid, minGrid, setCustomCols, setCustomRows, setGridIndex]);

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
      safeLocalStorage.setItem(GRID_ONCE_KEY, `${effectiveRows}x${effectiveCols}`);
      saveGrid();
      safeLocalStorage.removeItem("phuzzle:dailyDate");
      setCurrentPuzzleId(selectedPuzzle?.id ?? null);
      nav("/play");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (import.meta.env.DEV) logger.error("Could not save", e);
      setError(msg || "Could not save. Please try again.");
    }
  };

  const isPackFlow = !!puzzleIdParam;

  return (
    <SetupScreenShell
      styles={styles}
      isPackFlow={isPackFlow}
      selectedPuzzleName={selectedPuzzle?.name}
      onClose={() => nav(isPackFlow ? "/packs" : "/")}
      onBack={() => nav(isPackFlow ? "/packs" : "/")}
      error={error}
      clearError={clearError}
      imageSource={imageSource}
      setImageSource={setImageSource}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      filteredPuzzles={filteredPuzzles}
      galleryRef={galleryRef as import("react").RefObject<HTMLDivElement>}
      canScrollLeft={canScrollLeft}
      canScrollRight={canScrollRight}
      selectGalleryPuzzle={selectGalleryPuzzle}
      selectedPuzzle={selectedPuzzle}
      isLoading={isLoading}
      onPickFile={handlePickFile}
      setFromBlob={setFromBlob}
      selectedPieceCount={effectiveRows * effectiveCols}
      gridIndex={gridIndex}
      setGridIndex={setGridIndex}
      customRows={customRows}
      setCustomRows={setCustomRows}
      customCols={customCols}
      setCustomCols={setCustomCols}
      isCustom={isCustom}
      minGrid={minGrid}
      maxGrid={maxGrid}
      previewRef={previewRef as import("react").RefObject<HTMLDivElement>}
      imgDataUrl={imgDataUrl}
      effectiveRows={effectiveRows}
      effectiveCols={effectiveCols}
      showGridPreview={showGridPreview}
      setShowGridPreview={setShowGridPreview}
      onStart={handleStart}
    />
  );
}

export default SetupScreen;
