/**
 * useTheme – theme context, persisted in localStorage; ThemeProvider wraps app.
 */
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  ReactNode,
} from "react";

export type Theme = "light" | "dark" | "space" | "ocean" | "forest" | "sunset";

export const THEMES: Theme[] = ["light", "dark", "space", "ocean", "forest", "sunset"];

export const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  space: "Space",
  ocean: "Ocean",
  forest: "Forest",
  sunset: "Sunset",
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "phuzzle-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.includes(stored as Theme)) return stored as Theme;
  } catch {
    // localStorage might not be available
  }
  return "light";
}

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  // Remove all theme classes first
  THEMES.forEach((t) => {
    document.documentElement.classList.remove(`theme-${t}`);
  });
  // Add the current theme class
  document.documentElement.classList.add(`theme-${theme}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  // Apply theme immediately (before paint) and persist
  useLayoutEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage might not be available
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const cycleTheme = () => {
    setThemeState((currentTheme) => {
      const i = THEMES.indexOf(currentTheme);
      return THEMES[(i + 1) % THEMES.length];
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        cycleTheme,
        isDark: ["dark", "space", "ocean", "forest", "sunset"].includes(theme),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
