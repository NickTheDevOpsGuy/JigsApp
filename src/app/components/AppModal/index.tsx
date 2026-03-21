/**
 * AppModal – a flexible modal overlay used throughout the app.
 */
import React, { useEffect, useRef } from "react";

export type AppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  surface?: "bare" | "card" | "elevated";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  tone?: "default" | "celebration" | "danger";
  showCloseButton?: boolean;
  ariaLabel?: string;
};

export function AppModal({
  isOpen,
  onClose,
  children,
  surface = "card",
  size = "md",
  tone = "default",
  showCloseButton = true,
  ariaLabel,
}: AppModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      prev?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthMap: Record<string, string> = {
    sm: "360px",
    md: "480px",
    lg: "600px",
    xl: "720px",
    full: "100%",
  };

  const toneStyles: Record<string, React.CSSProperties> = {
    default: {},
    celebration: { background: "var(--color-bg-primary)" },
    danger: {},
  };

  const surfaceStyles: Record<string, React.CSSProperties> = {
    bare: { background: "transparent", border: "none", boxShadow: "none", padding: 0 },
    card: {
      background: "var(--color-bg-elevated, #1e1e2e)",
      border: "1px solid var(--color-border, rgba(255,255,255,0.1))",
      borderRadius: "20px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
    },
    elevated: {
      background: "var(--color-bg-card, #252535)",
      border: "1px solid var(--color-border, rgba(255,255,255,0.1))",
      borderRadius: "20px",
      boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "16px",
        paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
        ...toneStyles[tone],
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: maxWidthMap[size] ?? "480px",
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          outline: "none",
          ...surfaceStyles[surface],
        }}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
              appearance: "none",
              background: "var(--color-bg-card, rgba(255,255,255,0.08))",
              border: "1px solid var(--color-border, rgba(255,255,255,0.12))",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary, rgba(255,255,255,0.6))",
              fontSize: 16,
            }}
          >
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
