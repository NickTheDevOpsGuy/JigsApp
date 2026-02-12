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
} from "@/daily/dailyPuzzle";
import { recordCompletion } from "@/services/statsService";
import { checkAndUnlockAchievements } from "@/services/achievementsService";
import { getCompletionMessage } from "@/data/completionMessages";

interface ShareUrls {
  twitter: string;
  facebook: string;
  reddit: string;
  whatsapp: string;
}

interface CompletionOverlayProps {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  isNewBest?: boolean;
  isDaily?: boolean;
  shareUrls: ShareUrls;
  copied: boolean;
  canNativeShare: boolean;
  onOpenShareWindow: (url: string) => void;
  onCopyResults: () => void;
  onNativeShare: () => void;
  onDownloadImage: () => void;
  onNewPuzzle: () => void;
  onMenu: () => void;
}

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  isNewBest = false,
  isDaily = false,
  shareUrls,
  copied,
  canNativeShare,
  onOpenShareWindow,
  onCopyResults,
  onNativeShare,
  onDownloadImage,
  onNewPuzzle,
  onMenu,
}: CompletionOverlayProps) {
  const [streak, setStreak] = useState<number>(0);
  const completionMessage = getCompletionMessage(elapsedSeconds);

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
    const run = async () => {
      const dailyStreak = isDaily ? getCurrentStreak() : 0;
      const stats = await recordCompletion({
        elapsedSeconds,
        grid,
        isDaily: !!isDaily,
        dailyStreak,
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
  }, [elapsedSeconds, grid, isDaily]);

  return (
    <div className={styles.completeOverlay}>
      <div className={styles.completeContent}>
        <h2>🎉 {completionMessage}</h2>
        <p>
          Finished in {formatTime(elapsedSeconds)}
          {grid && (
            <span className={styles.puzzleSize}>
              {" "}
              · {grid.rows}×{grid.cols} puzzle ({grid.rows * grid.cols} pieces)
            </span>
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
