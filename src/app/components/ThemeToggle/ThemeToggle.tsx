// src/app/components/ThemeToggle/ThemeToggle.tsx
import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";
import {
  useTheme,
  THEMES,
  THEME_LABELS,
  THEME_EMOJIS,
  type Theme,
} from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  variant?: "default" | "menuItem" | "card";
};

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (variant === "card") {
    return (
      <div className={styles.cardContainer} ref={menuRef}>
        <button
          type="button"
          className={styles.cardToggle}
          onClick={() => setIsOpen(!isOpen)}
          title={`Theme: ${THEME_LABELS[theme]}`}
          aria-label={`Theme: ${THEME_LABELS[theme]}, click to change`}
          aria-expanded={isOpen}
        >
          <Palette size={20} />
          <span className={styles.toggleLabel}>Theme</span>
          <span className={styles.toggleEmoji}>{THEME_EMOJIS[theme]}</span>
        </button>
        {isOpen && (
          <div className={styles.cardDropdown}>
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.dropdownItem} ${theme === t ? styles.dropdownItemActive : ""}`}
                onClick={() => handleSelect(t)}
              >
                <span className={styles.themeEmoji}>{THEME_EMOJIS[t]}</span>
                <span>{THEME_LABELS[t]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

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
              aria-label={THEME_LABELS[t]}
            >
              {THEME_EMOJIS[t]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${THEME_LABELS[theme]}`}
        aria-label={`Theme: ${THEME_LABELS[theme]}, click to change`}
        aria-expanded={isOpen}
      >
        <span className={styles.toggleEmoji}>{THEME_EMOJIS[theme]}</span>
        <span className={styles.toggleLabel}>Theme</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.dropdownItem} ${theme === t ? styles.dropdownItemActive : ""}`}
              onClick={() => handleSelect(t)}
            >
              <span className={styles.themeEmoji}>{THEME_EMOJIS[t]}</span>
              <span>{THEME_LABELS[t]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
