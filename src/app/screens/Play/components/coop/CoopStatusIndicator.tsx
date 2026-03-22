/**
 * CoopStatusIndicator – small status for co-op Realtime connection.
 * Visible only when degraded (reconnecting/disconnected); text + icon so not color-only.
 */
import { WifiOff, Loader2 } from "lucide-react";
import type { RealtimeStatus } from "@/screens/Play/hooks/gameplay/usePuzzleSession";
import styles from "@/screens/Play/styles/PlayScreen.module.css";

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
        aria-hidden
      />
      {status === "disconnected" && <WifiOff size={14} aria-hidden />}
      {status === "reconnecting" && (
        <Loader2 size={14} className={styles.coopStatusSpinner} aria-hidden />
      )}
      <span className={styles.coopStatusLabel}>{label}</span>
      {connectedCount > 0 && (
        <span className={styles.coopStatusCount}>({connectedCount})</span>
      )}
    </div>
  );
}
