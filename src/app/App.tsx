/**
 * App – router, lazy-loaded screens, auth gate for protected routes.
 */
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { initStreakFreeze } from "@/daily/dailyPuzzleCore";
import { ensureSignedIn } from "@/supabase/auth";

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
        minHeight: "100vh",
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

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<MenuScreen />} />
          <Route path="/new" element={<NewGameScreen />} />
          <Route path="/play" element={<PlayScreen />} />
          <Route path="/stats" element={<StatsScreen />} />
          <Route path="/packs" element={<PackListScreen />} />
          <Route path="/packs/:packId" element={<PackDetailScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
