import React from "react";
import styles from "./ReplayBar.module.css";

const SPEEDS = [1, 2, 3] as const;

interface ReplayBarSpeedControlsProps {
  speed: number;
  speedExplicitlyChosen: boolean;
  onSpeedChange: (speed: number) => void;
  stopProp: (e: React.PointerEvent) => void;
}

export function ReplayBarSpeedControls({
  speed,
  speedExplicitlyChosen,
  onSpeedChange,
  stopProp,
}: ReplayBarSpeedControlsProps) {
  return (
    <div className={styles.replayBarSpeedGroup} role="group" aria-label="Playback speed">
      {SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          className={`${styles.replaySpeedBtn} ${speedExplicitlyChosen && speed === s ? styles.replaySpeedBtnActive : ""}`}
          onClick={() => onSpeedChange(s)}
          onPointerDown={stopProp}
          aria-label={`${s}x speed`}
          aria-pressed={speedExplicitlyChosen && speed === s}
          title={`${s}x speed`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
