/**
 * Share modal: Home button, then two share options side by side (Copy link, Share Card).
 * Readable contrast; optional Download.
 */
import React from "react";
import { Copy, Image, Download, Home } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { buildProgressShareMessage } from "@/screens/Play/core/share/shareMessages";
import styles from "@/screens/Play/styles/PlayScreen.module.css";

const PLAY_BASE = "https://phuzzle.vercel.app";

interface CompletionSharePopupProps {
  elapsedSeconds: number;
  puzzleShareUrl: string;
  pieceCount?: number;
  accuracyPercent?: number;
  copied?: boolean;
  onCopyResults?: () => void;
  onShareCard: () => void;
  isGenerating: boolean;
  onDownload: () => void;
  onGoHome?: () => void;
}

export function CompletionSharePopup({
  elapsedSeconds,
  puzzleShareUrl,
  pieceCount = 0,
  accuracyPercent = 100,
  copied = false,
  onCopyResults,
  onShareCard,
  isGenerating,
  onDownload,
  onGoHome,
}: CompletionSharePopupProps) {
  const playUrl = puzzleShareUrl.startsWith("http")
    ? puzzleShareUrl
    : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;

  const shareText = buildProgressShareMessage({
    elapsedSeconds,
    pieceCount,
    accuracyPercent,
    playUrl,
  });

  const canCopy = typeof onCopyResults === "function";

  return (
    <div className={styles.shareResultPopup}>
      {onGoHome != null && (
        <Button
          variant="secondary"
          onClick={onGoHome}
          className={styles.shareResultPopupHomeBtn}
          aria-label="Home"
        >
          <Home size={20} />
          Home
        </Button>
      )}
      <div className={styles.shareResultPopupRow}>
        <Button
          variant="secondary"
          onClick={onCopyResults ?? (() => {})}
          disabled={!canCopy}
          className={styles.shareResultPopupSideBtn}
        >
          <Copy size={20} />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button
          variant="secondary"
          onClick={onShareCard}
          disabled={isGenerating}
          className={styles.shareResultPopupSideBtn}
        >
          <Image size={20} />
          {isGenerating ? "…" : "Share Card"}
        </Button>
      </div>
      <button
        type="button"
        className={styles.shareResultPopupDownloadLink}
        onClick={onDownload}
      >
        <Download size={18} />
        Download image
      </button>

      <textarea
        readOnly
        value={shareText}
        className={styles.shareResultPopupHiddenText}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
