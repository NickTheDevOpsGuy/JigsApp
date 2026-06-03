/**
 * App entry point: React root, theme provider, error boundary.
 */
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import { ThemeProvider } from "./hooks/useTheme";
import { ColorBlindProvider } from "./hooks/useColorBlindFriendly";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { loadPlayScreenModule } from "./screens/Play/loadPlayScreen";

// Global styles
import "./styles/global.css";

function onIdle(callback: () => void, timeout: number) {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(callback, { timeout });
    return;
  }
  window.setTimeout(callback, timeout);
}

/** Warm play screen after idle so “Play Today” opens faster without competing with first paint. */
function schedulePlayScreenWarmup() {
  onIdle(() => {
    void loadPlayScreenModule().catch(() => {});
  }, 6000);
}
schedulePlayScreenWarmup();

onIdle(() => {
  void import("./services/player/serverTimeService").then((m) =>
    m.ensureServerTimeResync(),
  );
}, 5000);

onIdle(() => {
  void import("./data/packs/loadPacksData").then((m) => {
    m.preloadPacksData();
    m.preloadPuzzleCatalog();
  });
}, 7000);

onIdle(() => {
  const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  if (typeof posthogKey !== "string" || posthogKey.trim() === "") return;

  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(posthogKey.trim(), {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: "history_change",
      disable_session_recording: true,
      disable_surveys: true,
    });
  });
}, 8000);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root container missing in index.html");
}

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
