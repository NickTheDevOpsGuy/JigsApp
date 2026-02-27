/**
 * App – router, lazy-loaded screens, auth gate for protected routes.
 */
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { initStreakFreeze } from "@/daily/dailyPuzzleCore";
import { ensureSignedIn } from "@/supabase/auth";
import { OfflineIndicator } from "@/components/OfflineIndicator/OfflineIndicator";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import styles from "./App.module.css";

// Route-level code splitting: load screens on demand to keep initial chunk smaller
const MenuScreen = lazy(() =>
  import("@/screens/Menu/MenuScreen").then((m) => ({ default: m.MenuScreen })),
);
const NewGameScreen = lazy(() =>
  import("@/screens/NewGame/NewGameScreen").then((m) => ({
    default: m.NewGameScreen,
  })),
);
const PlayScreen = lazy(() =>
  import("@/screens/Play/PlayScreen").then((m) => ({ default: m.PlayScreen })),
);
const StatsScreen = lazy(() =>
  import("@/screens/Stats/StatsScreen").then((m) => ({
    default: m.StatsScreen,
  })),
);
const PackListScreen = lazy(() =>
  import("@/screens/Packs/PackListScreen").then((m) => ({
    default: m.PackListScreen,
  })),
);
const PackDetailScreen = lazy(() =>
  import("@/screens/Packs/PackDetailScreen").then((m) => ({
    default: m.PackDetailScreen,
  })),
);

function PageFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      Loading…
    </div>
  );
}

export function App() {
  useEffect(() => {
    ensureSignedIn();
    initStreakFreeze();
  }, []);

  const focusMain = () => {
    requestAnimationFrame(() => {
      document.getElementById("main")?.focus();
    });
  };

  return (
    <BrowserRouter>
      <a href="#main" className={styles.skipLink} onClick={focusMain}>
        Skip to main content
      </a>
      <OfflineIndicator />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <MenuScreen />
                </ErrorBoundary>
              }
            />
            <Route
              path="/new"
              element={
                <ErrorBoundary>
                  <NewGameScreen />
                </ErrorBoundary>
              }
            />
            <Route
              path="/play"
              element={
                <ErrorBoundary>
                  <PlayScreen />
                </ErrorBoundary>
              }
            />
            <Route
              path="/stats"
              element={
                <ErrorBoundary>
                  <StatsScreen />
                </ErrorBoundary>
              }
            />
            <Route
              path="/packs"
              element={
                <ErrorBoundary>
                  <PackListScreen />
                </ErrorBoundary>
              }
            />
            <Route
              path="/packs/:packId"
              element={
                <ErrorBoundary>
                  <PackDetailScreen />
                </ErrorBoundary>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}
