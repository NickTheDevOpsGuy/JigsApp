/**
 * AdvancedModal – menu options: Clear Cache, Reset Local Stats.
 * Callers provide confirm handlers; this modal just lists the actions.
 */
import { Modal } from "@/components/Modal/Modal";
import styles from "./AdvancedModal.module.css";

type AdvancedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onClearCache: () => void;
  onResetStats: () => void;
};

export function AdvancedModal({
  isOpen,
  onClose,
  onClearCache,
  onResetStats,
}: AdvancedModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced" showCloseButton>
      <div className={styles.advancedChoice}>
        <button
          type="button"
          className={styles.advancedChoiceBtn}
          onClick={() => {
            onClose();
            onClearCache();
          }}
          aria-label="Clear cache"
          title="Clear cache"
        >
          Clear Cache
        </button>
        <p className={styles.advancedChoiceHint}>
          Clear cached puzzle images and saved game state.
        </p>
        <button
          type="button"
          className={styles.advancedChoiceBtn}
          onClick={() => {
            onClose();
            onResetStats();
          }}
          aria-label="Reset local stats"
          title="Reset local stats"
        >
          Reset Local Stats
        </button>
        <p className={styles.advancedChoiceHint}>
          Clear all local best times. This cannot be undone.
        </p>
      </div>
    </Modal>
  );
}
