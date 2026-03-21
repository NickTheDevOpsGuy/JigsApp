import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleState } from "@/puzzle/core/types";
import { logger } from "@/utils/logger";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import {
  buildChallengePlayUrl,
  buildChallengeShareMessage,
  buildProgressShareMessage,
} from "@/screens/Play/core/share/shareMessages";

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
  moveCount?: number;
  maxGroupSize?: number;
  puzzleName?: string;
}) {
  const {
    elapsedSeconds,
    state,
    progressShareUrl = "/",
    challengeShareUrl = "/",
    accuracyPercent = 100,
    moveCount,
    maxGroupSize,
    puzzleName,
  } = args;
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current != null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const triggerCopiedState = useCallback(() => {
    setCopied(true);
    if (copyResetTimeoutRef.current != null) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      copyResetTimeoutRef.current = null;
    }, 2000);
  }, []);

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
      moveCount,
      puzzleName,
    });
  }, [
    elapsedSeconds,
    state?.totalCount,
    accuracyPercent,
    fullProgressUrl,
    moveCount,
    puzzleName,
  ]);

  const getChallengeShareTextWithUrl = useCallback(
    (overrideChallengeUrl?: string) => {
      const url = buildChallengePlayUrl(
        overrideChallengeUrl ?? fullChallengeUrl,
        elapsedSeconds,
        moveCount ?? 0,
      );
      return buildChallengeShareMessage({
        elapsedSeconds,
        pieceCount: state?.totalCount ?? 0,
        playUrl: url,
        moveCount,
        maxGroupSize,
        puzzleName,
      });
    },
    [
      elapsedSeconds,
      state?.totalCount,
      fullChallengeUrl,
      moveCount,
      maxGroupSize,
      puzzleName,
    ],
  );

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
      triggerCopiedState();
    } catch (err) {
      logger.error("Failed to copy:", err);
    }
  }, [getProgressShareTextWithUrl, triggerCopiedState]);

  const handleCopyChallenge = useCallback(
    async (overrideChallengeUrl?: string) => {
      const text = getChallengeShareTextWithUrl(overrideChallengeUrl);
      try {
        await navigator.clipboard.writeText(text);
        triggerCopiedState();
      } catch (err) {
        logger.error("Failed to copy:", err);
      }
    },
    [getChallengeShareTextWithUrl, triggerCopiedState],
  );

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
      logger.warn("Share cancelled or failed:", err);
    }
  }, [getProgressShareTextWithUrl, fullProgressUrl, handleCopyResults]);

  const handleNativeChallengeShare = useCallback(
    async (overrideChallengeUrl?: string) => {
      const url = buildChallengePlayUrl(
        overrideChallengeUrl ?? fullChallengeUrl,
        elapsedSeconds,
        moveCount ?? 0,
      );
      if (!navigator.share) {
        await handleCopyChallenge(url);
        return;
      }
      const text = getChallengeShareTextWithUrl(url);
      try {
        await navigator.share({
          title: "Phuzzle Puzzle Share",
          text,
          url: url.startsWith("http")
            ? url
            : `${PLAY_BASE}${url.startsWith("/") ? url : `/${url}`}`,
        });
      } catch (err) {
        logger.warn("Share cancelled or failed:", err);
      }
    },
    [
      elapsedSeconds,
      fullChallengeUrl,
      getChallengeShareTextWithUrl,
      handleCopyChallenge,
      moveCount,
    ],
  );

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
