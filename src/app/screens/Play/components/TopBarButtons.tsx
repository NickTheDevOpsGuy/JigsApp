import React from "react";
import {
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Keyboard,
  Maximize,
  Minimize,
  Bug,
  Plus,
} from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

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
 * Desktop-only toolbar buttons.
 * On mobile (coarse pointer), all options go in the hamburger menu instead.
 */
export function TopBarButtons({
  showPreview,
  soundEnabled,
  isFullscreen,
  showDebug,
  isCoarsePointer,
  onTogglePreview,
  onToggleSound,
  onToggleFullscreen,
  onShowShortcuts,
  onToggleDebug,
  onNewPuzzle,
}: TopBarButtonsProps) {
  // On mobile, don't show any buttons - everything is in hamburger menu
  if (isCoarsePointer) {
    return null;
  }

  return (
    <div className={styles.topBarRight}>
      <Button size="sm" onClick={onTogglePreview} title="Toggle preview (P)">
        {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
        <span className={styles.btnText}>{showPreview ? "Hide" : "Preview"}</span>
      </Button>

      <Button size="sm" onClick={onToggleSound} title="Toggle sound (M)">
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </Button>

      <Button size="sm" onClick={onShowShortcuts} title="Keyboard shortcuts (?)">
        <Keyboard size={16} />
      </Button>

      {document.fullscreenEnabled && (
        <Button size="sm" onClick={onToggleFullscreen} title="Toggle fullscreen (F)">
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </Button>
      )}

      {showDebug && (
        <Button size="sm" onClick={onToggleDebug} title="Toggle debug overlay">
          <Bug size={16} />
        </Button>
      )}

      <Button size="sm" variant="primary" onClick={onNewPuzzle}>
        <Plus size={16} />
        <span className={styles.btnText}>New Puzzle</span>
      </Button>
    </div>
  );
}
