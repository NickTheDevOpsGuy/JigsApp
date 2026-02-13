import { Modal } from "@/components/Modal/Modal";
import styles from "./AboutModal.module.css";

const GITHUB_REPO_URL = "https://github.com/NickTheDevOpsGuy/phuzzle";
const GITHUB_CONTRIBUTORS_URL =
  "https://github.com/NickTheDevOpsGuy/phuzzle/blob/develop/CONTRIBUTORS.md";

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const openRepo = () => {
    window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer");
    onClose();
  };

  const openContributors = () => {
    window.open(GITHUB_CONTRIBUTORS_URL, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About" showCloseButton>
      <div className={styles.aboutChoice}>
        <button type="button" className={styles.aboutChoiceBtn} onClick={openRepo}>
          Repo
        </button>
        <button
          type="button"
          className={styles.aboutChoiceBtn}
          onClick={openContributors}
        >
          Contributors
        </button>
      </div>
    </Modal>
  );
}
