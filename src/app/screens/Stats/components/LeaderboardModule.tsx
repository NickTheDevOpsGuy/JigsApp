import React from "react";
import styles from "./LeaderboardModule.module.css";

export function LeaderboardModule(props: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  headerSlot?: React.ReactNode;
  infoSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { eyebrow = "Competition", title, subtitle, headerSlot, infoSlot, children } =
    props;

  return (
    <section className={styles.moduleCard}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          {headerSlot}
        </div>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {infoSlot}
      </header>
      {children}
    </section>
  );
}

export function LeaderboardEmptyState(props: { title: string; text: string }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{props.title}</p>
      <p className={styles.emptyText}>{props.text}</p>
    </div>
  );
}

export function LeaderboardRows({ children }: { children: React.ReactNode }) {
  return <ol className={styles.list}>{children}</ol>;
}

export function LeaderboardRow(props: {
  rankLabel: string;
  name: string;
  meta?: string;
  metric: string;
  secondaryMetric?: string;
  isCurrentPlayer?: boolean;
  isPodium?: boolean;
}) {
  const { rankLabel, name, meta, metric, secondaryMetric, isCurrentPlayer, isPodium } =
    props;

  return (
    <li
      className={`${styles.row} ${isCurrentPlayer ? styles.rowCurrent : ""} ${isPodium ? styles.rowPodium : ""}`}
    >
      <span className={styles.rank}>{rankLabel}</span>
      <div className={styles.playerCol}>
        <span className={styles.name}>{name}</span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </div>
      <span className={styles.metric}>{metric}</span>
      {secondaryMetric ? (
        <span className={styles.secondaryMetric}>{secondaryMetric}</span>
      ) : (
        <span className={styles.secondaryMetric} aria-hidden="true" />
      )}
    </li>
  );
}
