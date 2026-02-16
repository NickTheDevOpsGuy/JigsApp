// src/app/components/HowToPlay/TutorialOverlay.tsx
import React, { useState } from "react";
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
          <h3 className={styles.sectionTitle}>📐 Rows & Columns</h3>
          <p>
            When creating a puzzle, <strong>rows</strong> and <strong>columns</strong> set
            how many pieces the image is split into. A 4×4 grid = 16 pieces; 6×6 = 36
            pieces. More pieces = harder puzzle.
          </p>
        </div>

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
            Drag pieces to the drawer to store them for later. Tap pieces in the drawer to
            bring them back to the board.
          </p>
          <p>
            Filter by <strong>All</strong>, <strong>Edges</strong>, <strong>Center</strong>, or{" "}
            <strong>Corners</strong> to find pieces quickly. For puzzles with 25+ pieces, use
            compact mode to fit more thumbnails. Sort by grid position or color.
          </p>
        </div>

        {isTouch && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📱 Zoom & Pan</h3>
            <p>
              Pinch with two fingers to zoom in or out on the board. Drag with two fingers
              to pan, or drag with one finger on empty space when zoomed. Great for larger
              puzzles!
            </p>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>⏱ Time Modes</h3>
          <p>
            Choose how time is tracked from the <strong>Menu</strong> (☰) → Settings:
          </p>
          <ul className={styles.tips}>
            <li>
              <strong>Elapsed:</strong> Timer counts up from zero (default).
            </li>
            <li>
              <strong>Countdown:</strong> Race against the clock—finish before time runs
              out!
            </li>
            <li>
              <strong>Active only:</strong> Timer pauses when you stop moving pieces—great
              for multitasking.
            </li>
            <li>
              <strong>Relaxed:</strong> Timer hidden—no pressure, just puzzle.
            </li>
            <li>
              <strong>Best time:</strong> Track your personal best for each grid size.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>📋 Menu Options</h3>
          <p>
            Open the <strong>Menu</strong> (☰) for helpful options:
          </p>
          <ul className={styles.tips}>
            <li>
              <strong>Undo / Redo:</strong> Reverse or re-apply moves from the menu or{" "}
              {isTouch ? "use the menu" : "press Ctrl+Z / Ctrl+Shift+Z (⌘Z / ⌘⇧Z)"}.
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
            <li>Undo / Redo moves (Menu or Ctrl+Z / Ctrl+Shift+Z)</li>
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

/**
 * Hook for tutorial visibility.
 * No longer auto-shows the full modal on first visit—contextual onboarding handles that.
 * Used when user taps "How to Play"; showSkipLink persists "Don't show again".
 */
export function useShouldShowTutorial(): [boolean, () => void] {
  const [shouldShow, setShouldShow] = useState(false);

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
