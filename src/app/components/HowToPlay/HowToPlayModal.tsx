// src/app/components/HowToPlay/HowToPlayModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "@/components/Modal/Modal";
import { Button } from "@/components/Button/Button";
import styles from "./HowToPlay.module.css";

const TUTORIAL_SEEN_KEY = "phuzzle:tutorialSeen";

// Detect touch-first devices. We lean toward "touch" when uncertain to avoid
// showing mouse-only tips (right-click) on mobile.
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

/**
 * Hook to check if tutorial should be shown (first-time users).
 * Returns [shouldShow, dismiss] tuple.
 */
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

/**
 * Utility to reset tutorial (for testing).
 */
export function resetTutorial() {
  localStorage.removeItem(TUTORIAL_SEEN_KEY);
}

type HowToPlayModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const isTouch = isTouchDevice();

  const handleClose = () => {
    // Mark as seen when closing
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="How to Play">
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
          <h3 className={styles.sectionTitle}>✨ Tips</h3>
          <ul className={styles.tips}>
            <li>Start with edge and corner pieces</li>
            <li>Group pieces by color or pattern</li>
            <li>Use the Preview button to see the full image</li>
            <li>Pieces snap together when correctly aligned</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleClose} fullWidth>
            Got it!
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default HowToPlayModal;
