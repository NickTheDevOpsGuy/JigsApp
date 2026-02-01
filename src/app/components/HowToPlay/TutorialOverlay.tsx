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

        <p className={styles.tutorialIntro}>
          Drag and drop pieces to assemble the puzzle.
          <br />
          Match all pieces to complete the image.
        </p>

        <div className={styles.tutorialSteps}>
          {/* Moving */}
          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>👆</span>
            <div className={styles.stepContent}>
              <strong>Moving Pieces</strong>
              <p>
                {isTouch
                  ? "Touch and drag pieces to move them around the board."
                  : "Click and drag pieces to move them around the board."}
              </p>
            </div>
          </div>

          {/* Rotating */}
          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>🔄</span>
            <div className={styles.stepContent}>
              <strong>Rotating Pieces</strong>
              <p>
                {isTouch
                  ? "Single-tap a piece to rotate it 90°."
                  : "Right-click a piece to rotate it 90°."}
              </p>
            </div>
          </div>

          {/* Tray */}
          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>📥</span>
            <div className={styles.stepContent}>
              <strong>Piece Drawer</strong>
              <p>
                {isTouch
                  ? "Long-press a piece to send it to the drawer."
                  : "Middle-click a piece to send it to the drawer."}
              </p>
              <p>Tap a piece in the drawer to bring it back to the board.</p>
            </div>
          </div>

          {/* Tips */}
          <div className={styles.tutorialStep}>
            <span className={styles.stepIcon}>✨</span>
            <div className={styles.stepContent}>
              <strong>Tips</strong>
              <ul>
                <li>Start with edge and corner pieces</li>
                <li>Group pieces by color or pattern</li>
                <li>Use Preview to see the full image</li>
                <li>Pieces snap together when aligned correctly</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.tutorialFooter}>
          <Button variant="primary" onClick={handleDismiss} fullWidth>
            Start Puzzling!
          </Button>
          <button className={styles.skipLink} onClick={handleDismiss}>
            Don’t show this again
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
