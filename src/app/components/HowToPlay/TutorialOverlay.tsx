// src/app/components/HowToPlay/TutorialOverlay.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Modal } from "@/components/Modal/Modal";
import styles from "./TutorialOverlay.module.css";

const TUTORIAL_SEEN_KEY = "phuzzle:tutorialSeen";

// Detect touch-first devices
const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  try {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia?.("(hover: none)").matches ||
      window.matchMedia?.("(pointer: coarse)").matches ||
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  } catch {
    return false;
  }
};

type TutorialOverlayProps = {
  isOpen: boolean;
  onComplete: () => void;
  /** When true (first-time), show "Don't show this again" link and persist dismissal */
  showSkipLink?: boolean;
};

/**
 * Single "How to Play" modal used for both:
 * - First-time new user popup (Play screen)
 * - "How to Play" button (Menu screen)
 */
export function TutorialOverlay({
  isOpen,
  onComplete,
  showSkipLink = false,
}: TutorialOverlayProps) {
  const isTouch = isTouchDevice();

  const handleDismiss = () => {
    if (showSkipLink) {
      localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    }
    onComplete();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} title="How to Play">
      <div className={styles.content}>
        <p className={styles.intro}>
          Drag and drop pieces to assemble the puzzle. Match all pieces to complete the
          image!
        </p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🧩 Moving Pieces</h3>
          <p>
            {isTouch ? "Touch and drag" : "Click and drag"} pieces to move them around the
            board.
          </p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🔄 Rotating Pieces</h3>
          <p>
            {isTouch
              ? "Tap a piece to rotate it 90°."
              : "Right-click a piece to rotate it 90°."}
          </p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>📥 Piece Drawer</h3>
          <p>
            {isTouch
              ? "Long-press a piece to send it to the drawer for later."
              : "Middle-click a piece to send it to the drawer for later."}
          </p>
          <p>Tap pieces in the drawer to bring them back to the board.</p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>📋 Menu Options</h3>
          <p>
            Open the <strong>Menu</strong> (☰) for helpful options:
          </p>
          <ul className={styles.tips}>
            <li>
              <strong>Undo:</strong> Reverse accidental moves from the menu or{" "}
              {isTouch ? "use the menu" : "press Ctrl+Z (⌘Z)"}.
            </li>
            <li>
              <strong>Lock pieces:</strong> When on, pieces that snap into place become
              locked so you can&apos;t accidentally move them.
            </li>
            <li>
              <strong>Ghost hint:</strong> When on, shows a faint preview of where each
              piece belongs—great when you&apos;re stuck!
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>✨ Tips</h3>
          <ul className={styles.tips}>
            <li>Start with edge and corner pieces</li>
            <li>Group pieces by color or pattern</li>
            <li>Use the Preview button to see the full image</li>
            <li>Pieces snap together when correctly aligned</li>
            <li>Undo accidental moves (Menu or Ctrl+Z / ⌘Z)</li>
            <li>Turn on Ghost hint (Menu or press G) when stuck</li>
            <li>
              Turn on Lock pieces (Menu) to prevent accidentally moving placed pieces
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleDismiss} fullWidth>
            {showSkipLink ? "Start Puzzling!" : "Got it!"}
          </Button>
          {showSkipLink && (
            <button className={styles.skipLink} onClick={handleDismiss}>
              Don&apos;t show this again
            </button>
          )}
        </div>
      </div>
    </Modal>
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
