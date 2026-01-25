// src/app/components/HowToPlay/TutorialOverlay.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import styles from "./HowToPlay.module.css";

const TUTORIAL_SEEN_KEY = "phuzzle:tutorialSeen";

// Detect touch device
const isTouchDevice = () =>
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

type TutorialOverlayProps = {
  onComplete: () => void;
};

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const isTouch = isTouchDevice();

  const handleDismiss = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    onComplete();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.tutorialCard}>
        <div className={styles.tutorialIcon}>🧩</div>
        <h2 className={styles.tutorialTitle}>Welcome to Phuzzle!</h2>

        <div className={styles.tutorialSteps}>
          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>👆</span>
            <span className={styles.stepText}>
              <strong>{isTouch ? "Drag" : "Click & drag"}</strong> pieces to move them
            </span>
          </div>

          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>🔄</span>
            <span className={styles.stepText}>
              <strong>{isTouch ? "Double-tap" : "Right-click"}</strong> to rotate pieces
            </span>
          </div>

          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>📥</span>
            <span className={styles.stepText}>
              <strong>{isTouch ? "Long-press" : "Middle-click"}</strong> to store pieces
              in the drawer
            </span>
          </div>

          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>✨</span>
            <span className={styles.stepText}>
              Pieces <strong>snap together</strong> when correctly aligned
            </span>
          </div>
        </div>

        <div className={styles.tutorialFooter}>
          <Button variant="primary" onClick={handleDismiss} fullWidth>
            Start Puzzling!
          </Button>
          <button className={styles.skipLink} onClick={handleDismiss}>
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to check if tutorial should be shown
export function useShouldShowTutorial(): [boolean, () => void] {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_SEEN_KEY);
    if (!seen) {
      setShouldShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    setShouldShow(false);
  };

  return [shouldShow, dismiss];
}

// Utility to reset tutorial (for testing)
export function resetTutorial() {
  localStorage.removeItem(TUTORIAL_SEEN_KEY);
}

export default TutorialOverlay;
