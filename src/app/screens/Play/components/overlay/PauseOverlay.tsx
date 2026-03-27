import React from "react";
import { Pause } from "lucide-react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";

interface PauseOverlayProps {
  onResume: () => void;
}

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onResume();
    }
  };
  return (
    <div
      className={styles.pauseOverlay}
      role="button"
      tabIndex={0}
      onClick={onResume}
      onKeyDown={handleKeyDown}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      aria-label="Resume game"
      title="Resume game"
    >
      <div className={styles.pauseContent}>
        <Pause size={64} aria-hidden />
        <h2>Paused</h2>
        <p>Click anywhere or press the Resume button to continue</p>
      </div>
    </div>
  );
}
