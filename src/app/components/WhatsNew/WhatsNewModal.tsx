/**
 * WhatsNewModal – changelog/release notes, marks as seen on close.
 * Shows at most MAX_FEATURES items to keep the screen short.
 */
import { Modal } from "@/components/Modal/Modal";
import { CHANGELOG_ENTRIES, markChangelogSeen } from "@/data/content/changelog";
import styles from "./WhatsNewModal.module.css";

const MAX_FEATURES = 2;

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
      variant="compact"
    >
      <div
        className={styles.content}
        tabIndex={0}
        role="region"
        aria-label="What's new in this release"
      >
        {CHANGELOG_ENTRIES.map((section, i) => (
          <div key={i} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <ul className={styles.list}>
              {section.items.slice(0, MAX_FEATURES).map((item, j) => (
                <li key={j} className={styles.item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
