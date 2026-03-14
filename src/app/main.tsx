/**
 * App entry point: React root, PostHog init, theme provider, error boundary.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import posthog from "posthog-js";

import { App } from "./App";
import { ThemeProvider } from "./hooks/useTheme";
import { ColorBlindProvider } from "./hooks/useColorBlindFriendly";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Global styles
import "./styles/global.css";

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
