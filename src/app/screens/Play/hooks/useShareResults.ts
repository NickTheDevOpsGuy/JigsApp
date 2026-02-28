/**
 * useShareResults – copy, native share. Includes nag message with time and link to play (exact puzzle when available).
 */
import { useCallback, useState } from "react";
import type { PuzzleState } from "@/puzzle/types";
import { formatTime } from "../playUtils";

const PLAY_BASE_URL = "https://phuzzle.vercel.app";

export function useShareResults(args: {
  elapsedSeconds: number;
  state: PuzzleState | null;
  /** Link to this exact puzzle (e.g. /daily or /play?session=xxx). Omit for home. */
  puzzleShareUrl?: string | null;
}) {
  const { elapsedSeconds, state, puzzleShareUrl } = args;
  const [copied, setCopied] = useState(false);

  const playUrl = puzzleShareUrl
    ? `${PLAY_BASE_URL}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`
    : `${PLAY_BASE_URL}/`;

  const getShareText = useCallback(() => {
    const timeStr = formatTime(elapsedSeconds);
    return `Can you beat my run of ${timeStr} seconds? Play here: ${playUrl}`;
  }, [elapsedSeconds, playUrl]);

  const handleCopyResults = useCallback(async () => {
    const text = getShareText() + " #Phuzzle";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [getShareText]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;

    const text = getShareText();
    try {
      await navigator.share({
        title: "Phuzzle",
        text,
        url: playUrl,
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Share cancelled or failed:", err);
    }
  }, [getShareText, playUrl]);

  return {
    copied,
    setCopied,
    getShareText,
    handleCopyResults,
    canNativeShare,
    handleNativeShare,
  };
}
