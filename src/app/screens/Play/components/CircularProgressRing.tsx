/**
 * CircularProgressRing – progress ring around board frame.
 * Smooth fill, color shift at 75% and 95%.
 */
import React from "react";
import styles from "../PlayScreen.module.css";

interface CircularProgressRingProps {
  progress: number; // 0–1
  strokeWidth?: number;
  className?: string;
}

export function CircularProgressRing({
  progress,
  strokeWidth = 6,
  className = "",
}: CircularProgressRingProps) {
  const size = 100;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  const getColor = () => {
    if (progress >= 0.95) return "var(--color-progress-95, #fbbf24)";
    if (progress >= 0.75) return "var(--color-progress-75, #22c55e)";
    return "var(--color-brand-primary, #3b82f6)";
  };

  return (
    <svg
      className={`${styles.circularProgressRing} ${className}`}
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <circle
        className={styles.circularProgressBg}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
      />
      <circle
        className={styles.circularProgressFill}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        stroke={getColor()}
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.2s ease" }}
      />
    </svg>
  );
}
