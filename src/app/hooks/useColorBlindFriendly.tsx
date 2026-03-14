/**
 * useColorBlindFriendly – global preference for color-blind-friendly palette.
 * When enabled, progress/done/error colors use blue-based alternatives so
 * red–green is not the only differentiator. Applies to all screens.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

const STORAGE_KEY = "phuzzle-colorblind-friendly";
const CLASS_NAME = "colorblind-friendly";

function getStored(): boolean {
  if (typeof window === "undefined") return false;
  const v = safeLocalStorage.getItem(STORAGE_KEY);
  return v === "true";
}

function applyClass(enabled: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (enabled) {
    root.classList.add(CLASS_NAME);
  } else {
    root.classList.remove(CLASS_NAME);
  }
}

type ColorBlindContextType = {
  colorblindFriendly: boolean;
  setColorblindFriendly: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleColorblindFriendly: () => void;
};

const ColorBlindContext = createContext<ColorBlindContextType | undefined>(undefined);

export function ColorBlindProvider({ children }: { children: ReactNode }) {
  const [colorblindFriendly, setState] = useState(getStored);

  useLayoutEffect(() => {
    applyClass(colorblindFriendly);
  }, [colorblindFriendly]);

  const setColorblindFriendly = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        safeLocalStorage.setItem(STORAGE_KEY, next ? "true" : "false");
        return next;
      });
    },
    [],
  );

  const toggleColorblindFriendly = useCallback(() => {
    setState((prev) => {
      const next = !prev;
      safeLocalStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      return next;
    });
  }, []);

  return (
    <ColorBlindContext.Provider
      value={{
        colorblindFriendly,
        setColorblindFriendly,
        toggleColorblindFriendly,
      }}
    >
      {children}
    </ColorBlindContext.Provider>
  );
}

export function useColorBlindFriendly(): ColorBlindContextType {
  const ctx = useContext(ColorBlindContext);
  if (ctx === undefined) {
    throw new Error("useColorBlindFriendly must be used within ColorBlindProvider");
  }
  return ctx;
}
