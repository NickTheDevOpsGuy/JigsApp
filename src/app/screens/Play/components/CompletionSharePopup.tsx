/**
 * Share Result modal content: share text + Copy (old layout), seasonal frame, Share Card PNG, Download.
 */
import { Copy, Image, Download } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { formatTime } from "../playUtils";
import styles from "../PlayScreen.module.css";

const PLAY_BASE = "https://phuzzle.vercel.app";

interface CompletionSharePopupProps {
  elapsedSeconds: number;
  puzzleShareUrl: string;
  copied?: boolean;
  onCopyResults?: () => void;
  useSeasonalFrame: boolean;
  setUseSeasonalFrame: (v: boolean) => void;
  onShareCard: () => void;
  isGenerating: boolean;
  onDownload: () => void;
}

export function CompletionSharePopup({
  elapsedSeconds,
  puzzleShareUrl,
  copied = false,
  onCopyResults,
  useSeasonalFrame,
  setUseSeasonalFrame,
  onShareCard,
  isGenerating,
  onDownload,
}: CompletionSharePopupProps) {
  const playUrl = puzzleShareUrl.startsWith("http")
    ? puzzleShareUrl
    : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
  const shareText = `That was ${formatTime(elapsedSeconds)} of focus. Can you do better?\n\n${playUrl}`;

  return (
    <div className={styles.shareResultPopup}>
      <div className={styles.shareResultPopupTextBlock}>
        <textarea
          readOnly
          value={shareText}
          className={styles.shareResultPopupTextarea}
          aria-label="Share message"
          rows={4}
        />
        {onCopyResults && (
          <Button
            variant="primary"
            onClick={onCopyResults}
            className={styles.shareResultPopupBtn}
          >
            <Copy size={18} />
            {copied ? "Copied!" : "Copy"}
          </Button>
        )}
      </div>
      <label className={styles.shareResultPopupToggle}>
        <input
          type="checkbox"
          checked={useSeasonalFrame}
          onChange={(e) => setUseSeasonalFrame(e.target.checked)}
        />
        Seasonal frame
      </label>

      <Button
        variant="secondary"
        onClick={onShareCard}
        disabled={isGenerating}
        className={styles.shareResultPopupBtn}
        title="Share the puzzle image and message together"
      >
        <Image size={18} />
        {isGenerating ? "Generating..." : "Share Card PNG"}
      </Button>
      <p className={styles.shareResultPopupHint}>
        Share Card sends the image and link together to apps that support it.
      </p>

      <Button
        variant="secondary"
        onClick={onDownload}
        className={styles.shareResultPopupBtn}
      >
        <Download size={18} />
        Download
      </Button>
    </div>
  );
}
