import React from "react";
import { Puzzle, X } from "lucide-react";

export function SetupScreenHeader(props: {
  styles: Record<string, string>;
  isPackFlow: boolean;
  selectedPuzzleName?: string;
  onClose: () => void;
}) {
  const { styles, isPackFlow, selectedPuzzleName, onClose } = props;
  return (
    <div className={styles.headerRow}>
      <h1 className={`${styles.title} ${isPackFlow ? styles.titlePackFlow : ""}`}>
        {!isPackFlow && (
          <span className={styles.titleIcon} aria-hidden>
            <Puzzle size={28} />
          </span>
        )}
        <span>{isPackFlow && selectedPuzzleName ? selectedPuzzleName : "New Puzzle"}</span>
      </h1>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label={isPackFlow ? "Close puzzle setup" : "Close new puzzle"}
        title={isPackFlow ? "Close and return to pack" : "Close and return to menu"}
      >
        <X size={26} />
      </button>
    </div>
  );
}
