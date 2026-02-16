import { useEffect, useState } from "react";
import styles from "./ProfilerOverlay.module.css";

export type PerfStats = {
  fps: number;
  drawsPerSec: number;
  activeGroups: number;
  snapCheckCount: number;
  snapChecksPerSec: number;
};

export function ProfilerOverlay({
  statsRef,
  visible,
}: {
  statsRef: React.RefObject<PerfStats | null>;
  visible: boolean;
}) {
  const [stats, setStats] = useState<PerfStats>({
    fps: 0,
    drawsPerSec: 0,
    activeGroups: 0,
    snapCheckCount: 0,
    snapChecksPerSec: 0,
  });

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      const s = statsRef.current;
      if (s) setStats({ ...s });
    }, 250);
    return () => clearInterval(interval);
  }, [visible, statsRef]);

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-label="Performance stats"
    >
      <div className={styles.row}>
        <span className={styles.label}>FPS</span>
        <span className={styles.value}>{stats.fps}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Draws/s</span>
        <span className={styles.value}>{stats.drawsPerSec}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Groups</span>
        <span className={styles.value}>{stats.activeGroups}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Snap checks</span>
        <span className={styles.value}>{stats.snapChecksPerSec}/s</span>
      </div>
    </div>
  );
}
