import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { MenuScreen } from "@/screens/Menu/MenuScreen";
import { NewGameScreen } from "@/screens/NewGame/NewGameScreen";
import { PlayScreen } from "@/screens/Play/PlayScreen";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main menu */}
        <Route path="/" element={<MenuScreen />} />

        {/* New game / setup */}
        <Route path="/new" element={<NewGameScreen />} />

        {/* Active puzzle */}
        <Route path="/play" element={<PlayScreen />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
