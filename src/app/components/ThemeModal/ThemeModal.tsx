/**
 * ThemeModal – theme picker (light, dark, space, ocean, forest, sunset).
 */
import { useEffect, useRef } from "react";
import { Modal } from "@/components/Modal/Modal";
import { useTheme, THEMES, THEME_LABELS, type Theme } from "@/hooks/useTheme";
import { Check } from "lucide-react";
import styles from "./ThemeModal.module.css";

const THEME_EMOJIS: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  space: "🚀",
  ocean: "🌊",
  forest: "🌲",
  sunset: "🌅",
};

const THEME_COLORS: Record<Theme, string> = {
  light: "#f59e0b",
  dark: "#6366f1",
  space: "#a78bfa",
  ocean: "#3b82f6",
  forest: "#22c55e",
  sunset: "#f97316",
};

type ThemeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  hapticsEnabled?: boolean;
};

export function ThemeModal({ isOpen, onClose, hapticsEnabled = false }: ThemeModalProps) {
  const { theme, setTheme } = useTheme();
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleSelect = (t: Theme) => {
    setTheme(t);
    if (hapticsEnabled && typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(10);
    // Keep modal open so users can try multiple themes before closing
  };

  useEffect(() => {
    if (isOpen && theme && optionRefs.current[theme]) {
      optionRefs.current[theme]?.focus();
    }
  }, [isOpen, theme]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Theme" showCloseButton={true}>
      <div className={styles.options}>
        {THEMES.map((t) => (
          <button
            key={t}
            ref={(el) => {
              optionRefs.current[t] = el;
            }}
            type="button"
            className={`${styles.option} ${theme === t ? styles.optionActive : ""}`}
            onClick={() => handleSelect(t)}
            aria-label={`${THEME_LABELS[t]}${theme === t ? ", selected" : ""}`}
          >
            <span className={styles.optionIcon} style={{ color: THEME_COLORS[t] }}>
              {THEME_EMOJIS[t]}
            </span>
            <span>{THEME_LABELS[t]}</span>
            {theme === t && <Check size={18} className={styles.checkIcon} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
