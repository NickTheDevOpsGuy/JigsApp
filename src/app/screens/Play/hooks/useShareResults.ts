/**
 * useShareResults – copy, native share.
 */
import { useCallback, useState } from "react";
import type { PuzzleState } from "@/puzzle/types";
import { formatTime } from "../playUtils";

export function useShareResults(args: {
  elapsedSeconds: number;
  state: PuzzleState | null;
}) {
  const { elapsedSeconds, state } = args;
  const [copied, setCopied] = useState(false);

  const getShareText = useCallback(() => {
    const timeStr = formatTime(elapsedSeconds);
    const pieceCount = state?.totalCount ?? 0;
    return `🧩 I completed a ${pieceCount}-piece Phuzzle in ${timeStr}! Can you beat my time?`;
  }, [elapsedSeconds, state?.totalCount]);

  const handleCopyResults = useCallback(async () => {
    const text = getShareText() + " #Phuzzle\nhttps://phuzzle.vercel.app/";
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
        url: "https://phuzzle.vercel.app/",
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Share cancelled or failed:", err);
    }
  }, [getShareText]);

  return {
    copied,
    setCopied,
    getShareText,
    handleCopyResults,
    canNativeShare,
    handleNativeShare,
  };
}
