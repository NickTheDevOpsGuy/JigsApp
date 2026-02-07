import { useState, useRef, useEffect } from "react";
import { HelpCircle, BookOpen, Keyboard } from "lucide-react";
import styles from "./HelpMenu.module.css";

type HelpMenuProps = {
  onShowHowToPlay: () => void;
  onShowShortcuts: () => void;
  variant?: "card" | "default";
  className?: string;
};

export function HelpMenu({
  onShowHowToPlay,
  onShowShortcuts,
  variant = "default",
  className = "",
}: HelpMenuProps) {
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

  const handleHowToPlay = () => {
    onShowHowToPlay();
    setIsOpen(false);
  };

  const handleShortcuts = () => {
    onShowShortcuts();
    setIsOpen(false);
  };

  if (variant === "card") {
    return (
      <div className={`${styles.cardContainer} ${className}`} ref={menuRef}>
        <button
          type="button"
          className={styles.cardToggle}
          onClick={() => setIsOpen(!isOpen)}
          title="Help"
          aria-label="Help – How to Play & Keyboard shortcuts"
          aria-expanded={isOpen}
        >
          <HelpCircle size={20} />
          <span className={styles.toggleLabel}>Help</span>
        </button>
        {isOpen && (
          <div className={styles.cardDropdown}>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={handleHowToPlay}
            >
              <BookOpen size={18} />
              <span>How to Play</span>
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={handleShortcuts}
            >
              <Keyboard size={18} />
              <span>Keyboard shortcuts</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} ref={menuRef}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen(!isOpen)}
        title="Help"
        aria-label="Help"
        aria-expanded={isOpen}
      >
        <HelpCircle size={18} />
        <span className={styles.toggleLabel}>Help</span>
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          <button type="button" className={styles.dropdownItem} onClick={handleHowToPlay}>
            <BookOpen size={18} />
            <span>How to Play</span>
          </button>
          <button type="button" className={styles.dropdownItem} onClick={handleShortcuts}>
            <Keyboard size={18} />
            <span>Keyboard shortcuts</span>
          </button>
        </div>
      )}
    </div>
  );
}
