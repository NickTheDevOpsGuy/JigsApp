/**
 * Co-op join flow: loading and error views when joining via URL.
 * Renders loading spinner or error card, or children when not in join flow.
 */
import React from "react";
import posthog from "posthog-js";
import type { PuzzleSession } from "@/services/puzzleSessionService";
import styles from "../PlayScreen.module.css";

export type PlayScreenCoopViewProps = {
  isHost: boolean;
  sessionIdFromUrl: string | null;
  sessionLoading: boolean;
  session: PuzzleSession | null;
  joinError: Error | null;
  retryJoin: () => void;
  navigate: (to: string) => void;
  children: React.ReactNode;
};

export function PlayScreenCoopView({
  isHost,
  sessionIdFromUrl,
  sessionLoading,
  session,
  joinError,
  retryJoin,
  navigate,
  children,
}: PlayScreenCoopViewProps) {
  if (isHost || !sessionIdFromUrl) return <>{children}</>;

  if (sessionLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingOverlay} aria-label="Loading session">
          <div className={styles.spinner} />
          <span>Joining puzzle session…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    posthog.capture("coop_join_failed", {
      session_id: sessionIdFromUrl,
      error_type: joinError?.message ?? "session_not_found",
    });
    const debugInfo = `sessionId=${sessionIdFromUrl}\ntime=${new Date().toISOString()}`;
    const copyDebug = () => navigator.clipboard.writeText(debugInfo).catch(() => {});
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ padding: 24, maxWidth: 360 }}>
          <h2>Couldn't join session</h2>
          <p>
            The puzzle session may have expired, the link is invalid, or realtime is
            blocked (e.g. by a browser extension).
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                posthog.capture("coop_join_opened", { retry: true });
                retryJoin();
              }}
            >
              Try again
            </button>
            <button type="button" onClick={() => navigate("/")}>
              Back to menu
            </button>
            <button type="button" className={styles.secondaryButton} onClick={copyDebug}>
              Copy debug info
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
