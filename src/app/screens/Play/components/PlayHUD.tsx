import React from "react";
import { Clock, Puzzle, Pause, Play } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";
import { formatTime } from "../playUtils";

interface PlayHUDProps {
  elapsedSeconds: number;
  piecesLeft: number;
  isPaused: boolean;
  isComplete: boolean;
  onTogglePause: () => void;
}

export function PlayHUD({
  elapsedSeconds,
  piecesLeft,
  isPaused,
  isComplete,
  onTogglePause,
}: PlayHUDProps) {
  return (
    <div className={styles.hud}>
      <div className={styles.hudPillTimer}>
        <Clock size={14} />
        <span className={styles.timerText}>{formatTime(elapsedSeconds)}</span>
      </div>
      <Button size="sm" onClick={onTogglePause} disabled={isComplete}>
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </Button>
      <div className={styles.hudPill}>
        <Puzzle size={14} />
        <span>{piecesLeft} left</span>
      </div>
    </div>
  );
}
