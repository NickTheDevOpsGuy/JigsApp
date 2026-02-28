/**
 * Completion overlay action buttons (Continue, Play again, Back to home, Share).
 */
import { Play, Share2, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

interface CompletionOverlayActionsProps {
  onClose: () => void;
  onPlayAgain?: () => void;
  onGoHome?: () => void;
  onShareClick: () => void;
  isNarrow: boolean;
}

export function CompletionOverlayActions({
  onClose,
  onPlayAgain,
  onGoHome,
  onShareClick,
  isNarrow,
}: CompletionOverlayActionsProps) {
  return (
    <div className={styles.completeActions}>
      <Button
        variant="primary"
        onClick={onClose}
        className={styles.completeContinueBtn}
        aria-label="Continue"
      >
        <Play size={20} />
        Continue
      </Button>
      {onPlayAgain != null && (
        <Button
          variant="secondary"
          onClick={onPlayAgain}
          className={styles.completeContinueBtn}
          aria-label="Play again"
        >
          <RotateCcw size={20} />
          Play again
        </Button>
      )}
      {onGoHome != null && (
        <Button
          variant="secondary"
          onClick={onGoHome}
          className={styles.completeContinueBtn}
          aria-label="Back to home"
        >
          <Home size={20} />
          Back to home
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={onShareClick}
        className={styles.completeContinueBtn}
        aria-label="Share Result"
      >
        <Share2 size={20} />
        {isNarrow ? "Share" : "Share Result"}
      </Button>
    </div>
  );
}
