import React from "react";
import styles from "../PlayScreen.module.css";

type TopBarKeyboardHintsProps = {
  hidden?: boolean;
};

export function TopBarKeyboardHints({ hidden = false }: TopBarKeyboardHintsProps) {
  if (hidden) return null;
  return (
    <div className={styles.keyboardHints} aria-label="Keyboard shortcuts">
      <span className={styles.keyboardHint}><kbd>R</kbd> Rotate</span>
      <span className={styles.keyboardHint}><kbd>U</kbd> Undo</span>
      <span className={styles.keyboardHint}><kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo</span>
    </div>
  );
}
