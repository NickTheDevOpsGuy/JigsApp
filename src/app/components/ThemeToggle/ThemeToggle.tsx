// src/app/components/ThemeToggle/ThemeToggle.tsx
import { Palette } from "lucide-react";
import { useTheme, THEME_LABELS } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  /** When true, renders as a full-width menu item (e.g. in hamburger menu) */
  variant?: "default" | "menuItem";
};

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { theme, cycleTheme } = useTheme();

  const className = variant === "menuItem" ? styles.toggleMenuItem : styles.toggle;

  return (
    <button
      className={className}
      onClick={cycleTheme}
      title={`Theme: ${THEME_LABELS[theme]} (tap to change)`}
      aria-label={`Theme: ${THEME_LABELS[theme]}, tap to cycle`}
    >
      <Palette size={variant === "menuItem" ? 18 : 20} />
      {variant === "menuItem" && <span>Theme: {THEME_LABELS[theme]}</span>}
    </button>
  );
}
