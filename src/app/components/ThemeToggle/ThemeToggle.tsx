// src/app/components/ThemeToggle/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  /** When true, renders as a full-width menu item (e.g. in hamburger menu) */
  variant?: "default" | "menuItem";
};

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const className = variant === "menuItem" ? styles.toggleMenuItem : styles.toggle;

  return (
    <button
      className={className}
      onClick={toggleTheme}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon size={variant === "menuItem" ? 18 : 20} />
      ) : (
        <Sun size={variant === "menuItem" ? 18 : 20} />
      )}
      {variant === "menuItem" && (
        <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
      )}
    </button>
  );
}
