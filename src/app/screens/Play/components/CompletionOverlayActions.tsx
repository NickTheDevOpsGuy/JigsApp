/**
 * Completion overlay actions: Home and Restart as visible buttons, plus Share.
 * No dropdown, no Continue – so Home and Restart are always visible under the menu.
 */
import { useState, useEffect } from "react";
import { Share2, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

const SHARE_BUTTON_DELAY_MS = 900;

interface CompletionOverlayActionsProps {
  onClose: () => void;
  onPlayAgain?: () => void;
  onGoHome?: () => void;
  onShareClick: () => void;
  isNarrow: boolean;
}

export function CompletionOverlayActions({
  onPlayAgain,
  onGoHome,
  onShareClick,
  isNarrow,
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
          variant="primary"
          onClick={onGoHome}
          className={styles.completeActionsTrigger}
          aria-label="Home"
        >
          <Home size={20} />
          <span>Home</span>
        </Button>
      )}
      {onPlayAgain != null && (
        <Button
          variant="primary"
          onClick={onPlayAgain}
          className={styles.completeActionsTrigger}
          aria-label="Play again"
        >
          <RotateCcw size={20} />
          <span>Play again</span>
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={onShareClick}
        className={styles.completeActionsShareBtn}
        aria-label="Share Result"
        style={{
          opacity: shareRevealed ? 1 : 0,
          pointerEvents: shareRevealed ? "auto" : "none",
          transition: "opacity 0.25s ease-out",
        }}
      >
        <Share2 size={20} />
        {isNarrow ? "Share" : "Share Result"}
      </Button>
    </div>
  );
}
