/**
 * Completion overlay actions: dropdown (Continue, Play again, Back to home) + Share side-by-side.
 * Share button is delayed for pacing (reveal stats first).
 */
import { useState, useRef, useEffect } from "react";
import { Play, Share2, Home, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

const SHARE_BUTTON_DELAY_MS = 900;

interface CompletionOverlayActionsProps {
  onClose: () => void;
  onPlayAgain?: () => void;
  onGoHome?: () => void;
  onShareClick: () => void;
  isNarrow: boolean;
}

type MenuAction = "continue" | "playAgain" | "goHome";

function getLabel(action: MenuAction, isNarrow: boolean): string {
  switch (action) {
    case "continue":
      return "Continue";
    case "playAgain":
      return "Play again";
    case "goHome":
      return isNarrow ? "Home" : "Back to home";
    default:
      return "";
  }
}

export function CompletionOverlayActions({
  onClose,
  onPlayAgain,
  onGoHome,
  onShareClick,
  isNarrow,
}: CompletionOverlayActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shareRevealed, setShareRevealed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShareRevealed(true), SHARE_BUTTON_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [dropdownOpen]);

  const actions: { id: MenuAction; onClick: () => void; icon: React.ReactNode }[] = [
    { id: "continue", onClick: onClose, icon: <Play size={18} /> },
    ...(onPlayAgain != null
      ? [
          {
            id: "playAgain" as const,
            onClick: onPlayAgain,
            icon: <RotateCcw size={18} />,
          },
        ]
      : []),
    ...(onGoHome != null
      ? [{ id: "goHome" as const, onClick: onGoHome, icon: <Home size={18} /> }]
      : []),
  ];

  const handleAction = (onClick: () => void) => {
    onClick();
    setDropdownOpen(false);
  };

  return (
    <div className={styles.completeActions}>
      <div className={styles.completeActionsDropdownWrap} ref={dropdownRef}>
        <Button
          variant="primary"
          onClick={() => setDropdownOpen((o) => !o)}
          className={styles.completeActionsTrigger}
          aria-label="Continue and more options"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          <Play size={20} />
          <span>Continue</span>
          <ChevronDown size={18} className={styles.completeActionsChevron} aria-hidden />
        </Button>
        {dropdownOpen && (
          <div className={styles.completeActionsDropdown} role="menu">
            {actions.map(({ id, onClick, icon }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={styles.completeActionsDropdownItem}
                onClick={() => handleAction(onClick)}
                aria-label={getLabel(id, isNarrow)}
              >
                {icon}
                {getLabel(id, isNarrow)}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        variant="secondary"
        onClick={onShareClick}
        className={styles.completeActionsShareBtn}
        aria-label="Share Result"
        style={{
          opacity: shareRevealed ? 1 : 0,
          pointerEvents: shareRevealed ? "auto" : "none",
          transition: "opacity 0.25s ease-out",
        }}
      >
        <Share2 size={20} />
        {isNarrow ? "Share" : "Share Result"}
      </Button>
    </div>
  );
}
