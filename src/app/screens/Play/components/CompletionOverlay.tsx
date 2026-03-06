/**
 * CompletionOverlay – success screen with direct share actions.
 */
import React, { useEffect, useCallback, useState } from "react";
import { X, Clock, Share2, Send } from "lucide-react";
import styles from "./CompletionOverlay.module.css";
import type { Piece } from "@/puzzle/types";
import { useCompletionOverlayData } from "./useCompletionOverlayData";
import { formatTime } from "../playUtils";
import { CompletionStatsBlock } from "./CompletionStatsBlock";

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
}

const _ANIM_PHASE_TITLE_MS = 0;
const ANIM_PHASE_SCALE_MS = 400;
const ANIM_PHASE_GLOW_MS = 700;
const ANIM_PHASE_TIME_MS = 1000;

function getDifficultyLabel(pieceCount: number): string {
  if (pieceCount <= 9) return "Easy";
  if (pieceCount <= 16) return "Medium";
  if (pieceCount <= 25) return "Hard";
  if (pieceCount <= 36) return "Expert";
  if (pieceCount <= 49) return "Master";
  if (pieceCount <= 64) return "Legend";
  return "Extreme";
}

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
  pieces,
  moveCount = 0,
  accuracyPercent = 100,
  usedHint = false,
  visualModifier = "none",
  isNewBest = false,
  isDaily = false,
  cutType = "classic",
  undoCount = 0,
  onShareProgress,
  onShareChallenge,
  onCopyProgress,
  onCopyChallenge,
  onDownloadImage: _onDownloadImage,
  onClose,
  precisionModeEnabled,
  avgPrecisionPx,
  precisionBonusPoints,
  uiTone: _uiTone,
  puzzleShareUrl = "/",
}: CompletionOverlayProps) {
  const [animPhase, setAnimPhase] = useState<"title" | "scale" | "glow" | "time">(
    "title",
  );
  const [imageError, setImageError] = useState(false);

  const handleClose = useCallback(() => onClose(), [onClose]);

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
    puzzleShareUrl,
  });

  const { percentile, rankPosition, handleShareResultCard, handleShareChallengeCard } =
    data;

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

  const pieceCount = grid ? grid.rows * grid.cols : (pieces?.length ?? 0);
  const metaParts: string[] = [];
  if (pieceCount > 0) {
    metaParts.push(`${pieceCount} pieces`);
    metaParts.push(getDifficultyLabel(pieceCount));
  }
  if (grid) metaParts.push(`${grid.cols} x ${grid.rows}`);
  const puzzleMeta = metaParts.join(" • ");
  const completionNote = isDaily
    ? "Nice solve. Share it if you want to compare times."
    : "Nice solve. Share this puzzle with people.";

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

        <h2 className={styles.completeTitleNew}>Puzzle Complete</h2>
        {puzzleMeta && <p className={styles.completeSubtitleNew}>{puzzleMeta}</p>}

        <div
          className={`${styles.completeTimeBlock} ${animPhase === "time" ? styles.completeTimeVisible : ""}`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.completeTimeValue}>
            <Clock size={22} aria-hidden />
            {formatTime(elapsedSeconds)}
          </span>
          <span className={styles.completeTimeLabel}>Solved in</span>
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

        <CompletionStatsBlock
          elapsedSeconds={elapsedSeconds}
          moveCount={moveCount}
          accuracyPercent={accuracyPercent}
          percentile={percentile}
          rankPosition={rankPosition}
          hideTime
          precisionModeEnabled={precisionModeEnabled}
          avgPrecisionPx={avgPrecisionPx}
          precisionBonusPoints={precisionBonusPoints}
        />

        <div className={styles.completeStatsNew} role="status">
          <p className={styles.completeStatsLine}>{completionNote}</p>
        </div>

        <div className={styles.completePrimaryActions}>
          <button
            type="button"
            className={styles.completePrimaryBtn}
            onClick={
              handleShareResultCard ?? onShareProgress ?? onCopyProgress ?? (() => {})
            }
            aria-label="Share Result"
          >
            <Share2 size={20} />
            <span className={styles.completePrimaryBtnTitle}>Share Result</span>
            <span className={styles.completePrimaryBtnSub}>
              Time, moves, and accuracy
            </span>
          </button>
          <button
            type="button"
            className={styles.completePrimaryBtn}
            onClick={
              handleShareChallengeCard ??
              onShareChallenge ??
              onCopyChallenge ??
              (() => {})
            }
            aria-label="Share with People"
          >
            <Send size={20} />
            <span className={styles.completePrimaryBtnTitle}>Share with People</span>
            <span className={styles.completePrimaryBtnSub}>
              Same puzzle and difficulty
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
