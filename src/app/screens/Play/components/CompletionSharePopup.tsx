/**
 * Share Result modal content: seasonal frame toggle, Share Card PNG, Download.
 * The share card image includes the puzzle URL (phuzzle.vercel.app) on the card itself.
 */
import { Image, Download } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

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
  return (
    <div className={styles.shareResultPopup}>
      <p className={styles.shareResultPopupCta}>
        Challenge a friend – share your completion card (it includes the game link
        phuzzle.vercel.app) or download the image.
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
