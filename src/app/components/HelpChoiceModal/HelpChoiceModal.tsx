import { Modal } from "@/components/Modal/Modal";
import styles from "./HelpChoiceModal.module.css";

type HelpChoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onHowToPlay: () => void;
  onKeyboardShortcuts: () => void;
};

export function HelpChoiceModal({
  isOpen,
  onClose,
  onHowToPlay,
  onKeyboardShortcuts,
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
      </div>
    </Modal>
  );
}
