// src/app/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { MenuScreen } from "@/screens/Menu/MenuScreen";
import { NewGameScreen } from "@/screens/NewGame/NewGameScreen";
import { PlayScreen } from "@/screens/Play/PlayScreen";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/new" element={<NewGameScreen />} />
        <Route path="/play" element={<PlayScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
