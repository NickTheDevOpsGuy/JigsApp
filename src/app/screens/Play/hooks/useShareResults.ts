/**
 * useShareResults – copy, native share. Share text: Phuzzle header + time + accuracy + "Can you beat it?" + url.
 */
import { useCallback, useState } from "react";
import type { PuzzleState } from "@/puzzle/types";
import { formatTime } from "../playUtils";

const PLAY_BASE_URL = "https://phuzzle.vercel.app";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatShareDate(): string {
  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function useShareResults(args: {
  elapsedSeconds: number;
  state: PuzzleState | null;
  /** Link to this exact puzzle (e.g. /daily or /play?session=xxx). Omit for home. */
  puzzleShareUrl?: string | null;
  /** 0–100, for share line "🎯 92% accuracy". */
  accuracyPercent?: number;
}) {
  const { elapsedSeconds, state: _state, puzzleShareUrl, accuracyPercent = 100 } = args;
  const [copied, setCopied] = useState(false);

  const playUrl = puzzleShareUrl
    ? `${PLAY_BASE_URL}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`
    : `${PLAY_BASE_URL}/`;

  const getShareText = useCallback(() => {
    const dateStr = formatShareDate();
    const timeStr = formatTime(elapsedSeconds);
    const acc = Math.max(0, Math.min(100, accuracyPercent));
    return `🧩 Phuzzle — ${dateStr}\n⏱ ${timeStr}\n🎯 ${acc}% accuracy\n\nCan you beat it?\n\n${playUrl}`;
  }, [playUrl, elapsedSeconds, accuracyPercent]);

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
