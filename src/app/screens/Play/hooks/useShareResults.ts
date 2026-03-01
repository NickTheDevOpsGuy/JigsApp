/**
 * useShareResults – copy, native share. Share text: "That was M:SS of focus. Can you do better?" + link.
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
  /** 0–100, unused in share text but kept for API compatibility. */
  accuracyPercent?: number;
}) {
  const { elapsedSeconds, state: _state, puzzleShareUrl } = args;
  const [copied, setCopied] = useState(false);

  const playUrl = puzzleShareUrl
    ? `${PLAY_BASE_URL}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`
    : `${PLAY_BASE_URL}/`;

  // Message uses the sharer’s completion time; playUrl is the exact puzzle + difficulty (daily?grid= or session=)
  const getShareText = useCallback(() => {
    const timeStr = formatTime(elapsedSeconds);
    return `That was ${timeStr} of focus. Can you do better?\n\n${playUrl}`;
  }, [playUrl, elapsedSeconds]);

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
