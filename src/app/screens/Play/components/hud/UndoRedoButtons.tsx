import { Undo2, Redo2 } from "lucide-react";

export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo"
        style={{
          appearance: "none", border: "1px solid var(--color-border)",
          background: "var(--color-bg-elevated)", color: "var(--color-text-primary)",
          padding: "6px 8px", borderRadius: 8, cursor: canUndo ? "pointer" : "not-allowed",
          opacity: canUndo ? 1 : 0.4, display: "flex", alignItems: "center",
        }}
      >
        <Undo2 size={16} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo"
        style={{
          appearance: "none", border: "1px solid var(--color-border)",
          background: "var(--color-bg-elevated)", color: "var(--color-text-primary)",
          padding: "6px 8px", borderRadius: 8, cursor: canRedo ? "pointer" : "not-allowed",
          opacity: canRedo ? 1 : 0.4, display: "flex", alignItems: "center",
        }}
      >
        <Redo2 size={16} aria-hidden />
      </button>
    </div>
  );
}
