import { useCallback, useMemo, useState } from "react";
import type { PuzzleState } from "@/puzzle/types";
import { formatTime } from "../playUtils";

const PLAY_BASE = "https://phuzzle.vercel.app";

export type ShareUrls = {
  twitter: string;
  facebook: string;
  reddit: string;
  whatsapp: string;
};

export function useShareResults(args: {
  elapsedSeconds: number;
  state: PuzzleState | null;
  puzzleShareUrl?: string;
  accuracyPercent?: number;
}) {
  const { elapsedSeconds, state, puzzleShareUrl = "/" } = args;
  const [copied, setCopied] = useState(false);

  const fullShareUrl = useMemo(() => {
    const path = puzzleShareUrl.startsWith("http")
      ? puzzleShareUrl
      : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
    return path;
  }, [puzzleShareUrl]);

  const getShareText = useCallback(() => {
    const timeStr = formatTime(elapsedSeconds);
    const pieceCount = state?.totalCount ?? 0;
    return `🧩 I completed a ${pieceCount}-piece Phuzzle in ${timeStr}! Can you beat my time?`;
  }, [elapsedSeconds, state?.totalCount]);

  /** Challenge message with link, for copy / native share / SMS */
  const getShareTextWithUrl = useCallback(() => {
    return `${getShareText()}\n\n${fullShareUrl}`;
  }, [getShareText, fullShareUrl]);

  const shareUrls: ShareUrls = useMemo(() => {
    const text = encodeURIComponent(getShareText());
    const hashtag = encodeURIComponent("#Phuzzle");
    const url = encodeURIComponent(fullShareUrl);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${text}%20${hashtag}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}%20${hashtag}`,
      reddit: `https://reddit.com/submit?title=${text}%20${hashtag}`,
      whatsapp: `https://wa.me/?text=${text}%20${hashtag}%20${url}`,
    };
  }, [getShareText, fullShareUrl]);

  const openShareWindow = useCallback((url: string) => {
    window.open(url, "_blank", "width=600,height=400,menubar=no,toolbar=no");
  }, []);

  const handleCopyResults = useCallback(async () => {
    const text = getShareTextWithUrl();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [getShareTextWithUrl]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    const text = getShareTextWithUrl();
    try {
      await navigator.share({
        title: "Phuzzle",
        text,
        url: fullShareUrl,
      });
    } catch (err) {
      console.warn("Share cancelled or failed:", err);
    }
  }, [getShareTextWithUrl, fullShareUrl]);

  return {
    copied,
    setCopied,
    getShareText,
    getShareTextWithUrl,
    shareUrls,
    openShareWindow,
    handleCopyResults,
    canNativeShare,
    handleNativeShare,
  };
}
