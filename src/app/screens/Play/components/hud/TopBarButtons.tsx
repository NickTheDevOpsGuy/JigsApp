/**
 * TopBarButtons – compact top bar: New Puzzle, shortcuts (desktop only).
 */
import { Plus } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "@/screens/Play/styles/PlayScreen.module.css";

interface TopBarButtonsProps {
  showPreview: boolean;
  soundEnabled: boolean;
  isFullscreen: boolean;
  showDebug: boolean;
  isCoarsePointer: boolean;
  onTogglePreview: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onShowShortcuts: () => void;
  onToggleDebug: () => void;
  onNewPuzzle: () => void;
}

/**
 * Compact top bar: New Puzzle only.
 * Other options available via hamburger menu.
 */
export function TopBarButtons({ isCoarsePointer, onNewPuzzle }: TopBarButtonsProps) {
  if (isCoarsePointer) {
    return null;
  }

  return (
    <div className={styles.topBarRight}>
      <Button
        size="sm"
        variant="primary"
        onClick={onNewPuzzle}
        aria-label="Start new puzzle"
        title="Start a new puzzle"
      >
        <Plus size={16} />
        <span className={styles.btnText}>New Puzzle</span>
      </Button>
    </div>
  );
}
