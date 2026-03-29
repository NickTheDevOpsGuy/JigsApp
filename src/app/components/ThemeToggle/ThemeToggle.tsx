/**
 * ThemeToggle – compact theme picker (default) or full-width menu item variant.
 */
import { useState, useRef, useEffect, useId } from "react";
import { Palette, Check, Sun, Moon, Rocket, Waves, TreePine, Sunset } from "lucide-react";
import { useTheme, THEMES, THEME_LABELS, type Theme } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  /** When true, renders as a full-width menu item (e.g. in hamburger menu) */
  variant?: "default" | "menuItem";
  /** Compact control (e.g. menu header icon row) */
  size?: "default" | "compact";
  className?: string;
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

export function ThemeToggle({
  variant = "default",
  size = "default",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  /* Close on outside tap/click (pointer* works for touch + mouse) and Escape (desktop / keyboard). */
  useEffect(() => {
    if (!isOpen) return;

    const close = () => setIsOpen(false);

    const onPointerDownOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        queueMicrotask(() => toggleRef.current?.focus());
      }
    };

    document.addEventListener("pointerdown", onPointerDownOutside, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownOutside, true);
      document.removeEventListener("keydown", onKeyDown);
    };
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
              type="button"
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

  const paletteSize = size === "compact" ? 18 : 20;

  return (
    <div
      className={[styles.container, size === "compact" ? styles.compact : "", className]
        .filter(Boolean)
        .join(" ")}
      ref={menuRef}
    >
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${THEME_LABELS[theme]}`}
        aria-label={`Theme: ${THEME_LABELS[theme]}, click to change`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={listId}
      >
        <Palette size={paletteSize} aria-hidden />
      </button>

      {isOpen && (
        <div className={styles.dropdown} id={listId} role="menu" aria-label="Choose theme">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              role="menuitem"
              className={`${styles.dropdownItem} ${theme === t ? styles.dropdownItemActive : ""}`}
              onClick={() => handleSelect(t)}
              title={THEME_LABELS[t]}
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
