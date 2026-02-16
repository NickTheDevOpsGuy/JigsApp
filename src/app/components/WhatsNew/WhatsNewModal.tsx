/**
 * WhatsNewModal – changelog/release notes, marks as seen on close.
 */
import { Modal } from "@/components/Modal/Modal";
import { Button } from "@/components/Button/Button";
import { CHANGELOG_ENTRIES, markChangelogSeen } from "@/data/changelog";
import styles from "./WhatsNewModal.module.css";

type WhatsNewModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const handleClose = () => {
    markChangelogSeen();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="What's New"
      showCloseButton={true}
    >
      <div className={styles.content}>
        {CHANGELOG_ENTRIES.map((section, i) => (
          <div key={i} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <ul className={styles.list}>
              {section.items.map((item, j) => (
                <li key={j} className={styles.item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleClose} fullWidth>
            Got it!
          </Button>
        </div>
      </div>
    </Modal>
  );
}
