/**
 * OfflineIndicator – shows a banner when the user loses connection.
 * PWA works offline for cached assets; this helps set expectations for leaderboards, co-op, etc.
 */
import { useState, useEffect } from "react";
import styles from "./OfflineIndicator.module.css";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className={styles.banner}
      role="status"
      aria-live="polite"
      aria-label="You are offline"
    >
      <span className={styles.icon}>📡</span>
      <span>You&apos;re offline. Puzzles work; leaderboards and co-op need internet.</span>
    </div>
  );
}
