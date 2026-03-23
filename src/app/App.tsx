/**
 * App – router, lazy-loaded screens, auth gate for protected routes.
 */
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { initStreakFreeze } from "@/daily/dailyPuzzleCore";
import { ensureSignedIn } from "@/supabase/auth";
import { OfflineIndicator } from "@/components/OfflineIndicator/OfflineIndicator";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { loadPlayScreenModule } from "@/screens/Play/loadPlayScreen";
import {
  loadMenuScreenModule,
  loadPackDetailScreenModule,
  loadPackListScreenModule,
  loadStatsScreenModule,
} from "@/screens/routeLoaders";
import styles from "./App.module.css";

// Route-level code splitting: load screens on demand to keep initial chunk smaller
const MenuScreen = lazy(() =>
  loadMenuScreenModule().then((m) => ({ default: m.MenuScreen })),
);
const PlayScreen = lazy(() =>
  loadPlayScreenModule().then((m) => ({ default: m.PlayScreen })),
);
const StatsScreen = lazy(() =>
  loadStatsScreenModule().then((m) => ({
    default: m.StatsScreen,
  })),
);
const PackListScreen = lazy(() =>
  loadPackListScreenModule().then((m) => ({
    default: m.PackListScreen,
  })),
);
const PackDetailScreen = lazy(() =>
  loadPackDetailScreenModule().then((m) => ({
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
        height: "var(--app-vh-stable, 100dvh)",
        minHeight: "var(--app-vh-stable, 100dvh)",
        maxHeight: "100dvh",
        overflow: "hidden",
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    let minViewportHeight = Number.POSITIVE_INFINITY;
    let rafId = 0;
    let resetOnNextApply = false;

    const applyViewportHeightVars = (forceReset = false) => {
      const vvHeight = window.visualViewport?.height ?? window.innerHeight;
      const dynamicPx = Math.max(1, Math.round(vvHeight));
      const stableCandidate = Math.max(
        1,
        Math.round(Math.min(window.innerHeight, vvHeight)),
      );

      if (forceReset || !Number.isFinite(minViewportHeight)) {
        minViewportHeight = stableCandidate;
      } else {
        minViewportHeight = Math.min(minViewportHeight, stableCandidate);
      }

      root.style.setProperty("--app-vh-dynamic", `${dynamicPx}px`);
      root.style.setProperty("--app-vh-stable", `${minViewportHeight}px`);
    };

    const scheduleApply = (forceReset = false) => {
      if (forceReset) resetOnNextApply = true;
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const shouldReset = resetOnNextApply;
        resetOnNextApply = false;
        applyViewportHeightVars(shouldReset);
      });
    };

    applyViewportHeightVars(true);

    const onResize = () => scheduleApply(false);
    const onOrientationChange = () => scheduleApply(true);
    const vv = window.visualViewport ?? null;

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onOrientationChange, { passive: true });
    vv?.addEventListener("resize", onResize, { passive: true });
    vv?.addEventListener("scroll", onResize, { passive: true });

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientationChange);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const warmCommonRoutes = () => {
      void loadPlayScreenModule();
      void loadStatsScreenModule();
      void loadPackListScreenModule();
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(
        () => {
          warmCommonRoutes();
        },
        { timeout: 1200 },
      );
      return () => {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(warmCommonRoutes, 350);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const allowContextMenuTarget = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return Boolean(
        el.closest(
          'input, textarea, select, [contenteditable="true"], [data-allow-context-menu="true"]',
        ),
      );
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (allowContextMenuTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const handleDragStart = (event: DragEvent) => {
      if (allowContextMenuTarget(event.target)) return;
      event.preventDefault();
    };

    const handleSelectStart = (event: Event) => {
      if (allowContextMenuTarget(event.target)) return;
      event.preventDefault();
    };

    /* Prevent long-press context menu on Android/iOS; use capture so we run before any child. */
    document.addEventListener("contextmenu", handleContextMenu, {
      capture: true,
      passive: false,
    });
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("selectstart", handleSelectStart, true);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("selectstart", handleSelectStart, true);
    };
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
            <Route path="/new" element={<Navigate to="/" replace />} />
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
