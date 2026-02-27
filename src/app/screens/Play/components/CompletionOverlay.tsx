/**
 * CompletionOverlay – puzzle complete: image, stats (Time, Moves, Accuracy, Rank), "Can you beat my run?", Continue.
 */
import React, { useEffect, useCallback, useState } from "react";
import { X, Trophy, Play, Share2, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { Modal } from "@/components/Modal/Modal";
import styles from "../PlayScreen.module.css";
import { setBestTime } from "../timeMode";
import {
  recordDailyCompletion,
  DAILY_DATE_KEY,
  getCurrentStreak,
  getTodayDateString,
} from "@/daily/dailyPuzzleCore";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { recordCompletion } from "@/services/statsService";
import { checkAndUnlockAchievements } from "@/services/achievementsService";
import { getPercentileRank } from "@/services/leaderboardService";
import type { Piece } from "@/puzzle/types";
import { useShareCardImage } from "../hooks/useShareCardImage";
import { DailyReactions } from "@/components/DailyReactions";
import { CompletionSharePopup } from "./CompletionSharePopup";
import { CompletionStatsBlock } from "./CompletionStatsBlock";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "@/hooks/useBatterySaver";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { CONFETTI_COLORS_BY_THEME } from "@/data/confettiColors";

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
  /** Called after onClose when user chooses "Back to home". */
  onGoHome?: () => void;
  /** Called after onClose when user chooses "Play again". */
  onPlayAgain?: () => void;
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
  copied: _copied,
  canNativeShare: _canNativeShare,
  onCopyResults: _onCopyResults,
  onNativeShare: _onNativeShare,
  onDownloadImage,
  onClose,
  onGoHome,
  onPlayAgain,
}: CompletionOverlayProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleGoHome = useCallback(() => {
    onClose();
    onGoHome?.();
  }, [onClose, onGoHome]);

  const handlePlayAgain = useCallback(() => {
    onClose();
    onPlayAgain?.();
  }, [onClose, onPlayAgain]);

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

  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [_streak, setStreak] = useState<number>(0);
  const [_masteryStreak, setMasteryStreak] = useState<number>(0);
  const [percentile, setPercentile] = useState<{
    topPercent: number;
    totalPlayers: number;
  } | null>(null);
  const [useSeasonalFrame, setUseSeasonalFrame] = useState(true);

  const { shareCard, isGenerating } = useShareCardImage();
  const { theme } = useTheme();
  const batterySaverMode = useBatterySaver();
  const isNarrow = useMediaQuery("(max-width: 500px), (max-height: 600px)");

  const _isMasteryDaily = isDaily && !usedHint && undoCount === 0;

  // Confetti when the win screen appears – layered bursts for a fuller celebration
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || batterySaverMode) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const colors = CONFETTI_COLORS_BY_THEME[theme ?? "light"];
    import("canvas-confetti").then((confetti) => {
      const fn = confetti.default;
      // Main burst from top center – more particles, longer fall
      fn({
        particleCount: 180,
        spread: 75,
        origin: { x: 0.5, y: 0.15 },
        colors,
        startVelocity: 28,
        decay: 0.94,
        ticks: 220,
        gravity: 0.8,
      });
      // Side bursts with slight stagger
      timeouts.push(
        setTimeout(() => {
          fn({
            particleCount: 65,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.55 },
            colors,
            startVelocity: 24,
            scalar: 1.1,
          });
          fn({
            particleCount: 65,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.55 },
            colors,
            startVelocity: 24,
            scalar: 1.1,
          });
        }, 120),
      );
      // Third wave: lower arc for depth
      timeouts.push(
        setTimeout(() => {
          fn({
            particleCount: 80,
            spread: 100,
            origin: { x: 0.5, y: 0.7 },
            colors,
            angle: 90,
            startVelocity: 18,
            decay: 0.92,
          });
        }, 350),
      );
    });
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [theme, batterySaverMode]);

  useEffect(() => {
    if (isNewBest && grid) {
      setBestTime(grid.rows, grid.cols, elapsedSeconds);
    }
  }, [isNewBest, grid, elapsedSeconds]);

  useEffect(() => {
    if (!isDaily) return;

    const newStreak = recordDailyCompletion(elapsedSeconds);
    setStreak(newStreak);

    // Weekly album nudge flag (for future weekly collectible page)
    const today = new Date(`${getTodayDateString()}T00:00:00.000Z`);
    const day = today.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    today.setUTCDate(today.getUTCDate() - diffToMonday);
    const weekKey = today.toISOString().slice(0, 10);
    safeLocalStorage.setItem(`phuzzle:weeklyAlbumNudge:${weekKey}`, "true");

    // Reset daily seed key so the next run pulls fresh daily state if needed
    safeLocalStorage.removeItem(DAILY_DATE_KEY);
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

    void run();
  }, [elapsedSeconds, grid, isDaily, cutType, undoCount, usedHint, visualModifier]);

  /** Rank position from percentile (1-based) */
  const rankPosition =
    percentile && percentile.totalPlayers >= 1
      ? Math.max(
          1,
          Math.min(
            percentile.totalPlayers,
            percentile.totalPlayers -
              Math.round((percentile.topPercent / 100) * percentile.totalPlayers) +
              1,
          ),
        )
      : null;

  /** Visual badge tier for percentile (Top 10%, Top 25%, Top 50%, or null for no badge) */
  const percentileBadgeTier =
    percentile && percentile.totalPlayers >= 1
      ? percentile.topPercent <= 10
        ? "Top 10%"
        : percentile.topPercent <= 25
          ? "Top 25%"
          : percentile.topPercent <= 50
            ? "Top 50%"
            : null
      : null;

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

        <div className={styles.completeActions}>
          <Button
            variant="primary"
            onClick={handleClose}
            className={styles.completeContinueBtn}
            aria-label="Continue"
          >
            <Play size={20} />
            Continue
          </Button>
          {onPlayAgain != null && (
            <Button
              variant="secondary"
              onClick={handlePlayAgain}
              className={styles.completeContinueBtn}
              aria-label="Play again"
            >
              <RotateCcw size={20} />
              Play again
            </Button>
          )}
          {onGoHome != null && (
            <Button
              variant="secondary"
              onClick={handleGoHome}
              className={styles.completeContinueBtn}
              aria-label="Back to home"
            >
              <Home size={20} />
              Back to home
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setSharePopupOpen(true)}
            className={styles.completeContinueBtn}
            aria-label="Share Result"
          >
            <Share2 size={20} />
            {isNarrow ? "Share" : "Share Result"}
          </Button>
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
