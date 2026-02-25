/**
 * CompletionOverlay – puzzle complete: message, image, New Puzzle, Share. X or Esc to close.
 */
import React, { useEffect, useCallback, useState } from "react";
import { X, Plus, Share2, Copy, Check, Download, Menu, Image } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";
import { formatTime } from "../playUtils";
import { setBestTime } from "../timeMode";
import {
  recordDailyCompletion,
  DAILY_DATE_KEY,
  getCurrentStreak,
  getTodayDateString,
} from "@/daily/dailyPuzzleCore";
import { recordCompletion } from "@/services/statsService";
import { checkAndUnlockAchievements } from "@/services/achievementsService";
import { getPercentileRank } from "@/services/leaderboardService";
import { getCompletionMessage, getCompletionBadge } from "@/data/completionMessages";
import type { Piece } from "@/puzzle/types";
import { useShareCardImage } from "../hooks/useShareCardImage";

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
  copied: boolean;
  canNativeShare: boolean;
  onCopyResults: () => void;
  onNativeShare: () => void;
  onDownloadImage: () => void;
  onNewPuzzle: () => void;
  onMenu: () => void;
  onClose: () => void;
}

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
  pieces: _pieces = [],
  undoCount = 0,
  moveCount = 0,
  accuracyPercent = 100,
  usedHint = false,
  visualModifier = "none",
  isNewBest = false,
  isDaily = false,
  cutType = "classic",
  copied,
  canNativeShare,
  onCopyResults,
  onNativeShare,
  onDownloadImage,
  onNewPuzzle,
  onMenu,
  onClose,
}: CompletionOverlayProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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

  const [streak, setStreak] = useState<number>(0);
  const [masteryStreak, setMasteryStreak] = useState<number>(0);
  const [percentile, setPercentile] = useState<{
    topPercent: number;
    totalPlayers: number;
  } | null>(null);
  const [useSeasonalFrame, setUseSeasonalFrame] = useState(true);
  const { shareCard, isGenerating } = useShareCardImage();
  const isDesktop = useMediaQuery("(min-width: 601px)");
  const completionMessage = getCompletionMessage(elapsedSeconds);
  const pieceCount = grid ? grid.rows * grid.cols : 0;
  const badge = getCompletionBadge(elapsedSeconds, undoCount, pieceCount);
  const isMasteryDaily = isDaily && !usedHint && undoCount === 0;

  useEffect(() => {
    if (isNewBest && grid) {
      setBestTime(grid.rows, grid.cols, elapsedSeconds);
    }
  }, [isNewBest, grid, elapsedSeconds]);

  useEffect(() => {
    if (isDaily) {
      const newStreak = recordDailyCompletion(elapsedSeconds);
      setStreak(newStreak);
      try {
        const today = new Date(`${getTodayDateString()}T00:00:00.000Z`);
        const day = today.getUTCDay();
        const diffToMonday = day === 0 ? 6 : day - 1;
        today.setUTCDate(today.getUTCDate() - diffToMonday);
        const weekKey = today.toISOString().slice(0, 10);
        localStorage.setItem(`phuzzle:weeklyAlbumNudge:${weekKey}`, "true");
      } catch {
        // ignore
      }
      try {
        localStorage.removeItem(DAILY_DATE_KEY);
      } catch {
        // ignore
      }
    }
  }, [isDaily, elapsedSeconds]);

  useEffect(() => {
    if (!grid) return;
    getPercentileRank(grid.rows, grid.cols, elapsedSeconds, visualModifier).then(
      setPercentile,
    );
  }, [grid?.rows, grid?.cols, elapsedSeconds, visualModifier]);

  useEffect(() => {
    if (!grid) return;
    const run = async () => {
      const dailyStreak = isDaily ? getCurrentStreak() : 0;
      const stats = await recordCompletion({
        elapsedSeconds,
        grid,
        isDaily: !!isDaily,
        dailyStreak,
        usedUndo: undoCount > 0,
        usedHint,
        cutType,
        visualModifier,
      });
      if (stats) {
        setMasteryStreak(stats.masteryStreak ?? 0);
        await checkAndUnlockAchievements({
          puzzlesCompleted: stats.puzzlesCompleted,
          dailyStreak: stats.dailyStreak,
          bestDailyStreak: stats.bestDailyStreak,
          lastCompletion: { elapsedSeconds, grid },
        });
      }
    };
    run();
  }, [elapsedSeconds, grid, isDaily, cutType, undoCount, usedHint, visualModifier]);

  const puzzleSizeText =
    grid != null ? `${grid.rows}×${grid.cols} · ${grid.rows * grid.cols} pieces` : null;
  const handleShareCard = useCallback(async () => {
    await shareCard({
      imageUrl,
      elapsedSeconds,
      moveCount,
      accuracyPercent,
      percentile,
      useSeasonalFrame,
    });
  }, [
    shareCard,
    imageUrl,
    elapsedSeconds,
    moveCount,
    accuracyPercent,
    percentile,
    useSeasonalFrame,
  ]);

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
      <div className={styles.completeContent}>
        <h2>🎉 {completionMessage}</h2>
        {badge && (
          <p className={styles.puzzleSize} aria-hidden="true">
            {badge}
          </p>
        )}
        {puzzleSizeText != null && <p className={styles.puzzleSize}>{puzzleSizeText}</p>}
        <p>
          Finished in {formatTime(elapsedSeconds)}
          {percentile && percentile.totalPlayers >= 5 && (
            <span className={styles.percentileRank}> · Top {percentile.topPercent}%</span>
          )}
          {isNewBest && <span className={styles.newBest}> — New best!</span>}
          {isDaily && (
            <span className={styles.dailyBadge}>
              — Daily completed!
              {streak > 0 && (
                <span className={styles.streak}> {streak} day streak 🔥</span>
              )}
            </span>
          )}
        </p>
        {isMasteryDaily && (
          <p className={styles.dailyBadge}>
            🏅 Mastery clear — no hints, no undo!
            {masteryStreak > 0 && (
              <span className={styles.streak}>
                {" "}
                {masteryStreak} day mastery streak ⚡
              </span>
            )}
          </p>
        )}
        {imageUrl && (
          <div className={styles.completePreviewWrapper}>
            <img
              src={imageUrl}
              alt="Completed puzzle"
              className={styles.completePreviewImage}
            />
          </div>
        )}

        <div className={styles.completeActions}>
          <div className={styles.completeActionsPrimary}>
            <Button variant="primary" onClick={onNewPuzzle}>
              <Plus size={18} />
              New Puzzle
            </Button>
            {canNativeShare ? (
              <Button variant="secondary" onClick={onNativeShare}>
                <Share2 size={18} />
                Share Result
              </Button>
            ) : (
              <Button variant="secondary" onClick={onCopyResults}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied!" : "Share Result"}
              </Button>
            )}
            <Button variant="secondary" onClick={handleShareCard} disabled={isGenerating}>
              <Image size={18} />
              {isGenerating ? "Generating..." : "Share Card PNG"}
            </Button>
            <label className={styles.shareCardToggle}>
              <input
                type="checkbox"
                checked={useSeasonalFrame}
                onChange={(e) => setUseSeasonalFrame(e.target.checked)}
              />
              Seasonal frame
            </label>
          </div>
          {isDesktop && (
            <div className={styles.completeActionsSecondary}>
              <Button size="sm" variant="secondary" onClick={onDownloadImage}>
                <Download size={16} />
                Download
              </Button>
              <Button size="sm" variant="secondary" onClick={onMenu}>
                <Menu size={16} />
                Menu
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
