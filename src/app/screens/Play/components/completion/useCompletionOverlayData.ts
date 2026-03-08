/**
 * Completion overlay: percentile, recordCompletion, daily/best-time effects, share state.
 * No logic change – extracted from CompletionOverlay.
 */
import { useEffect, useState, useCallback } from "react";
import { setBestTime } from "@/screens/Play/core/time/timeMode";
import {
  recordDailyCompletion,
  DAILY_DATE_KEY,
  getCurrentStreak,
  getTodayDateString,
} from "@/daily/dailyPuzzleCore";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { recordCompletion } from "@/services/player/statsService";
import { checkAndUnlockAchievements } from "@/services/player/achievementsService";
import { getPercentileRank } from "@/services/leaderboard/leaderboardService";
import { useShareCardImage } from "@/screens/Play/hooks/share/useShareCardImage";

type VisualModifier = "none" | "fog" | "night" | "sepia";
type PieceCutType = "classic" | "irregular" | "hard";

export type UseCompletionOverlayDataParams = {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  moveCount: number;
  piecesPerMin?: number;
  maxGroupSize?: number;
  accuracyPercent: number;
  usedHint: boolean;
  visualModifier: VisualModifier;
  isNewBest: boolean;
  isDaily: boolean;
  cutType: PieceCutType;
  undoCount: number;
  puzzleShareUrl?: string;
};

export type UseCompletionOverlayDataResult = ReturnType<typeof useCompletionOverlayData>;

export function useCompletionOverlayData(params: UseCompletionOverlayDataParams) {
  const {
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    piecesPerMin = 0,
    maxGroupSize = 0,
    accuracyPercent,
    usedHint,
    visualModifier,
    isNewBest,
    isDaily,
    cutType,
    undoCount,
    puzzleShareUrl = "/",
  } = params;

  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [_streak, setStreak] = useState<number>(0);
  const [_masteryStreak, setMasteryStreak] = useState<number>(0);
  const [percentile, setPercentile] = useState<{
    topPercent: number;
    totalPlayers: number;
  } | null>(null);
  const [useSeasonalFrame, setUseSeasonalFrame] = useState(true);

  const { shareCard, isGenerating } = useShareCardImage();

  useEffect(() => {
    if (isNewBest && grid) {
      setBestTime(grid.rows, grid.cols, elapsedSeconds);
    }
  }, [isNewBest, grid, elapsedSeconds]);

  useEffect(() => {
    if (!isDaily) return;
    const newStreak = recordDailyCompletion(elapsedSeconds);
    setStreak(newStreak);
    const today = new Date(`${getTodayDateString()}T00:00:00.000Z`);
    const day = today.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    today.setUTCDate(today.getUTCDate() - diffToMonday);
    const weekKey = today.toISOString().slice(0, 10);
    safeLocalStorage.setItem(`phuzzle:weeklyAlbumNudge:${weekKey}`, "true");
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
        moveCount,
        undoCount,
        completionSource: isDaily ? "daily" : "custom",
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
      piecesPerMin,
      maxGroupSize,
      accuracyPercent,
      percentile,
      useSeasonalFrame,
      puzzleShareUrl,
      pieceCount: grid ? grid.rows * grid.cols : 0,
      mode: "result",
    });
  }, [
    shareCard,
    imageUrl,
    elapsedSeconds,
    moveCount,
    piecesPerMin,
    maxGroupSize,
    accuracyPercent,
    percentile,
    useSeasonalFrame,
    puzzleShareUrl,
    grid,
  ]);

  const handleShareResultCard = useCallback(async () => {
    await shareCard({
      imageUrl,
      elapsedSeconds,
      moveCount,
      piecesPerMin,
      maxGroupSize,
      accuracyPercent,
      percentile,
      useSeasonalFrame,
      puzzleShareUrl,
      pieceCount: grid ? grid.rows * grid.cols : 0,
      mode: "result",
    });
  }, [
    shareCard,
    imageUrl,
    elapsedSeconds,
    moveCount,
    piecesPerMin,
    maxGroupSize,
    accuracyPercent,
    percentile,
    useSeasonalFrame,
    puzzleShareUrl,
    grid,
  ]);

  const handleShareChallengeCard = useCallback(async () => {
    await shareCard({
      imageUrl,
      elapsedSeconds,
      moveCount,
      piecesPerMin,
      maxGroupSize,
      accuracyPercent,
      percentile,
      useSeasonalFrame,
      puzzleShareUrl,
      pieceCount: grid ? grid.rows * grid.cols : 0,
      mode: "challenge",
    });
  }, [
    shareCard,
    imageUrl,
    elapsedSeconds,
    moveCount,
    piecesPerMin,
    maxGroupSize,
    accuracyPercent,
    percentile,
    useSeasonalFrame,
    puzzleShareUrl,
    grid,
  ]);

  return {
    sharePopupOpen,
    setSharePopupOpen,
    useSeasonalFrame,
    setUseSeasonalFrame,
    percentile,
    rankPosition,
    percentileBadgeTier,
    shareCard,
    isGenerating,
    handleShareCard,
    handleShareResultCard,
    handleShareChallengeCard,
  };
}
