type Props = {
  message: string;
  onDismiss: () => void;
  showButton?: boolean;
};

export function OnboardingTooltip({ message, onDismiss, showButton }: Props) {
  return (
    <div
      role="tooltip"
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 13,
        fontWeight: 500,
        color: "var(--color-text-primary)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: 280,
        margin: "0 auto",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {showButton && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            appearance: "none" as const,
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: "2px 4px",
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
