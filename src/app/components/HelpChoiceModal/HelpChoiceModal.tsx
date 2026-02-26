/**
 * HelpChoiceModal – help menu: How to Play, Shortcuts, About, Settings, Theme.
 */
import { Modal } from "@/components/Modal/Modal";
import styles from "./HelpChoiceModal.module.css";

type HelpChoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onHowToPlay: () => void;
  onKeyboardShortcuts: () => void;
  onShowAbout?: () => void;
  onOpenTheme?: () => void;
};

export function HelpChoiceModal({
  isOpen,
  onClose,
  onHowToPlay,
  onKeyboardShortcuts,
  onShowAbout,
  onOpenTheme,
}: HelpChoiceModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help" showCloseButton={true}>
      <div className={styles.helpChoice}>
        <button
          type="button"
          className={styles.helpChoiceBtn}
          onClick={() => {
            onClose();
            onHowToPlay();
          }}
          aria-label="How to Play"
        >
          📖 How to Play
        </button>
        <button
          type="button"
          className={styles.helpChoiceBtn}
          onClick={() => {
            onClose();
            onKeyboardShortcuts();
          }}
          aria-label="Keyboard and Controls"
        >
          ⌨️ Keyboard & Controls
        </button>
        {onShowAbout && (
          <button
            type="button"
            className={styles.helpChoiceBtn}
            onClick={() => {
              onClose();
              onShowAbout();
            }}
            aria-label="About"
          >
            ℹ️ About
          </button>
        )}
        {onOpenTheme && (
          <button
            type="button"
            className={styles.helpChoiceBtn}
            onClick={() => {
              onClose();
              onOpenTheme();
            }}
            aria-label="Theme"
          >
            🎨 Theme
          </button>
        )}
      </div>
    </Modal>
  );
}
