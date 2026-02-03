import React, { useEffect } from "react";
import { Plus, Menu, Download, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";
import { formatTime } from "../playUtils";
import { setBestTime } from "../timeMode";

interface ShareUrls {
  twitter: string;
  facebook: string;
  reddit: string;
  whatsapp: string;
}

interface CompletionOverlayProps {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  isNewBest?: boolean;
  shareUrls: ShareUrls;
  copied: boolean;
  canNativeShare: boolean;
  onOpenShareWindow: (url: string) => void;
  onCopyResults: () => void;
  onNativeShare: () => void;
  onDownloadImage: () => void;
  onNewPuzzle: () => void;
  onMenu: () => void;
}

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  isNewBest = false,
  shareUrls,
  copied,
  canNativeShare,
  onOpenShareWindow,
  onCopyResults,
  onNativeShare,
  onDownloadImage,
  onNewPuzzle,
  onMenu,
}: CompletionOverlayProps) {
  useEffect(() => {
    if (isNewBest && grid) {
      setBestTime(grid.rows, grid.cols, elapsedSeconds);
    }
  }, [isNewBest, grid, elapsedSeconds]);

  return (
    <div className={styles.completeOverlay}>
      <div className={styles.completeContent}>
        <h2>🎉 Complete!</h2>
        <p>
          Finished in {formatTime(elapsedSeconds)}
          {isNewBest && <span className={styles.newBest}> — New best!</span>}
        </p>

        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>Share your result:</p>

          {/* Social buttons */}
          <div className={styles.socialButtons}>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.twitter)}
              title="Share on X/Twitter"
            >
              𝕏
            </button>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.facebook)}
              title="Share on Facebook"
            >
              f
            </button>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.reddit)}
              title="Share on Reddit"
            >
              ⬆
            </button>
            <button
              className={styles.socialBtn}
              onClick={() => onOpenShareWindow(shareUrls.whatsapp)}
              title="Share on WhatsApp"
            >
              💬
            </button>
          </div>

          {/* Utility buttons */}
          <div className={styles.shareButtons}>
            <Button size="sm" onClick={onDownloadImage}>
              <Download size={16} />
              Download
            </Button>
            <Button size="sm" onClick={onCopyResults}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            {canNativeShare && (
              <Button size="sm" onClick={onNativeShare}>
                <Share2 size={16} />
                More
              </Button>
            )}
          </div>

          <p className={styles.shareHint}>
            For LinkedIn: Download image + Copy text, then post manually
          </p>
        </div>

        <div className={styles.completeActions}>
          <Button variant="primary" onClick={onNewPuzzle}>
            <Plus size={16} />
            New Puzzle
          </Button>
          <Button variant="secondary" onClick={onMenu}>
            <Menu size={16} />
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
