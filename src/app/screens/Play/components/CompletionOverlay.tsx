/**
 * CompletionOverlay – puzzle complete: image, stats, "Can you beat my run?", actions.
 */
import React, { useEffect, useCallback } from "react";
import { X, Trophy } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import styles from "../PlayScreen.module.css";
import type { Piece } from "@/puzzle/types";
import { getTodayDateString } from "@/daily/dailyPuzzleCore";
import { DailyReactions } from "@/components/DailyReactions";
import { CompletionSharePopup } from "./CompletionSharePopup";
import { CompletionStatsBlock } from "./CompletionStatsBlock";
import { CompletionOverlayActions } from "./CompletionOverlayActions";
import { CompleteShareUrl } from "./CompleteShareUrl";
import { useCompletionConfetti } from "./useCompletionConfetti";
import { useCompletionOverlayData } from "./useCompletionOverlayData";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type PieceCutType = "classic" | "irregular" | "hard";
type VisualModifier = "none" | "fog" | "night" | "sepia";

interface CompletionOverlayProps {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  pieces?: Piece[];
  undoCount?: number;
  moveCount?: number;
  accuracyPercent?: number;
  usedHint?: boolean;
  visualModifier?: VisualModifier;
  isNewBest?: boolean;
  isDaily?: boolean;
  cutType?: PieceCutType;
  copied?: boolean;
  canNativeShare?: boolean;
  onCopyResults?: () => void;
  onNativeShare?: () => void;
  onDownloadImage: () => void;
  onClose: () => void;
  onGoHome?: () => void;
  onPlayAgain?: () => void;
}

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
  undoCount = 0,
  moveCount = 0,
  accuracyPercent = 100,
  usedHint = false,
  visualModifier = "none",
  isNewBest = false,
  isDaily = false,
  cutType = "classic",
  onDownloadImage,
  onClose,
  onGoHome,
  onPlayAgain,
}: CompletionOverlayProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleGoHome = useCallback(() => {
    onClose();
    onGoHome?.();
  }, [onClose, onGoHome]);
  const handlePlayAgain = useCallback(() => {
    onClose();
    onPlayAgain?.();
  }, [onClose, onPlayAgain]);

  useCompletionConfetti();

  const data = useCompletionOverlayData({
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    accuracyPercent,
    usedHint,
    visualModifier,
    isNewBest,
    isDaily,
    cutType,
    undoCount,
  });

  const {
    sharePopupOpen,
    setSharePopupOpen,
    useSeasonalFrame,
    setUseSeasonalFrame,
    percentile,
    rankPosition,
    percentileBadgeTier,
    isGenerating,
    handleShareCard,
  } = data;

  const isNarrow = useMediaQuery("(max-width: 500px), (max-height: 600px)");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div className={styles.completeOverlay}>
      <button
        type="button"
        className={styles.completeCloseBtn}
        onClick={handleClose}
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className={styles.completePanel}>
        <h2 className={styles.completeTitle}>
          <span className={styles.completeTitleDot} aria-hidden="true">
            •
          </span>
          Puzzle Completed!
          <span className={styles.completeTitleDot} aria-hidden="true">
            •
          </span>
        </h2>

        {percentileBadgeTier && (
          <div
            className={styles.completePercentileBadge}
            role="status"
            aria-label={`Ranking: ${percentileBadgeTier}`}
          >
            <Trophy size={18} aria-hidden />
            <span>{percentileBadgeTier}</span>
          </div>
        )}

        {imageUrl && (
          <div className={styles.completeImageWrap}>
            <img src={imageUrl} alt="Completed puzzle" className={styles.completeImage} />
          </div>
        )}

        <CompletionStatsBlock
          elapsedSeconds={elapsedSeconds}
          moveCount={moveCount}
          accuracyPercent={accuracyPercent}
          percentile={percentile}
          rankPosition={rankPosition}
        />

        <p className={styles.completeChallenge}>Can you beat my run?</p>

        <div className={styles.completeShareSection}>
          <CompletionOverlayActions
            onClose={handleClose}
            onPlayAgain={onPlayAgain != null ? handlePlayAgain : undefined}
            onGoHome={onGoHome != null ? handleGoHome : undefined}
            onShareClick={() => setSharePopupOpen(true)}
            isNarrow={isNarrow}
          />
          <CompleteShareUrl />
        </div>

        {isDaily && <DailyReactions puzzleDate={getTodayDateString()} />}
      </div>

      <Modal
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        title="Share Result"
        showCloseButton
      >
        <CompletionSharePopup
          useSeasonalFrame={useSeasonalFrame}
          setUseSeasonalFrame={setUseSeasonalFrame}
          onShareCard={handleShareCard}
          isGenerating={isGenerating}
          onDownload={() => {
            onDownloadImage();
            setSharePopupOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
