// src/app/components/ShortcutsModal/ShortcutsModal.tsx
import React from "react";
import { X, Keyboard } from "lucide-react";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import styles from "./ShortcutsModal.module.css";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Keyboard size={24} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
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

          <div className={styles.mouseSection}>
            <h3>Zoom & Pan</h3>
            <table className={styles.table}>
              <tbody>
                <tr>
                  <td className={styles.keys}>
                    <kbd className={styles.key}>Scroll Wheel</kbd> on board
                  </td>
                  <td className={styles.action}>Zoom in/out (desktop)</td>
                </tr>
                <tr>
                  <td className={styles.keys}>
                    <kbd className={styles.key}>Middle mouse</kbd> + Drag
                  </td>
                  <td className={styles.action}>Pan (desktop)</td>
                </tr>
                <tr>
                  <td className={styles.keys}>
                    <kbd className={styles.key}>Two-finger pinch</kbd>
                  </td>
                  <td className={styles.action}>Zoom in/out (iOS & Android)</td>
                </tr>
                <tr>
                  <td className={styles.keys}>
                    <kbd className={styles.key}>Two-finger drag</kbd>
                  </td>
                  <td className={styles.action}>Pan (iOS & Android)</td>
                </tr>
                <tr>
                  <td className={styles.keys}>
                    <kbd className={styles.key}>Single-finger drag</kbd> on empty space
                  </td>
                  <td className={styles.action}>Pan when zoomed (iOS & Android)</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.navNote}>
              💡 <strong>Tip:</strong> The puzzle board fits your screen. Use the piece
              tray at the bottom to organize pieces, and use the arrow keys to nudge
              selected pieces.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>
            Press <kbd className={styles.key}>?</kbd> anytime to show this
          </span>
        </div>
      </div>
    </div>
  );
}

// Format key names for display
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
    "Ctrl+Shift+Z": "Ctrl+Shift+Z",
    "⌘⇧Z": "⌘⇧Z",
    "Ctrl+Y": "Ctrl+Y",
    "⌘Y": "⌘ Y",
  };
  return keyMap[key] || key.toUpperCase();
}
