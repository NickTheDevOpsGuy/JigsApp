/**
 * CompletionOverlay – puzzle complete: time, share buttons, heatmap, new puzzle, menu.
 */
import React, { useEffect, useState } from "react";
import { Plus, Menu, Download, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";
import { formatTime } from "../playUtils";
import { setBestTime } from "../timeMode";
import {
  recordDailyCompletion,
  DAILY_DATE_KEY,
  getCurrentStreak,
} from "@/daily/dailyPuzzleCore";
import { recordCompletion } from "@/services/statsService";
import { checkAndUnlockAchievements } from "@/services/achievementsService";
import { getPercentileRank } from "@/services/leaderboardService";
import { getCompletionMessage, getCompletionBadge } from "@/data/completionMessages";
import type { Piece } from "@/puzzle/types";

type PieceCutType = "classic" | "irregular" | "hard";

interface CompletionOverlayProps {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  pieces?: Piece[];
  undoCount?: number;
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
}

/** Map dragCount to heat intensity 0–1 (blue=cold, red=hot). */
function heatIntensity(dragCount: number, maxCount: number): number {
  if (maxCount <= 0) return 0;
  return Math.min(1, dragCount / Math.max(1, maxCount));
}

/** Heatmap overlay: shows which pieces were moved most (red=hot, blue=cold). */
function HeatmapOverlay({
  grid,
  pieces,
}: {
  grid: { rows: number; cols: number };
  pieces: Piece[];
}) {
  const maxDrag = Math.max(1, ...pieces.map((p) => p.dragCount ?? 0));
  const tileW = 100 / grid.cols;
  const tileH = 100 / grid.rows;

  return (
    <div
      className={styles.heatmapOverlay}
      role="img"
      aria-label="Heatmap showing which pieces were moved most during play; red indicates many moves, blue indicates few"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
      }}
    >
      {pieces
        .filter((p) => !p.inTray)
        .sort((a, b) => a.row * grid.cols + a.col - (b.row * grid.cols + b.col))
        .map((p) => {
          const intensity = heatIntensity(p.dragCount ?? 0, maxDrag);
          const r = Math.round(255 * intensity);
          const b = Math.round(255 * (1 - intensity));
          const opacity = intensity > 0 ? 0.4 + intensity * 0.35 : 0;
          return (
            <div
              key={p.id}
              style={{
                background: `rgba(${r}, 60, ${b}, ${opacity})`,
              }}
            />
          );
        })}
    </div>
  );
}

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
  pieces = [],
  undoCount = 0,
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
}: CompletionOverlayProps) {
  const [streak, setStreak] = useState<number>(0);
  const [percentile, setPercentile] = useState<{
    topPercent: number;
    totalPlayers: number;
  } | null>(null);
  const completionMessage = getCompletionMessage(elapsedSeconds);
  const pieceCount = grid ? grid.rows * grid.cols : 0;
  const badge = getCompletionBadge(elapsedSeconds, undoCount, pieceCount);

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
        localStorage.removeItem(DAILY_DATE_KEY);
      } catch {
        // ignore
      }
    }
  }, [isDaily, elapsedSeconds]);

  useEffect(() => {
    if (!grid) return;
    getPercentileRank(grid.rows, grid.cols, elapsedSeconds).then(setPercentile);
  }, [grid?.rows, grid?.cols, elapsedSeconds]);

  useEffect(() => {
    if (!grid) return;
    const run = async () => {
      const dailyStreak = isDaily ? getCurrentStreak() : 0;
      const stats = await recordCompletion({
        elapsedSeconds,
        grid,
        isDaily: !!isDaily,
        dailyStreak,
        cutType,
      });
      if (stats) {
        await checkAndUnlockAchievements({
          puzzlesCompleted: stats.puzzlesCompleted,
          dailyStreak: stats.dailyStreak,
          bestDailyStreak: stats.bestDailyStreak,
          lastCompletion: { elapsedSeconds, grid },
        });
      }
    };
    run();
  }, [elapsedSeconds, grid, isDaily, cutType]);

  const puzzleSizeText =
    grid != null
      ? `${grid.rows}×${grid.cols} puzzle · ${grid.rows * grid.cols} pieces`
      : null;

  return (
    <div className={styles.completeOverlay}>
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
        {imageUrl && (
          <div className={styles.completePreviewWrapper}>
            <div className={styles.completePreviewInner}>
              <img
                src={imageUrl}
                alt="Completed puzzle"
                className={styles.completePreviewImage}
              />
              {grid && pieces.length > 0 && (
                <>
                  <HeatmapOverlay grid={grid} pieces={pieces} />
                  {(() => {
                    const maxDrag = Math.max(
                      0,
                      ...pieces.map((p) => p.dragCount ?? 0),
                    );
                    if (maxDrag > 0) {
                      return (
                        <p className={styles.heatmapCaption}>
                          My trickiest piece was moved {maxDrag} times!
                        </p>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        <div className={styles.shareSection}>
          {/* Primary CTA: Share Result */}
          {canNativeShare ? (
            <Button
              variant="primary"
              onClick={onNativeShare}
              className={styles.sharePrimary}
            >
              <Share2 size={20} />
              Share Result
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onCopyResults}
              className={styles.sharePrimary}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? "Copied!" : "Copy & Share"}
            </Button>
          )}
          {/* Secondary: Download, Copy (Copy only when primary is Share) */}
          <div className={styles.shareButtons}>
            <Button size="sm" variant="secondary" onClick={onDownloadImage}>
              <Download size={16} />
              Download
            </Button>
            {canNativeShare && (
              <Button size="sm" variant="secondary" onClick={onCopyResults}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            )}
          </div>
        </div>

        <div className={styles.completeActions}>
          <Button variant="primary" onClick={onNewPuzzle}>
            <Plus size={16} />
            New Puzzle
          </Button>
          <Button variant="secondary" onClick={onMenu}>
            <Menu size={16} />
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
