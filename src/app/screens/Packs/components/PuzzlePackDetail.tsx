import React from "react";
import styles from "./PuzzlePackModule.module.css";
import { PuzzlePackProgress } from "./PuzzlePackProgress";

type PuzzlePackDetailProps = {
  title: string;
  description: string;
  completed: number;
  total: number;
  nextLabel?: string | null;
  children: React.ReactNode;
};

export function PuzzlePackDetail({
  title,
  description,
  completed,
  total,
  nextLabel,
  children,
}: PuzzlePackDetailProps) {
  const isComplete = total > 0 && completed >= total;

  return (
    <section
      className={`${styles.detailHeader} ${isComplete ? styles.completeCelebrate : ""}`}
    >
      <div className={styles.detailStatusRow}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.subtitle}>{description}</p> : null}
        </div>
        <div className={styles.statusGroup}>
          {isComplete ? (
            <span className={styles.statusChip}>✔ Pack Complete</span>
          ) : null}
          {nextLabel ? <p className={styles.statusHint}>Up next: {nextLabel}</p> : null}
        </div>
      </div>
      <PuzzlePackProgress
        completed={completed}
        total={total}
        showPercentInline={!isComplete}
      />
      {children}
    </section>
  );
}
