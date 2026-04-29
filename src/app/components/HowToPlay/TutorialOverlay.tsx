/**
 * TutorialOverlay – "How to Play" modal; first-time popup or from Help menu.
 */
import React, { useState } from "react";
import { Button } from "@/components/Button/Button";
import { Modal } from "@/components/Modal/Modal";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
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

function Keycap({ children }: { children: React.ReactNode }) {
  return <kbd className={styles.keycap}>{children}</kbd>;
}

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
      safeLocalStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    }
    onComplete();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="How to Play"
      variant="tutorial"
      showCloseButton
    >
      <div className={styles.wrapper}>
        {/* Row 1: How it Works (2 wide) */}
        <div className={styles.row}>
          <h3 className={styles.rowTitle}>How it Works</h3>
          <div className={styles.rowGrid}>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Rows & Columns</h4>
              <p>
                When creating a puzzle, <strong>rows</strong> and <strong>columns</strong>{" "}
                set how many pieces the image is split into. A 4×4 grid = 16 pieces; 6×6 =
                36 pieces. More pieces = harder puzzle.
              </p>
            </section>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Moving Pieces</h4>
              <p>
                {isTouch ? "Touch and drag" : "Click and drag"} pieces to move them around
                the board.
              </p>
            </section>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Fitting Pieces</h4>
              <p>
                Drag pieces onto the board. When a piece is close to the correct spot, the
                target highlights and shows whether it fits or is almost aligned.
              </p>
            </section>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Rotating Pieces</h4>
              <p>
                {isTouch
                  ? "Tap a piece to rotate it 90°."
                  : "Right-click a piece to rotate it 90°."}
              </p>
            </section>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Piece Drawer</h4>
              <p>
                Drag pieces to the drawer to store them for later. Tap pieces in the
                drawer to bring them back to the board.
              </p>
            </section>
          </div>
        </div>

        {/* Row 2: Controls (2 wide) */}
        <div className={styles.row}>
          <h3 className={styles.rowTitle}>Controls</h3>
          <div className={styles.rowGrid}>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Time Modes</h4>
              <p>
                Choose how time is tracked from <Keycap>☰ Menu</Keycap> → Settings:
              </p>
              <ul className={styles.tips}>
                <li>
                  <strong>Elapsed</strong> — Timer counts up from zero
                </li>
                <li>
                  <strong>Countdown</strong> — Race against the clock
                </li>
                <li>
                  <strong>Active only</strong> — Timer pauses when you stop
                </li>
                <li>
                  <strong>Relaxed</strong> — Timer hidden
                </li>
                <li>
                  <strong>Best time</strong> — Track your PBs per grid size
                </li>
              </ul>
            </section>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Menu Options</h4>
              <p>
                Open <Keycap>☰ Menu</Keycap> for helpful options:
              </p>
              <ul className={styles.tips}>
                <li>
                  <strong>Undo / Redo</strong> —{" "}
                  {isTouch ? (
                    "From menu"
                  ) : (
                    <>
                      <Keycap>Ctrl+Z</Keycap> / <Keycap>Ctrl+Shift+Z</Keycap>
                    </>
                  )}
                </li>
                <li>
                  <strong>Ghost when idle</strong> — Auto-shows after a few seconds
                </li>
                <li>
                  <strong>Edge highlight</strong> — Optional faint border on edges
                </li>
                <li>
                  <strong>Daily streak freeze</strong> — Protect your streak
                </li>
              </ul>
            </section>
            {isTouch && (
              <section className={styles.section}>
                <h4 className={styles.sectionTitle}>Zoom & Pan</h4>
                <p>
                  Pinch with two fingers to zoom in or out. Drag with two fingers to pan,
                  or one finger on empty space when zoomed.
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Row 3: Tools (2 wide) */}
        <div className={styles.row}>
          <h3 className={styles.rowTitle}>Tools</h3>
          <div className={styles.rowGrid}>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Piece Drawer</h4>
              <p>
                Filter by <strong>All</strong>, <strong>Edges</strong>,{" "}
                <strong>Center</strong>, or <strong>Corners</strong>. Sort by grid
                position or color.
              </p>
            </section>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Preview & Hints</h4>
              <ul className={styles.tips}>
                <li>
                  <strong>Preview</strong> — See the full image (Menu or{" "}
                  <Keycap>P</Keycap>)
                </li>
                <li>
                  <strong>Ghost hint</strong> — Faint preview of where each piece goes.
                  {isTouch ? (
                    " Great when stuck!"
                  ) : (
                    <>
                      {" "}
                      Press <Keycap>G</Keycap> when stuck.
                    </>
                  )}
                </li>
                <li>
                  <strong>Lock pieces</strong> — Snap = locked, no accidental moves
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* Row 4: Tips (full width) */}
        <div className={styles.row}>
          <h3 className={styles.rowTitle}>Tips</h3>
          <section className={styles.section}>
            <ul className={styles.tips}>
              <li>Start with edge and corner pieces</li>
              <li>Group pieces by color or pattern</li>
              <li>Use the Preview button to see the full image</li>
              <li>Release when the “Fits here” preview appears to snap into place</li>
              <li>Turn on Ghost hint when stuck</li>
              <li>
                Stats → Leaderboard → Week → Album shows your 7-day collection with daily
                thumbnails
              </li>
            </ul>
          </section>
        </div>

        <div className={styles.actionsSticky}>
          <Button variant="primary" onClick={handleDismiss} fullWidth>
            {showSkipLink ? "Start Puzzling!" : "Got it!"}
          </Button>
          {showSkipLink && (
            <button
              type="button"
              className={styles.skipLink}
              onClick={handleDismiss}
              aria-label="Dismiss tutorial and do not show again"
            >
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
    safeLocalStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    setShouldShow(false);
  };

  return [shouldShow, dismiss];
}

// Utility to reset tutorial (for testing)
export function resetTutorial() {
  safeLocalStorage.removeItem(TUTORIAL_SEEN_KEY);
}

export default TutorialOverlay;
