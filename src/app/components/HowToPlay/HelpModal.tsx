// src/app/components/HowToPlay/HelpModal.tsx
// Unified Help modal: How to Play + Keyboard Shortcuts (dual-purpose)

import React, { useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Modal } from "@/components/Modal/Modal";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import styles from "./HelpModal.module.css";

const TUTORIAL_SEEN_KEY = "phuzzle:tutorialSeen";

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

function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    " ": "Space",
    Space: "Space",
    Shift: "⇧ Shift",
    Tab: "⇥ Tab",
    Esc: "Esc",
    Escape: "Esc",
    F1: "F1",
    "Ctrl+Z": "Ctrl+Z",
    "⌘Z": "⌘ Z",
    "Ctrl+Shift+Z": "Ctrl+⇧Z",
    "⌘⇧Z": "⌘⇧Z",
    "Ctrl+Y": "Ctrl+Y",
    "⌘Y": "⌘Y",
    "↑ ↓ ← →": "↑↓←→",
  };
  return keyMap[key] || key.toUpperCase();
}

export type HelpTab = "tutorial" | "shortcuts";

type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Which tab to show when opening */
  initialTab?: HelpTab;
  /** For first-time popup: show "Don't show again" and persist dismissal */
  showSkipLink?: boolean;
};

export function HelpModal({
  isOpen,
  onClose,
  initialTab = "tutorial",
  showSkipLink = false,
}: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>(initialTab);
  const isTouch = isTouchDevice();

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const handleDismiss = () => {
    if (showSkipLink) localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} title="Help" showCloseButton={true}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={activeTab === "tutorial" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("tutorial")}
        >
          How to Play
        </button>
        <button
          type="button"
          className={activeTab === "shortcuts" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("shortcuts")}
        >
          Shortcuts
        </button>
      </div>

      <div className={styles.panel}>
        {activeTab === "tutorial" && (
          <div className={styles.content}>
            <p className={styles.intro}>
              Drag and drop pieces to assemble the puzzle. Match all pieces to complete
              the image!
            </p>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📐 Rows & Columns</h3>
              <p>
                When creating a puzzle, <strong>rows</strong> and <strong>columns</strong>{" "}
                set how many pieces the image is split into. A 4×4 grid = 16 pieces; 6×6 =
                36 pieces. More pieces = harder puzzle.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🧩 Moving Pieces</h3>
              <p>
                {isTouch ? "Touch and drag" : "Click and drag"} pieces to move them around
                the board.
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
                Drag pieces to the drawer to store them for later. Tap pieces in the
                drawer to bring them back to the board.
              </p>
            </div>

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
                  <strong>Countdown:</strong> Race against the clock—finish before time
                  runs out!
                </li>
                <li>
                  <strong>Active only:</strong> Timer pauses when you stop moving
                  pieces—great for multitasking.
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
                  <strong>Undo:</strong> Reverse accidental moves from the menu or{" "}
                  {isTouch ? "use the menu" : "press Ctrl+Z (⌘Z)"}.
                </li>
                <li>
                  <strong>Lock pieces:</strong> When on, pieces that snap into place
                  become locked so you can&apos;t accidentally move them.
                </li>
                <li>
                  <strong>Ghost hint:</strong> When on, shows a faint preview of where
                  each piece belongs—great when you&apos;re stuck!
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
          </div>
        )}

        {activeTab === "shortcuts" && (
          <div className={styles.shortcutsContent}>
            <table className={styles.table}>
              <tbody>
                {SHORTCUTS.map((shortcut, i) => (
                  <tr key={i}>
                    <td className={styles.keys}>
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && <span className={styles.separator}>or</span>}
                          <kbd className={styles.key}>{formatKey(key)}</kbd>
                        </React.Fragment>
                      ))}
                    </td>
                    <td className={styles.action}>{shortcut.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.mouseSection}>
              <h3>Mouse / Touch Controls</h3>
              <table className={styles.table}>
                <tbody>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Left Click</kbd> + Drag
                    </td>
                    <td className={styles.action}>Move piece</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Shift</kbd> + Drag
                    </td>
                    <td className={styles.action}>Pan board</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Middle Click</kbd> + Drag
                    </td>
                    <td className={styles.action}>Pan board</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Right Click</kbd>
                    </td>
                    <td className={styles.action}>Rotate piece</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Drag</kbd> to drawer
                    </td>
                    <td className={styles.action}>Store piece (desktop & touch)</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Tap</kbd>
                    </td>
                    <td className={styles.action}>Rotate piece (touch)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={styles.navNote}>
              💡 <strong>Tip:</strong> Scroll wheel zooms; Shift+drag or middle-click+drag
              pans. Use keys 1–4 to filter the tray (All, Edges, Corners, Center).
            </p>
          </div>
        )}
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
    </Modal>
  );
}

// Hook for first-time tutorial popup
export function useShouldShowTutorial(): [boolean, () => void] {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) setShouldShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    setShouldShow(false);
  };

  return [shouldShow, dismiss];
}

export function resetTutorial() {
  localStorage.removeItem(TUTORIAL_SEEN_KEY);
}
