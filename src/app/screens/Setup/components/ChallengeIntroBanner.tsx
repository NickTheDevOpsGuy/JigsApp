/**
 * Shown when opening a Beat My Puzzle link: friend's result and CTA to play.
 */
import React from "react";
import { Play } from "lucide-react";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import { getDifficultyLabel } from "@/screens/Play/core/share/shareMessages";
import { Button } from "@/components/Button/Button";
import styles from "./ChallengeIntroBanner.module.css";

export function ChallengeIntroBanner(props: {
  puzzleName?: string;
  pieceCount: number;
  challengeTimeSeconds: number;
  challengeMoves: number;
  onPlay: () => void;
  disabled?: boolean;
}) {
  const { puzzleName, pieceCount, challengeTimeSeconds, challengeMoves, onPlay, disabled } = props;
  const difficulty = getDifficultyLabel(pieceCount);
  const timeStr = formatTime(challengeTimeSeconds);

  return (
    <section className={styles.banner} aria-label="Challenge from friend">
      <p className={styles.message}>Your friend challenged you to beat their puzzle.</p>
      {puzzleName && (
        <p className={styles.puzzleName}>Puzzle: {puzzleName}</p>
      )}
      <p className={styles.stats}>
        Difficulty: {difficulty} ({pieceCount} pieces)
      </p>
      <p className={styles.theirResult}>
        Their result: ⏱ {timeStr} · 🔁 {challengeMoves} moves
      </p>
      <Button
        variant="primary"
        size="sm"
        className={styles.playBtn}
        onClick={onPlay}
        disabled={disabled}
        aria-label="Play puzzle"
      >
        Play Puzzle
        <Play size={16} />
      </Button>
    </section>
  );
}
