/**
 * CompletionOverlay – success screen with direct share actions.
 */
import React, { useEffect, useCallback, useState } from "react";
import { X, Clock, Share2, Send, Copy } from "lucide-react";
import styles from "../PlayScreen.module.css";
import type { Piece } from "@/puzzle/types";
import { getTodayDateString } from "@/daily/dailyPuzzleCore";
import { DailyReactions } from "@/components/DailyReactions";
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
  onGoHome?: () => void;
  onPlayAgain?: () => void;
  precisionModeEnabled?: boolean;
  avgPrecisionPx?: number | null;
  precisionBonusPoints?: number | null;
  uiTone?: "competitive" | "calm";
}

const _ANIM_PHASE_TITLE_MS = 0;
const ANIM_PHASE_SCALE_MS = 400;
const ANIM_PHASE_GLOW_MS = 700;
const ANIM_PHASE_TIME_MS = 1000;

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
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
  onGoHome: _onGoHome,
  onPlayAgain: _onPlayAgain,
  puzzleShareUrl = "/",
  copied,
}: CompletionOverlayProps) {
  const [animPhase, setAnimPhase] = useState<"title" | "scale" | "glow" | "time">(
    "title",
  );

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

  const { percentile } = data;

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

  const beatPercent =
    percentile && percentile.totalPlayers >= 1
      ? Math.round(100 - percentile.topPercent)
      : null;

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

        <h2 className={styles.completeTitleNew} aria-hidden="false">
          🎉 PUZZLE COMPLETE! 🎉
        </h2>

        <div
          className={`${styles.completeTimeBlock} ${animPhase === "time" ? styles.completeTimeVisible : ""}`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.completeTimeValue}>
            <Clock size={22} aria-hidden />
            {formatTime(elapsedSeconds)}
          </span>
          <span className={styles.completeTimeLabel}>Your Solve Time</span>
        </div>

        {imageUrl && (
          <div
            className={`${styles.completeImageWrapNew} ${animPhase !== "title" ? styles.completeImageScaled : ""} ${animPhase === "glow" || animPhase === "time" ? styles.completeImageGlow : ""}`}
          >
            <img
              src={imageUrl}
              alt="Completed puzzle"
              className={styles.completeImageNew}
            />
          </div>
        )}

        {beatPercent != null && (
          <div className={styles.completeStatsNew} role="status">
            <p className={styles.completeStatsLine}>
              🔥 You beat {beatPercent}% of players today
            </p>
          </div>
        )}

        <div className={styles.completePrimaryActions}>
          <button
            type="button"
            className={styles.completePrimaryBtn}
            onClick={onShareProgress ?? onCopyProgress ?? (() => {})}
            aria-label="Share Progress"
          >
            <Share2 size={20} />
            <span className={styles.completePrimaryBtnTitle}>Share Progress</span>
            <span className={styles.completePrimaryBtnSub}>Show your time + result</span>
          </button>
          <button
            type="button"
            className={styles.completePrimaryBtn}
            onClick={onShareChallenge ?? onCopyChallenge ?? (() => {})}
            aria-label="Send Challenge"
          >
            <Send size={20} />
            <span className={styles.completePrimaryBtnTitle}>Send Challenge</span>
            <span className={styles.completePrimaryBtnSub}>Same puzzle + difficulty</span>
          </button>
        </div>

        <div className={styles.shareResultPopupRow}>
          <button
            type="button"
            className={styles.shareResultPopupSideBtn}
            onClick={onCopyProgress ?? (() => {})}
          >
            <Copy size={18} />
            {copied ? "Copied" : "Copy Progress Link"}
          </button>
          <button
            type="button"
            className={styles.shareResultPopupSideBtn}
            onClick={onCopyChallenge ?? (() => {})}
          >
            <Copy size={18} />
            Copy Challenge Link
          </button>
        </div>

        {isDaily && <DailyReactions puzzleDate={getTodayDateString()} />}
      </div>
    </div>
  );
}
