import React from "react";
import ReactDOM from "react-dom/client";

import { initPostHog } from "./analytics/posthog";
import { App } from "./App";
import { ThemeProvider } from "./hooks/useTheme";

// Global styles
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root container missing in index.html");
}

initPostHog();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
