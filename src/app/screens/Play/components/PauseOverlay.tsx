/**
 * PauseOverlay – pause screen; resume or new puzzle (when countdown expired).
 */
import React from "react";
import { Pause, Timer } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

interface PauseOverlayProps {
  onResume: () => void;
  isCountdownExpired?: boolean;
  onNewPuzzle?: () => void;
}

export function PauseOverlay({
  onResume,
  isCountdownExpired,
  onNewPuzzle,
}: PauseOverlayProps) {
  return (
    <div
      className={styles.pauseOverlay}
      onClick={isCountdownExpired ? undefined : onResume}
    >
      <div className={styles.pauseContent}>
        {isCountdownExpired ? (
          <>
            <Timer size={64} />
            <h2>Time&apos;s up!</h2>
            <p>Countdown reached zero.</p>
            {onNewPuzzle && (
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewPuzzle();
                }}
              >
                New Puzzle
              </Button>
            )}
          </>
        ) : (
          <>
            <Pause size={64} />
            <h2>Paused</h2>
            <p>Click anywhere or press the Resume button to continue</p>
          </>
        )}
      </div>
    </div>
  );
}
