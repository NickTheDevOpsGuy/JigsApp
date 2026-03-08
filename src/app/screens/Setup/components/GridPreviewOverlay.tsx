import styles from "../SetupScreen.module.css";

/** Grid preview overlay to show where cuts will land */
export function GridPreviewOverlay({
  rows,
  cols,
  visible,
}: {
  rows: number;
  cols: number;
  visible: boolean;
}) {
  if (!visible || rows < 2 || cols < 2) return null;

  const lines = [];

  for (let c = 1; c < cols; c++) {
    const pct = (c / cols) * 100;
    lines.push(
      <div
        key={`v-${c}`}
        className={styles.gridLine}
        style={{
          left: `${pct}%`,
          top: 0,
          bottom: 0,
          width: "2px",
        }}
      />,
    );
  }

  for (let r = 1; r < rows; r++) {
    const pct = (r / rows) * 100;
    lines.push(
      <div
        key={`h-${r}`}
        className={styles.gridLine}
        style={{
          top: `${pct}%`,
          left: 0,
          right: 0,
          height: "2px",
        }}
      />,
    );
  }

  return <div className={styles.gridOverlay}>{lines}</div>;
}
