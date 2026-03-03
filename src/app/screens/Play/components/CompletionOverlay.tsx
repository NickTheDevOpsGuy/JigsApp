/**
 * CompletionOverlay – success screen: title, time, image, stats, share/challenge, actions.
 * Share Result shows share panel inline (no modal). Challenge Friend triggers native share (text/SMS).
 */
import React, { useEffect, useCallback, useState } from "react";
import { X, Clock, Share2, Send, Copy, Image, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button/Button";
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
  onCopyResults?: () => void;
  onNativeShare?: () => void;
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
  onCopyResults,
  onDownloadImage,
  onClose,
  onGoHome: _onGoHome,
  onPlayAgain: _onPlayAgain,
  puzzleShareUrl = "/",
  copied,
  onNativeShare,
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

  const { sharePopupOpen, setSharePopupOpen, percentile, isGenerating, handleShareCard } =
    data;

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
        {imageUrl && (
          <button
            type="button"
            className={styles.completeCloseBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        )}

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

        {!sharePopupOpen ? (
          <>
            <div className={styles.completePrimaryActions}>
              <button
                type="button"
                className={styles.completePrimaryBtn}
                onClick={() => setSharePopupOpen(true)}
                aria-label="Share Result"
              >
                <Share2 size={20} />
                <span className={styles.completePrimaryBtnTitle}>Share Result</span>
              </button>
              <button
                type="button"
                className={styles.completePrimaryBtn}
                onClick={() => {
                  if (onNativeShare) onNativeShare();
                  else onCopyResults?.();
                }}
                aria-label="Challenge Friend"
              >
                <Send size={20} />
                <span className={styles.completePrimaryBtnTitle}>Challenge Friend</span>
              </button>
            </div>

            {isDaily && <DailyReactions puzzleDate={getTodayDateString()} />}
          </>
        ) : (
          <div className={styles.shareResultInline}>
            <button
              type="button"
              className={styles.shareResultInlineBack}
              onClick={() => setSharePopupOpen(false)}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <p className={styles.shareResultInlineHint}>
              Share a capture of your result (image) or the challenge link.
            </p>
            <div className={styles.shareResultPopupRow}>
              <Button
                variant="secondary"
                onClick={onCopyResults ?? (() => {})}
                className={styles.shareResultPopupSideBtn}
              >
                <Copy size={20} />
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleShareCard}
                disabled={isGenerating}
                className={styles.shareResultPopupSideBtn}
              >
                <Image size={20} />
                {isGenerating ? "…" : "Share Card"}
              </Button>
            </div>
            <button
              type="button"
              className={styles.shareResultPopupDownloadLink}
              onClick={() => {
                onDownloadImage();
                setSharePopupOpen(false);
              }}
            >
              <Download size={18} />
              Download image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
