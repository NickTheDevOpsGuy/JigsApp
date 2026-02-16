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
  onOpenSettings?: () => void;
  onOpenTheme?: () => void;
};

export function HelpChoiceModal({
  isOpen,
  onClose,
  onHowToPlay,
  onKeyboardShortcuts,
  onShowAbout,
  onOpenSettings,
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
        >
          How to Play
        </button>
        <button
          type="button"
          className={styles.helpChoiceBtn}
          onClick={() => {
            onClose();
            onKeyboardShortcuts();
          }}
        >
          Keyboard & Controls
        </button>
        {onShowAbout && (
          <button
            type="button"
            className={styles.helpChoiceBtn}
            onClick={() => {
              onClose();
              onShowAbout();
            }}
          >
            About
          </button>
        )}
        {onOpenSettings && (
          <button
            type="button"
            className={styles.helpChoiceBtn}
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
          >
            Settings
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
          >
            Theme
          </button>
        )}
      </div>
    </Modal>
  );
}
