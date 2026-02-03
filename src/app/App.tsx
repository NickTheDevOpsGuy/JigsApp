// src/app/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { MenuScreen } from "@/screens/Menu/MenuScreen";
import { NewGameScreen } from "@/screens/NewGame/NewGameScreen";
import { PlayScreen } from "@/screens/Play/PlayScreen";
import { StatsScreen } from "@/screens/Stats/StatsScreen";
import { ensureSignedIn } from "@/supabase/auth";

export function App() {
  useEffect(() => {
    ensureSignedIn();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/new" element={<NewGameScreen />} />
        <Route path="/play" element={<PlayScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
