export function HelpChoiceModal({ isOpen, onClose, onHowToPlay, onKeyboardShortcuts, onOpenTheme, onOpenFeedback }: {
  isOpen: boolean; onClose: () => void; onHowToPlay?: () => void; onKeyboardShortcuts?: () => void; onOpenTheme?: () => void; onOpenFeedback?: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 24, minWidth: 280 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Help</h2>
        {[["How to Play", onHowToPlay], ["Keyboard Shortcuts", onKeyboardShortcuts], ["Theme", onOpenTheme], ["Feedback", onOpenFeedback]].map(([label, fn]) => fn && (
          <button key={label as string} type="button" onClick={() => { (fn as () => void)(); }} style={{ display: "block", width: "100%", padding: "10px 14px", marginBottom: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 10, cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{label as string}</button>
        ))}
        <button type="button" onClick={onClose} style={{ marginTop: 4, padding: "8px 14px", background: "none", border: "1px solid var(--color-border)", borderRadius: 8, cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13 }}>Close</button>
      </div>
    </div>
  );
}
