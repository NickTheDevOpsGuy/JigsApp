/**
 * CompletionOverlay – success screen with direct share actions.
 */
import React, { useEffect, useCallback, useState } from "react";
import { X, Clock, Trophy, Puzzle, Play } from "lucide-react";
import styles from "./CompletionOverlay.module.css";
import type { Piece } from "@/puzzle/types";
import { useCompletionOverlayData } from "./useCompletionOverlayData";
import { formatTime } from "../playUtils";

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
  puzzleShareUrl?: string;
  copied?: boolean;
  onShareProgress?: () => void;
  onShareChallenge?: () => void;
  onCopyProgress?: () => void;
  onCopyChallenge?: () => void;
  onDownloadImage: () => void;
  onClose: () => void;
  precisionModeEnabled?: boolean;
  avgPrecisionPx?: number | null;
  precisionBonusPoints?: number | null;
  uiTone?: "competitive" | "calm";
  /** Replay: show Replay button and call when clicked (dismiss overlay and start playback). */
  canReplay?: boolean;
  onReplayClick?: () => void;
  /** Next Puzzle: primary CTA to start a new puzzle (e.g. navigate to /new). */
  onNextPuzzle?: () => void;
}

const _ANIM_PHASE_TITLE_MS = 0;
const ANIM_PHASE_SCALE_MS = 400;
const ANIM_PHASE_GLOW_MS = 700;
const ANIM_PHASE_TIME_MS = 1000;

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
  pieces: _pieces,
  moveCount = 0,
  accuracyPercent = 100,
  usedHint = false,
  visualModifier = "none",
  isNewBest = false,
  isDaily = false,
  cutType = "classic",
  undoCount = 0,
  onShareProgress: _onShareProgress,
  onShareChallenge: _onShareChallenge,
  onCopyProgress: _onCopyProgress,
  onCopyChallenge: _onCopyChallenge,
  onDownloadImage: _onDownloadImage,
  onClose,
  precisionModeEnabled: _precisionModeEnabled,
  avgPrecisionPx: _avgPrecisionPx,
  precisionBonusPoints: _precisionBonusPoints,
  uiTone: _uiTone,
  puzzleShareUrl = "/",
  canReplay = false,
  onReplayClick,
  onNextPuzzle,
}: CompletionOverlayProps) {
  const [animPhase, setAnimPhase] = useState<"title" | "scale" | "glow" | "time">(
    "title",
  );
  const [imageError, setImageError] = useState(false);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useCompletionOverlayData({
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
    puzzleShareUrl,
  });

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimPhase("scale"), ANIM_PHASE_SCALE_MS);
    const t2 = setTimeout(() => setAnimPhase("glow"), ANIM_PHASE_GLOW_MS);
    const t3 = setTimeout(() => setAnimPhase("time"), ANIM_PHASE_TIME_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

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
      <div
        className={`${styles.completePanel} ${styles.completePanelNew}`}
        data-anim-phase={animPhase}
      >
        <button
          type="button"
          className={styles.completeCloseBtn}
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div className={styles.completeBanner} role="banner">
          <span className={styles.completeBannerIcon} aria-hidden>
            <Puzzle size={28} strokeWidth={2} />
          </span>
          <h2 className={styles.completeBannerTitle}>PUZZLE COMPLETE!</h2>
        </div>

        {imageUrl && !imageError && (
          <div
            className={`${styles.completeImageWrapNew} ${animPhase !== "title" ? styles.completeImageScaled : ""} ${animPhase === "glow" || animPhase === "time" ? styles.completeImageGlow : ""}`}
          >
            <img
              src={imageUrl}
              alt="Completed puzzle"
              className={styles.completeImageNew}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        <div className={styles.completeStatCards} role="status" aria-live="polite">
          <div className={styles.completeStatCard}>
            <Clock size={24} className={styles.completeStatCardIcon} aria-hidden />
            <span className={styles.completeStatCardLabel}>Time</span>
            <span className={styles.completeStatCardValue}>
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <div className={styles.completeStatCard}>
            <Puzzle size={24} className={styles.completeStatCardIcon} aria-hidden />
            <span className={styles.completeStatCardLabel}>Moves</span>
            <span className={styles.completeStatCardValue}>{moveCount}</span>
          </div>
        </div>

        {canReplay && onReplayClick && (
          <button
            type="button"
            className={styles.completeReplayBtn}
            onClick={onReplayClick}
            aria-label="Watch replay"
          >
            <Play size={18} aria-hidden />
            <span>Watch Replay</span>
          </button>
        )}

        {onNextPuzzle && (
          <button
            type="button"
            className={styles.completeNextPuzzleBtn}
            onClick={onNextPuzzle}
            aria-label="Next Puzzle"
          >
            <Trophy size={22} className={styles.completeNextPuzzleIcon} aria-hidden />
            <span className={styles.completeNextPuzzleTitle}>Next Puzzle</span>
          </button>
        )}
      </div>
    </div>
  );
}
