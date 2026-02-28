/**
 * Share Result modal content: seasonal frame toggle, Share Card PNG, Download, puzzle URL.
 */
import { useState, useCallback } from "react";
import { Image, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

const PHUZZLE_URL = "https://phuzzle.vercel.app/";

interface CompletionSharePopupProps {
  useSeasonalFrame: boolean;
  setUseSeasonalFrame: (v: boolean) => void;
  onShareCard: () => void;
  isGenerating: boolean;
  onDownload: () => void;
}

export function CompletionSharePopup({
  useSeasonalFrame,
  setUseSeasonalFrame,
  onShareCard,
  isGenerating,
  onDownload,
}: CompletionSharePopupProps) {
  const [urlCopied, setUrlCopied] = useState(false);
  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PHUZZLE_URL);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  }, []);

  return (
    <div className={styles.shareResultPopup}>
      <p className={styles.shareResultPopupCta}>
        Challenge a friend – share the link below or send your completion card.
      </p>
      <label className={styles.shareResultPopupToggle}>
        <input
          type="checkbox"
          checked={useSeasonalFrame}
          onChange={(e) => setUseSeasonalFrame(e.target.checked)}
        />
        Seasonal frame
      </label>

      <div className={styles.shareResultPopupUrl}>
        <span className={styles.shareResultPopupUrlLabel}>Play at:</span>
        <a
          href={PHUZZLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareResultPopupUrlLink}
        >
          {PHUZZLE_URL}
        </a>
        <Button
          variant="secondary"
          size="sm"
          onClick={copyUrl}
          className={styles.shareResultPopupUrlCopy}
          aria-label={urlCopied ? "Copied" : "Copy URL"}
          title={urlCopied ? "Copied!" : "Copy URL"}
        >
          {urlCopied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>

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
