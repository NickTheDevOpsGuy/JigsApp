/**
 * CoopStatusIndicator – small status dot for co-op Realtime connection.
 * Visible only when degraded (reconnecting/disconnected); auto-hides when healthy.
 */
import React from "react";
import type { RealtimeStatus } from "../hooks/usePuzzleSession";
import styles from "../PlayScreen.module.css";

export function CoopStatusIndicator({
  status,
  connectedCount,
}: {
  status: RealtimeStatus;
  connectedCount: number;
}) {
  if (!status || status === "connected") return null;

  const label =
    status === "reconnecting"
      ? "Reconnecting…"
      : status === "disconnected"
        ? "Disconnected"
        : "";

  const dotColor =
    status === "reconnecting"
      ? "var(--color-warning, #eab308)"
      : status === "disconnected"
        ? "var(--color-error, #dc2626)"
        : "var(--color-success, #22c55e)";

  return (
    <div
      className={styles.coopStatusIndicator}
      role="status"
      aria-live="polite"
      title={label}
    >
      <span
        className={styles.coopStatusDot}
        style={{ backgroundColor: dotColor }}
      />
      <span className={styles.coopStatusLabel}>{label}</span>
      {connectedCount > 0 && (
        <span className={styles.coopStatusCount}>({connectedCount})</span>
      )}
    </div>
  );
}
