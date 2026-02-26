/**
 * UndoRedoButtons – pill-style [↶ Undo] [↷ Redo] above piece drawer.
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
    <div className={styles.undoRedoPills} role="group" aria-label="Undo and redo">
      <button
        type="button"
        className={styles.undoRedoPill}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title={canUndo ? "Undo last move" : "No moves to undo yet"}
      >
        <Undo2 size={14} />
        <span>Undo</span>
      </button>
      <button
        type="button"
        className={styles.undoRedoPill}
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title={canRedo ? "Redo last undone move" : "No moves to redo yet"}
      >
        <Redo2 size={14} />
        <span>Redo</span>
      </button>
    </div>
  );
}
