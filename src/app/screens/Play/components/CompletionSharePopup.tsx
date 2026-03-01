/**
 * Share Result modal content: seasonal frame toggle, Share Card PNG, Download, and clickable play link.
 */
import { Image, Download } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

const PLAY_BASE = "https://phuzzle.vercel.app";

interface CompletionSharePopupProps {
  elapsedSeconds: number;
  puzzleShareUrl: string;
  useSeasonalFrame: boolean;
  setUseSeasonalFrame: (v: boolean) => void;
  onShareCard: () => void;
  isGenerating: boolean;
  onDownload: () => void;
}

export function CompletionSharePopup({
  puzzleShareUrl,
  useSeasonalFrame,
  setUseSeasonalFrame,
  onShareCard,
  isGenerating,
  onDownload,
}: CompletionSharePopupProps) {
  const playUrl = puzzleShareUrl.startsWith("http")
    ? puzzleShareUrl
    : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;

  return (
    <div className={styles.shareResultPopup}>
      <p className={styles.shareResultPopupCta} role="status">
        When you share, the message will include a clickable link so they can play:
      </p>
      <p className={styles.shareResultPopupCta}>
        <a
          href={playUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareResultPopupUrlLink}
        >
          {playUrl}
        </a>
      </p>
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
      >
        <Image size={18} />
        {isGenerating ? "Generating..." : "Share Card PNG"}
      </Button>

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
