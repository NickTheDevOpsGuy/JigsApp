/**
 * ThemeToggle – compact theme picker (default) or full-width menu item variant.
 */
import { useState, useRef, useEffect } from "react";
import { Palette, Check, Sun, Moon, Rocket, Waves, TreePine, Sunset } from "lucide-react";
import { useTheme, THEMES, THEME_LABELS, type Theme } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  /** When true, renders as a full-width menu item (e.g. in hamburger menu) */
  variant?: "default" | "menuItem";
};

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
  space: <Rocket size={16} />,
  ocean: <Waves size={16} />,
  forest: <TreePine size={16} />,
  sunset: <Sunset size={16} />,
};

const THEME_COLORS: Record<Theme, string> = {
  light: "#f59e0b", // sun yellow
  dark: "#6366f1", // indigo moon
  space: "#a78bfa", // purple
  ocean: "#3b82f6", // blue
  forest: "#22c55e", // green
  sunset: "#f97316", // orange
};

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (t: Theme) => {
    setTheme(t);
    setIsOpen(false);
  };

  if (variant === "menuItem") {
    return (
      <div className={styles.menuItemContainer}>
        <div className={styles.menuItemLabel}>
          <Palette size={18} />
          <span>Theme</span>
        </div>
        <div className={styles.themeOptions}>
          {THEMES.map((t) => (
            <button
              key={t}
              className={`${styles.themeOption} ${theme === t ? styles.themeOptionActive : ""}`}
              onClick={() => setTheme(t)}
              title={THEME_LABELS[t]}
              style={{ color: THEME_COLORS[t] }}
            >
              {THEME_ICONS[t]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        className={styles.toggle}
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${THEME_LABELS[theme]}`}
        aria-label={`Theme: ${THEME_LABELS[theme]}, click to change`}
        aria-expanded={isOpen}
      >
        <Palette size={20} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {THEMES.map((t) => (
            <button
              key={t}
              className={`${styles.dropdownItem} ${theme === t ? styles.dropdownItemActive : ""}`}
              onClick={() => handleSelect(t)}
            >
              <span className={styles.themeIcon} style={{ color: THEME_COLORS[t] }}>
                {THEME_ICONS[t]}
              </span>
              <span>{THEME_LABELS[t]}</span>
              {theme === t && <Check size={16} className={styles.checkIcon} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
