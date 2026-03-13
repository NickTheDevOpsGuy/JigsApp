import React from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/Button/Button";
import type { ImageSource } from "../setupScreenConstants";
import { SetupImageSourcePanel } from "./SetupImageSourcePanel";
import { SetupConfigSection } from "./SetupConfigSection";
import { SetupScreenHeader } from "./SetupScreenHeader";
import { SetupScreenPreview } from "./SetupScreenPreview";

export function SetupScreenShell(props: {
  styles: Record<string, string>;
  isPackFlow: boolean;
  selectedPuzzleName?: string;
  onClose: () => void;
  onBack: () => void;
  error: string | null;
  clearError: () => void;
  imageSource: ImageSource;
  setImageSource: React.Dispatch<React.SetStateAction<ImageSource>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  filteredPuzzles: import("@/data/packs/samplePuzzles").SamplePuzzle[];
  galleryRef: React.RefObject<HTMLDivElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  selectGalleryPuzzle: (p: import("@/data/packs/samplePuzzles").SamplePuzzle) => void;
  selectedPuzzle: import("@/data/packs/samplePuzzles").SamplePuzzle | null;
  isLoading: boolean;
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageUrlInput: string;
  setImageUrlInput: React.Dispatch<React.SetStateAction<string>>;
  onImportUrl: () => void;
  setFromBlob: (blob: Blob) => Promise<boolean>;
  selectedPieceCount: number;
  gridIndex: number;
  setGridIndex: React.Dispatch<React.SetStateAction<number>>;
  customRows: number;
  setCustomRows: React.Dispatch<React.SetStateAction<number>>;
  customCols: number;
  setCustomCols: React.Dispatch<React.SetStateAction<number>>;
  isCustom: boolean;
  minGrid: number;
  maxGrid: number;
  previewRef: React.RefObject<HTMLDivElement>;
  imgDataUrl: string | null;
  effectiveRows: number;
  effectiveCols: number;
  showGridPreview: boolean;
  setShowGridPreview: React.Dispatch<React.SetStateAction<boolean>>;
  onStart: () => void;
}) {
  const {
    styles,
    isPackFlow,
    selectedPuzzleName,
    onClose,
    onBack,
    error,
    clearError,
    imageSource,
    setImageSource,
    selectedCategory,
    setSelectedCategory,
    filteredPuzzles,
    galleryRef,
    canScrollLeft,
    canScrollRight,
    selectGalleryPuzzle,
    selectedPuzzle,
    isLoading,
    onPickFile,
    imageUrlInput,
    setImageUrlInput,
    onImportUrl,
    setFromBlob,
    selectedPieceCount,
    gridIndex,
    setGridIndex,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    isCustom,
    minGrid,
    maxGrid,
    previewRef,
    imgDataUrl,
    effectiveRows,
    effectiveCols,
    showGridPreview,
    setShowGridPreview,
    onStart,
  } = props;

  return (
    <div className={`${styles.page} ${isPackFlow ? styles.pagePackFlow : ""}`}>
      <div className={`${styles.card} ${isPackFlow ? styles.cardPackFlow : ""}`}>
        <div className={styles.cardBody}>
          <SetupScreenHeader
            styles={styles}
            isPackFlow={isPackFlow}
            selectedPuzzleName={selectedPuzzleName}
            onClose={onClose}
          />

          {error && (
            <div className={styles.error} role="alert">
              <span>{error}</span>
              <button
                type="button"
                className={styles.errorClose}
                onClick={clearError}
                aria-label="Dismiss error"
                title="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

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
            onPickFile={onPickFile}
            imageUrlInput={imageUrlInput}
            setImageUrlInput={setImageUrlInput}
            onImportUrl={onImportUrl}
            setFromBlob={setFromBlob}
            selectedPieceCount={selectedPieceCount}
            styles={styles}
          />

          <SetupConfigSection
            gridIndex={gridIndex}
            setGridIndex={setGridIndex}
            customRows={customRows}
            setCustomRows={setCustomRows}
            customCols={customCols}
            setCustomCols={setCustomCols}
            isCustom={isCustom}
            minGrid={minGrid}
            maxGrid={maxGrid}
            styles={styles}
          />

          <SetupScreenPreview
            styles={styles}
            isPackFlow={isPackFlow}
            previewRef={previewRef}
            isLoading={isLoading}
            imgDataUrl={imgDataUrl}
            effectiveRows={effectiveRows}
            effectiveCols={effectiveCols}
            showGridPreview={showGridPreview}
            setShowGridPreview={setShowGridPreview}
          />
        </div>

        <div
          className={`${styles.actionRow} ${isPackFlow ? styles.actionRowPackFlow : ""}`}
        >
          <Button
            className={styles.backActionBtn}
            onClick={onBack}
            aria-label="Back to menu"
            title={isPackFlow ? "Back to pack" : "Back to menu"}
          >
            <ArrowLeft size={18} />
            Back
          </Button>

          <Button
            variant="primary"
            size="sm"
            className={styles.startBtn}
            onClick={onStart}
            disabled={!imgDataUrl || isLoading}
            aria-label="Start puzzle"
            title={
              !imgDataUrl
                ? "Select an image first"
                : isLoading
                  ? "Loading image..."
                  : "Start puzzle"
            }
          >
            {isLoading ? "Loading..." : "Start Puzzle"}
            <Play size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
