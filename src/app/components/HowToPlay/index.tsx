import { useState, useCallback } from "react";

const TUTORIAL_KEY = "phuzzle:tutorialDone";

export function useShouldShowTutorial(): [boolean, () => void] {
  const [showTutorial, setShowTutorial] = useState(
    () => localStorage.getItem(TUTORIAL_KEY) !== "done",
  );

  const dismissTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, "done");
    setShowTutorial(false);
  }, []);

  return [showTutorial, dismissTutorial];
}

export function TutorialOverlay({
  isOpen,
  onComplete,
}: {
  isOpen: boolean;
  onComplete: () => void;
  showSkipLink?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to Play"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: 20,
          padding: 32,
          maxWidth: 420,
          width: "100%",
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800 }}>How to Play</h2>
        <ul
          style={{
            margin: "0 0 20px",
            paddingLeft: 20,
            lineHeight: 1.7,
            fontSize: 14,
            color: "var(--color-text-secondary)",
          }}
        >
          <li>Drag pieces from the tray onto the board</li>
          <li>Pieces snap when near the correct spot</li>
          <li>Pinch or scroll to zoom; drag the board to pan</li>
          <li>Right-click or long-press to rotate a piece</li>
          <li>Use undo if you misplace a piece</li>
        </ul>
        <button
          type="button"
          onClick={onComplete}
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--color-brand-primary)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Let's go!
        </button>
      </div>
    </div>
  );
}
