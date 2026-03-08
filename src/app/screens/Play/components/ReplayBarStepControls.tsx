import React from "react";
import styles from "./ReplayBar.module.css";

interface ReplayBarStepControlsProps {
  currentIndex: number;
  totalSnapshots: number;
  onSeek: (index: number) => void;
  canStepBack: boolean;
  canStepForward: boolean;
  stopProp: (e: React.PointerEvent) => void;
}

export function ReplayBarStepControls({
  currentIndex,
  totalSnapshots,
  onSeek,
  canStepBack,
  canStepForward,
  stopProp,
}: ReplayBarStepControlsProps) {
  return (
    <div className={styles.replayBarStepRow}>
      <button
        type="button"
        className={styles.replayBarStepBtn}
        onClick={() => onSeek(Math.max(0, currentIndex - 1))}
        onPointerDown={stopProp}
        disabled={!canStepBack}
        aria-label="Step back"
        title="Step back"
      >
        &lt;&lt;
      </button>
      <button
        type="button"
        className={styles.replayBarStepBtn}
        onClick={() => onSeek(Math.min(totalSnapshots - 1, currentIndex + 1))}
        onPointerDown={stopProp}
        disabled={!canStepForward}
        aria-label="Step forward"
        title="Step forward"
      >
        &gt;&gt;
      </button>
    </div>
  );
}
