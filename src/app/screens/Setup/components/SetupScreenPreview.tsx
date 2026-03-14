import React from "react";
import { Grid3X3 } from "lucide-react";
import { GridPreviewOverlay } from "./GridPreviewOverlay";

export function SetupScreenPreview(props: {
  styles: Record<string, string>;
  isPackFlow: boolean;
  previewRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  imgDataUrl: string | null;
  effectiveRows: number;
  effectiveCols: number;
  selectedPieceCount: number;
  selectedPuzzleName?: string;
  showGridPreview: boolean;
  setShowGridPreview: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    styles,
    isPackFlow,
    previewRef,
    isLoading,
    imgDataUrl,
    effectiveRows,
    effectiveCols,
    selectedPieceCount,
    selectedPuzzleName,
    showGridPreview,
    setShowGridPreview,
  } = props;

  return (
    <div
      className={`${styles.preview} ${isPackFlow ? styles.previewPackFlow : ""}`}
      ref={previewRef}
    >
      {isLoading ? (
        <div className={styles.previewEmpty}>Loading...</div>
      ) : imgDataUrl ? (
        <div className={styles.previewStage}>
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
        </div>
      ) : (
        <div className={styles.previewEmpty}>Select an image above</div>
      )}
    </div>
  );
}
