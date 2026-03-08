import React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Play, Trophy } from "lucide-react";
import styles from "./CompletionOverlay.module.css";

export function CompletionOverlayReplayNextMenu(props: {
  replayNextMenuOpen: boolean;
  setReplayNextMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  replayNextRef: React.RefObject<HTMLDivElement>;
  replayNextTriggerRef: React.RefObject<HTMLButtonElement>;
  replayNextDropdownPosition: { top: number; left: number; minWidth: number } | null;
  canReplay: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
}) {
  const {
    replayNextMenuOpen,
    setReplayNextMenuOpen,
    replayNextRef,
    replayNextTriggerRef,
    replayNextDropdownPosition,
    canReplay,
    onReplayClick,
    onNextPuzzle,
  } = props;

  return (
    <div className={styles.completeReplayNextWrap} ref={replayNextRef}>
      <button
        ref={replayNextTriggerRef}
        type="button"
        className={styles.completeShareTrigger}
        onClick={() => setReplayNextMenuOpen((o) => !o)}
        aria-expanded={replayNextMenuOpen}
        aria-haspopup="true"
        aria-label="What's next"
        title="Watch replay or play another puzzle"
      >
        <Play size={18} aria-hidden />
        <span>{replayNextMenuOpen ? "Close menu" : "What's next"}</span>
        <ChevronDown
          size={16}
          className={replayNextMenuOpen ? styles.completeShareChevronOpen : ""}
          aria-hidden
        />
      </button>
      {replayNextMenuOpen &&
        replayNextDropdownPosition &&
        createPortal(
          <div
            className={styles.completeShareDropdown}
            role="menu"
            data-complete-replay-next-dropdown
            style={{
              position: "fixed",
              top: replayNextDropdownPosition.top,
              left: replayNextDropdownPosition.left,
              minWidth: replayNextDropdownPosition.minWidth,
              zIndex: 3000,
            }}
          >
            {canReplay && onReplayClick && (
              <button
                type="button"
                role="menuitem"
                className={styles.completeShareDropdownItem}
                title="Watch replay of your solve"
                onClick={() => {
                  setReplayNextMenuOpen(false);
                  onReplayClick();
                }}
              >
                <Play size={16} aria-hidden />
                <span>Watch Replay</span>
              </button>
            )}
            {onNextPuzzle && (
              <button
                type="button"
                role="menuitem"
                className={styles.completeShareDropdownItem}
                title="Play another puzzle"
                onClick={() => {
                  setReplayNextMenuOpen(false);
                  onNextPuzzle();
                }}
              >
                <Trophy size={16} className={styles.completeNextPuzzleIcon} aria-hidden />
                <span>Next Puzzle</span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
