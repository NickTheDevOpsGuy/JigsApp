/**
 * CompletionOverlay – puzzle complete: time, share buttons, new puzzle, menu.
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
import { computeTimeDecayScore } from "../timeDecayScore";
import { checkAndUnlockAchievements } from "@/services/achievementsService";
import { getCompletionMessage, getCompletionBadge } from "@/data/completionMessages";
import { getCompletionGrade } from "@/data/completionGrades";
import type { TimeMode } from "../timeMode";
import {
  CONFETTI_COLORS_STREAK_3,
  CONFETTI_COLORS_STREAK_7,
} from "@/data/confettiColors";

interface ShareUrls {
  twitter: string;
  facebook: string;
  reddit: string;
  whatsapp: string;
}

interface CompletionOverlayProps {
  elapsedSeconds: number;
  countdownMinutes?: number;
  timeAttackBonus?: number;
  timeDecayBonus?: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  undoCount?: number;
  timeMode?: TimeMode;
  isNewBest?: boolean;
  isDaily?: boolean;
  isTimeAttack?: boolean;
  isTimeDecay?: boolean;
  shareUrls: ShareUrls;
  copied: boolean;
  canNativeShare: boolean;
  onOpenShareWindow: (url: string) => void;
  onCopyResults: () => void;
  onNativeShare: () => void;
  onDownloadImage: () => void;
  onNewPuzzle: () => void;
  onMenu: () => void;
  onReplay?: () => void;
}

export function CompletionOverlay({
  elapsedSeconds,
  countdownMinutes = 10,
  timeAttackBonus = 0,
  timeDecayBonus = 0,
  grid,
  imageUrl,
  undoCount = 0,
  timeMode = "elapsed",
  isNewBest = false,
  isDaily = false,
  isTimeAttack = false,
  isTimeDecay = false,
  shareUrls,
  copied,
  canNativeShare,
  onOpenShareWindow,
  onCopyResults,
  onNativeShare,
  onDownloadImage,
  onNewPuzzle,
  onMenu,
  onReplay,
}: CompletionOverlayProps) {
  const [streak, setStreak] = useState<number>(0);
  const completionMessage = getCompletionMessage(elapsedSeconds);
  const pieceCount = grid ? grid.rows * grid.cols : 0;
  const badge = getCompletionBadge(elapsedSeconds, undoCount, pieceCount);
  const timeDecayScoreForGrade =
    isTimeDecay && pieceCount > 0
      ? computeTimeDecayScore(elapsedSeconds, pieceCount, timeDecayBonus)
      : undefined;
  const grade =
    grid != null
      ? getCompletionGrade({
          elapsedSeconds,
          grid,
          timeMode,
          countdownMinutes,
          undoCount,
          timeDecayScore: timeDecayScoreForGrade,
        })
      : null;

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
      if (newStreak >= 3 || newStreak >= 7) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!prefersReducedMotion) {
          import("canvas-confetti").then((confetti) => {
            const colors =
              newStreak >= 7 ? CONFETTI_COLORS_STREAK_7 : CONFETTI_COLORS_STREAK_3;
            confetti.default({
              particleCount: 120,
              spread: 100,
              origin: { y: 0.5 },
              colors,
            });
          });
        }
      }
    }
  }, [isDaily, elapsedSeconds]);

  useEffect(() => {
    if (!grid) return;
    const run = async () => {
      const dailyStreak = isDaily ? getCurrentStreak() : 0;
      const countdownTotal = countdownMinutes * 60;
      const timeRemaining = Math.max(0, countdownTotal - elapsedSeconds);
      const timeAttackScore = isTimeAttack
        ? timeRemaining * 10 + timeAttackBonus
        : undefined;
      const pieceCount = grid.rows * grid.cols;
      const timeDecayScore = isTimeDecay
        ? computeTimeDecayScore(elapsedSeconds, pieceCount, timeDecayBonus)
        : undefined;
      const stats = await recordCompletion({
        elapsedSeconds,
        grid,
        isDaily: !!isDaily,
        isTimeAttack,
        timeAttackScore,
        isTimeDecay,
        timeDecayScore,
        dailyStreak,
      });
      if (stats) {
        await checkAndUnlockAchievements({
          puzzlesCompleted: stats.puzzlesCompleted,
          puzzlesUnder5Min: stats.puzzlesUnder5Min,
          dailyStreak: stats.dailyStreak,
          bestDailyStreak: stats.bestDailyStreak,
          lastCompletion: { elapsedSeconds, grid },
        });
      }
    };
    run();
  }, [
    elapsedSeconds,
    grid,
    isDaily,
    isTimeAttack,
    timeAttackBonus,
    isTimeDecay,
    timeDecayBonus,
    countdownMinutes,
  ]);

  const puzzleSizeText =
    grid != null
      ? `${grid.rows}×${grid.cols} puzzle · ${grid.rows * grid.cols} pieces`
      : null;

  return (
    <div className={styles.completeOverlay}>
      <div className={styles.completeContent}>
        <h2>🎉 {completionMessage}</h2>
        {imageUrl && (
          <div className={styles.completePreviewWrapper}>
            <img
              src={imageUrl}
              alt="Completed puzzle"
              className={styles.completePreviewImage}
            />
          </div>
        )}
        {grade != null && (
          <p className={styles.gradeBadge} aria-label={`Grade ${grade}`}>
            Grade <span className={styles[`grade${grade}`]}>{grade}</span>
          </p>
        )}
        {badge && (
          <p className={styles.puzzleSize} aria-hidden="true">
            {badge}
          </p>
        )}
        {puzzleSizeText != null && <p className={styles.puzzleSize}>{puzzleSizeText}</p>}
        <p>
          {isTimeDecay ? (
            <>
              Score: {computeTimeDecayScore(elapsedSeconds, pieceCount, timeDecayBonus)}
            </>
          ) : (
            <>Finished in {formatTime(elapsedSeconds)}</>
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

        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>Share your result:</p>

          {/* Social buttons */}
          <div className={styles.socialButtons}>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.twitter)}
              title="Share on X/Twitter"
            >
              𝕏
            </button>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.facebook)}
              title="Share on Facebook"
            >
              f
            </button>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.reddit)}
              title="Share on Reddit"
            >
              ⬆
            </button>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.whatsapp)}
              title="Share on WhatsApp"
            >
              💬
            </button>
          </div>

          {/* Utility buttons */}
          <div className={styles.shareButtons}>
            {onReplay && (
              <Button size="sm" onClick={onReplay}>
                ▶ Replay
              </Button>
            )}
            <Button size="sm" onClick={onDownloadImage}>
              <Download size={16} />
              Download
            </Button>
            <Button size="sm" onClick={onCopyResults}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            {canNativeShare && (
              <Button size="sm" onClick={onNativeShare}>
                <Share2 size={16} />
                More
              </Button>
            )}
          </div>

          <p className={styles.shareHint}>
            For LinkedIn: Download image + Copy text, then post manually
          </p>
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
