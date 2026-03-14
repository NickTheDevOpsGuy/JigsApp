/**
 * Step indicator / breadcrumb for setup flow. Shown in upper right.
 * Pack flow: Pack → Puzzle → Difficulty (current: Difficulty).
 * Custom flow: Source → Image → Difficulty (current: Image or Difficulty).
 */
import React from "react";

export function SetupStepIndicator(props: {
  styles: Record<string, string>;
  isPackFlow: boolean;
  hasImage: boolean;
}) {
  const { styles, isPackFlow, hasImage } = props;

  if (isPackFlow) {
    return (
      <div
        className={styles.stepIndicator}
        aria-label="Progress: Pack, Puzzle, Difficulty"
      >
        <span className={styles.stepSegment}>Pack</span>
        <span className={styles.stepSeparator} aria-hidden>
          →
        </span>
        <span className={styles.stepSegment}>Puzzle</span>
        <span className={styles.stepSeparator} aria-hidden>
          →
        </span>
        <span className={`${styles.stepSegment} ${styles.stepSegmentCurrent}`}>
          Difficulty
        </span>
      </div>
    );
  }

  return (
    <div
      className={styles.stepIndicator}
      aria-label="Progress: Source, Image, Difficulty"
    >
      <span className={styles.stepSegment}>Source</span>
      <span className={styles.stepSeparator} aria-hidden>
        →
      </span>
      <span
        className={`${styles.stepSegment} ${!hasImage ? styles.stepSegmentCurrent : ""}`}
      >
        Image
      </span>
      <span className={styles.stepSeparator} aria-hidden>
        →
      </span>
      <span
        className={`${styles.stepSegment} ${hasImage ? styles.stepSegmentCurrent : ""}`}
      >
        Difficulty
      </span>
    </div>
  );
}
