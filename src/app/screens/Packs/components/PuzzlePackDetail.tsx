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
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed >= total;

  return (
    <section className={`${styles.detailHeader} ${isComplete ? styles.completeCelebrate : ""}`}>
      <div className={styles.detailStatusRow}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{description}</p>
        </div>
        <div className={styles.statusGroup}>
          <span className={styles.statusChip}>
            {isComplete ? "✔ Pack Complete" : `${percent}% complete`}
          </span>
          {nextLabel ? <p className={styles.statusHint}>Up next: {nextLabel}</p> : null}
        </div>
      </div>
      <PuzzlePackProgress completed={completed} total={total} />
      {children}
    </section>
  );
}
