/**
 * Completion overlay actions: Home and Share (Share is primary green).
 */
import { useState, useEffect } from "react";
import { Share2, Home } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "./CompletionOverlay.module.css";

const SHARE_BUTTON_DELAY_MS = 900;

interface CompletionOverlayActionsProps {
  onClose: () => void;
  onPlayAgain?: () => void;
  onGoHome?: () => void;
  onShareClick: () => void;
  isNarrow: boolean;
}

export function CompletionOverlayActions({
  onGoHome,
  onShareClick,
  isNarrow: _isNarrow,
}: CompletionOverlayActionsProps) {
  const [shareRevealed, setShareRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShareRevealed(true), SHARE_BUTTON_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.completeActions}>
      {onGoHome != null && (
        <Button
          variant="secondary"
          onClick={onGoHome}
          className={styles.completeActionsTrigger}
          aria-label="Home"
        >
          <Home size={20} />
          <span>Home</span>
        </Button>
      )}
      <Button
        variant="primary"
        onClick={onShareClick}
        className={styles.completeActionsShareBtn}
        aria-label="Share"
        style={{
          opacity: shareRevealed ? 1 : 0,
          pointerEvents: shareRevealed ? "auto" : "none",
          transition: "opacity 0.25s ease-out",
        }}
      >
        <Share2 size={20} />
        Share
      </Button>
    </div>
  );
}
