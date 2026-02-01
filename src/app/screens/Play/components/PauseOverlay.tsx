import React from "react";
import { Pause } from "lucide-react";
import styles from "../PlayScreen.module.css";

interface PauseOverlayProps {
  onResume: () => void;
}

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <div className={styles.pauseOverlay} onClick={onResume}>
      <div className={styles.pauseContent}>
        <Pause size={64} />
        <h2>Paused</h2>
        <p>Click anywhere or press the Resume button to continue</p>
      </div>
    </div>
  );
}
