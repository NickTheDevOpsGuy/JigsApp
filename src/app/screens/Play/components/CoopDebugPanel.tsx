/**
 * CoopDebugPanel – dev-only debug info for co-op sessions.
 * Session ID, connected count, last event, channel, DB write latency.
 */
import React from "react";
import styles from "./ProfilerOverlay.module.css";

export function CoopDebugPanel({
  sessionId,
  connectedCount,
  lastEventTimestamp,
  lastDbWriteMs,
  channelName,
}: {
  sessionId: string | null;
  connectedCount: number;
  lastEventTimestamp: number | null;
  lastDbWriteMs: number | null;
  channelName: string | null;
}) {
  if (!sessionId || !import.meta.env.DEV) return null;

  const lastEventStr = lastEventTimestamp
    ? new Date(lastEventTimestamp).toISOString().slice(11, 23)
    : "—";

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-label="Co-op session debug"
      style={{ bottom: "auto", top: 60, left: 12 }}
    >
      <div className={styles.row}>
        <span className={styles.label}>Session</span>
        <span className={styles.value} title={sessionId}>
          {sessionId.slice(0, 8)}…
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Users</span>
        <span className={styles.value}>{connectedCount}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Last event</span>
        <span className={styles.value}>{lastEventStr}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Channel</span>
        <span className={styles.value} title={channelName ?? ""}>
          {channelName ?? "—"}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>DB write</span>
        <span className={styles.value}>
          {lastDbWriteMs != null ? `${lastDbWriteMs}ms` : "—"}
        </span>
      </div>
    </div>
  );
}
