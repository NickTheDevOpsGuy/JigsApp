// src/app/providers.tsx

import { createContext, useContext, useMemo, type ReactNode } from 'react';

type GameContextValue = {};
const GameContext = createContext<GameContextValue>({});

export function GameProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({}), []);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
