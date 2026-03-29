/**
 * App entry point: React root, PostHog init, theme provider, error boundary.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import posthog from "posthog-js";

import { App } from "./App";
import { ensureServerTimeResync } from "./services/player/serverTimeService";
import { ThemeProvider } from "./hooks/useTheme";
import { ColorBlindProvider } from "./hooks/useColorBlindFriendly";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { preloadPacksData, preloadPuzzleCatalog } from "./data/packs/loadPacksData";
import { loadMenuScreenModule } from "./screens/routeLoaders";
import { loadPlayScreenModule } from "./screens/Play/loadPlayScreen";

// Global styles
import "./styles/global.css";

/**
 * Start heavy chunks before React mounts so first route + home data race with the main bundle.
 * (Calls are idempotent with the same loaders used from React.lazy / App.)
 */
preloadPacksData();
preloadPuzzleCatalog();
void loadMenuScreenModule();
void import("./daily/dailyPuzzle").catch(() => {});

/** Warm play screen after idle so “Play Today” opens faster without competing with first paint. */
function schedulePlayScreenWarmup() {
  const run = () => {
    void loadPlayScreenModule().catch(() => {});
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    window.setTimeout(run, 2500);
  }
}
schedulePlayScreenWarmup();

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
if (typeof posthogKey === "string" && posthogKey.trim() !== "") {
  posthog.init(posthogKey.trim(), {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root container missing in index.html");
}

ensureServerTimeResync();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ColorBlindProvider>
          <App />
        </ColorBlindProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
