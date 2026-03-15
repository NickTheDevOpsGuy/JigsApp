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
  getDailyPuzzleNumber,
} from "@/daily/dailyPuzzleCore";
import {
  buildDailyShareMessage,
  getDailyShareCompletionGrid,
} from "@/screens/Play/core/share/shareMessages";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { recordCompletion } from "@/services/player/statsService";
import type { PlayerStatsData } from "@/services/player/statsService";
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
  puzzleName?: string;
  /** Called after Supabase record with updated stats (e.g. for 7-day streak toast). */
  onCompletionRecorded?: (stats: PlayerStatsData) => void;
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
    puzzleName,
    onCompletionRecorded,
  } = params;

  const PLAY_BASE = "https://phuzzle.vercel.app";

  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [dailyCopied, setDailyCopied] = useState(false);
  const [_streak, setStreak] = useState<number>(0);
  const [_masteryStreak, setMasteryStreak] = useState<number>(0);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
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
        onCompletionRecorded?.(stats);
        const unlocked = await checkAndUnlockAchievements({
          puzzlesCompleted: stats.puzzlesCompleted,
          dailyStreak: stats.dailyStreak,
          bestDailyStreak: stats.bestDailyStreak,
          lastCompletion: { elapsedSeconds, grid },
          undoCount,
        });
        if (unlocked.length > 0) setNewlyUnlocked(unlocked);
      }
    };
    void run();
  }, [
    elapsedSeconds,
    grid,
    isDaily,
    cutType,
    undoCount,
    usedHint,
    visualModifier,
    onCompletionRecorded,
  ]);

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
      puzzleName,
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
    puzzleName,
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
      puzzleName,
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
    puzzleName,
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
      puzzleName,
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
    puzzleName,
  ]);

  const getDailyShareText = useCallback((): string => {
    if (!grid || !isDaily) return "";
    const pieceCount = grid.rows * grid.cols;
    const dailyLink =
      puzzleShareUrl.startsWith("http")
        ? puzzleShareUrl
        : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
    const completionGrid = getDailyShareCompletionGrid({
      pieceCount,
      elapsedSeconds,
      moveCount,
      usedHint,
      undoCount,
    });
    return buildDailyShareMessage({
      dailyNumber: getDailyPuzzleNumber(),
      pieceCount,
      elapsedSeconds,
      moveCount,
      dailyLink,
      completionGrid,
    });
  }, [
    grid,
    isDaily,
    puzzleShareUrl,
    elapsedSeconds,
    moveCount,
    usedHint,
    undoCount,
  ]);

  const handleCopyDailyShare = useCallback(async () => {
    const text = getDailyShareText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setDailyCopied(true);
      setTimeout(() => setDailyCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [getDailyShareText]);

  const handleNativeDailyShare = useCallback(async () => {
    const text = getDailyShareText();
    if (!text) return;
    const dailyLink =
      puzzleShareUrl.startsWith("http")
        ? puzzleShareUrl
        : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Phuzzle Daily",
          text,
          url: dailyLink,
        });
      } catch {
        await handleCopyDailyShare();
      }
    } else {
      await handleCopyDailyShare();
    }
  }, [getDailyShareText, puzzleShareUrl, handleCopyDailyShare]);

  return {
    sharePopupOpen,
    setSharePopupOpen,
    useSeasonalFrame,
    setUseSeasonalFrame,
    percentile,
    rankPosition,
    percentileBadgeTier,
    newlyUnlocked,
    shareCard,
    isGenerating,
    handleShareCard,
    handleShareResultCard,
    handleShareChallengeCard,
    getDailyShareText,
    handleCopyDailyShare,
    handleNativeDailyShare,
    dailyCopied,
  };
}
