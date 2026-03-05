import { useCallback, useMemo, useState } from "react";
import type { PuzzleState } from "@/puzzle/types";
import { formatTime } from "../playUtils";
import { buildChallengeShareMessage, buildProgressShareMessage } from "../shareMessages";

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
  progressShareUrl?: string;
  challengeShareUrl?: string;
  accuracyPercent?: number;
}) {
  const {
    elapsedSeconds,
    state,
    progressShareUrl = "/",
    challengeShareUrl = "/",
    accuracyPercent = 100,
  } = args;
  const [copied, setCopied] = useState(false);

  const fullProgressUrl = useMemo(() => {
    const path = progressShareUrl.startsWith("http")
      ? progressShareUrl
      : `${PLAY_BASE}${progressShareUrl.startsWith("/") ? progressShareUrl : `/${progressShareUrl}`}`;
    return path;
  }, [progressShareUrl]);

  const fullChallengeUrl = useMemo(() => {
    const path = challengeShareUrl.startsWith("http")
      ? challengeShareUrl
      : `${PLAY_BASE}${challengeShareUrl.startsWith("/") ? challengeShareUrl : `/${challengeShareUrl}`}`;
    return path;
  }, [challengeShareUrl]);

  const getShareText = useCallback(() => {
    const timeStr = formatTime(elapsedSeconds);
    const pieceCount = state?.totalCount ?? 0;
    return `🧩 I completed a ${pieceCount}-piece Phuzzle in ${timeStr}.`;
  }, [elapsedSeconds, state?.totalCount]);

  const getProgressShareTextWithUrl = useCallback(() => {
    return buildProgressShareMessage({
      elapsedSeconds,
      pieceCount: state?.totalCount ?? 0,
      accuracyPercent,
      playUrl: fullProgressUrl,
    });
  }, [elapsedSeconds, state?.totalCount, accuracyPercent, fullProgressUrl]);

  const getChallengeShareTextWithUrl = useCallback(() => {
    return buildChallengeShareMessage({
      elapsedSeconds,
      pieceCount: state?.totalCount ?? 0,
      playUrl: fullChallengeUrl,
    });
  }, [elapsedSeconds, state?.totalCount, fullChallengeUrl]);

  const shareUrls: ShareUrls = useMemo(() => {
    const text = encodeURIComponent(getShareText());
    const hashtag = encodeURIComponent("#Phuzzle");
    const url = encodeURIComponent(fullProgressUrl);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${text}%20${hashtag}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}%20${hashtag}`,
      reddit: `https://reddit.com/submit?title=${text}%20${hashtag}`,
      whatsapp: `https://wa.me/?text=${text}%20${hashtag}%20${url}`,
    };
  }, [getShareText, fullProgressUrl]);

  const openShareWindow = useCallback((url: string) => {
    window.open(url, "_blank", "width=600,height=400,menubar=no,toolbar=no");
  }, []);

  const handleCopyResults = useCallback(async () => {
    const text = getProgressShareTextWithUrl();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [getProgressShareTextWithUrl]);

  const handleCopyChallenge = useCallback(async () => {
    const text = getChallengeShareTextWithUrl();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [getChallengeShareTextWithUrl]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) {
      await handleCopyResults();
      return;
    }
    const text = getProgressShareTextWithUrl();
    try {
      await navigator.share({
        title: "Phuzzle",
        text,
        url: fullProgressUrl,
      });
    } catch (err) {
      console.warn("Share cancelled or failed:", err);
    }
  }, [getProgressShareTextWithUrl, fullProgressUrl, handleCopyResults]);

  const handleNativeChallengeShare = useCallback(async () => {
    if (!navigator.share) {
      await handleCopyChallenge();
      return;
    }
    const text = getChallengeShareTextWithUrl();
    try {
      await navigator.share({
        title: "Phuzzle Challenge",
        text,
        url: fullChallengeUrl,
      });
    } catch (err) {
      console.warn("Share cancelled or failed:", err);
    }
  }, [getChallengeShareTextWithUrl, fullChallengeUrl, handleCopyChallenge]);

  return {
    copied,
    setCopied,
    getShareText,
    getProgressShareTextWithUrl,
    getChallengeShareTextWithUrl,
    shareUrls,
    openShareWindow,
    handleCopyResults,
    handleCopyChallenge,
    canNativeShare,
    handleNativeShare,
    handleNativeChallengeShare,
  };
}
