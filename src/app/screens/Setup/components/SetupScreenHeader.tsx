import React from "react";
import { Puzzle } from "lucide-react";
import { SetupStepIndicator } from "./SetupStepIndicator";

export function SetupScreenHeader(props: {
  styles: Record<string, string>;
  isPackFlow: boolean;
  selectedPuzzleName?: string;
  hasImage: boolean;
  onClose: () => void;
}) {
  const { styles, isPackFlow, selectedPuzzleName, hasImage } = props;
  return (
    <div className={styles.headerRow}>
      <h1 className={`${styles.title} ${isPackFlow ? styles.titlePackFlow : ""}`}>
        {!isPackFlow && (
          <span className={styles.titleIcon} aria-hidden>
            <Puzzle size={28} />
          </span>
        )}
        <span>
          {isPackFlow && selectedPuzzleName ? selectedPuzzleName : "New Puzzle"}
        </span>
      </h1>
      <SetupStepIndicator styles={styles} isPackFlow={isPackFlow} hasImage={hasImage} />
    </div>
  );
}
