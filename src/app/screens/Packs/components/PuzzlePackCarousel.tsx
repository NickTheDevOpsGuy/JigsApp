import React from "react";
import styles from "./PuzzlePackModule.module.css";

export function PuzzlePackCarousel({ children }: { children: React.ReactNode }) {
  return <div className={styles.carousel}>{children}</div>;
}
