import { Modal } from "@/components/Modal/Modal";
import { useTheme, THEMES, THEME_LABELS, type Theme } from "@/hooks/useTheme";
import { Sun, Moon, Rocket, Waves, TreePine, Sunset, Check } from "lucide-react";
import styles from "./ThemeModal.module.css";

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun size={20} />,
  dark: <Moon size={20} />,
  space: <Rocket size={20} />,
  ocean: <Waves size={20} />,
  forest: <TreePine size={20} />,
  sunset: <Sunset size={20} />,
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
};

export function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { theme, setTheme } = useTheme();

  const handleSelect = (t: Theme) => {
    setTheme(t);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Theme" showCloseButton={true}>
      <div className={styles.options}>
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.option} ${theme === t ? styles.optionActive : ""}`}
            onClick={() => handleSelect(t)}
          >
            <span className={styles.optionIcon} style={{ color: THEME_COLORS[t] }}>
              {THEME_ICONS[t]}
            </span>
            <span>{THEME_LABELS[t]}</span>
            {theme === t && <Check size={18} className={styles.checkIcon} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
