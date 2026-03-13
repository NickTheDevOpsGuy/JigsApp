import React from "react";
import styles from "./PuzzlePackModule.module.css";

type PuzzlePackModuleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function PuzzlePackModule({
  eyebrow = "Puzzle Packs",
  title,
  subtitle,
  children,
}: PuzzlePackModuleProps) {
  return (
    <section className={styles.moduleShell}>
      <header className={styles.moduleHeader}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title}>{title}</h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
