import { useState, useRef, useEffect } from "react";
import { HelpCircle, BookOpen, Keyboard } from "lucide-react";
import styles from "./HelpMenu.module.css";

type HelpMenuProps = {
  onShowHowToPlay: () => void;
  onShowShortcuts: () => void;
  variant?: "card" | "default";
  className?: string;
};

const HELP_ITEMS = [
  { id: "howto", icon: BookOpen, label: "How to Play" },
  { id: "shortcuts", icon: Keyboard, label: "Keyboard shortcuts" },
] as const;

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handlers = [onShowHowToPlay, onShowShortcuts] as const;
  const isCard = variant === "card";
  const containerClass = isCard ? styles.cardContainer : styles.container;
  const toggleClass = isCard ? styles.cardToggle : styles.toggle;
  const dropdownClass = isCard ? styles.cardDropdown : styles.dropdown;
  const iconSize = isCard ? 20 : 18;

  return (
    <div className={`${containerClass} ${className}`.trim()} ref={menuRef}>
      <button
        type="button"
        className={toggleClass}
        onClick={() => setIsOpen(!isOpen)}
        title="Help"
        aria-label={isCard ? "Help – How to Play & Keyboard shortcuts" : "Help"}
        aria-expanded={isOpen}
      >
        <HelpCircle size={iconSize} />
        <span className={styles.toggleLabel}>Help</span>
      </button>
      {isOpen && (
        <div className={dropdownClass}>
          {HELP_ITEMS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={styles.dropdownItem}
              onClick={() => {
                handlers[i]();
                setIsOpen(false);
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
