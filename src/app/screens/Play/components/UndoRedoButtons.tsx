/**
 * UndoRedoButtons – segmented [Undo | Redo] for top bar.
 * Per spec: actions live in top bar, not Settings.
 */
import React from "react";
import { Undo2, Redo2 } from "lucide-react";
import styles from "../PlayScreen.module.css";

interface UndoRedoButtonsProps {
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
}

export function UndoRedoButtons({
  canUndo,
  onUndo,
  canRedo,
  onRedo,
}: UndoRedoButtonsProps) {
  return (
    <div
      className={styles.undoRedoSegment}
      role="group"
      aria-label="Undo and redo"
      title="Undo and redo"
    >
      <button
        type="button"
        className={styles.undoRedoBtn}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title={canUndo ? "Undo last move" : "No moves to undo yet"}
      >
        <Undo2 size={16} />
      </button>
      <button
        type="button"
        className={styles.undoRedoBtn}
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title={canRedo ? "Redo last undone move" : "No moves to redo yet"}
      >
        <Redo2 size={16} />
      </button>
    </div>
  );
}
