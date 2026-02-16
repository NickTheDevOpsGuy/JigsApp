import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Catches React errors in the tree and shows a friendly fallback + reload.
 * Does not affect touch, pointer, or any event handling.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            background: "var(--color-bg-primary, #f3f7ff)",
            color: "var(--color-text-primary, #103257)",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          {this.state.error && (
            <p
              style={{
                fontSize: 13,
                marginBottom: 12,
                padding: "12px 16px",
                maxWidth: 480,
                width: "100%",
                textAlign: "left",
                background: "var(--color-error-bg, #fef2f2)",
                color: "var(--color-error, #dc2626)",
                border: "1px solid var(--color-error-border, #fecaca)",
                borderRadius: 8,
                wordBreak: "break-word",
                fontFamily: "monospace",
              }}
            >
              {this.state.error.message || String(this.state.error)}
            </p>
          )}
          <p
            style={{
              fontSize: 14,
              marginBottom: 16,
              color: "var(--color-text-secondary)",
            }}
          >
            You can reload to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              fontWeight: 600,
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              background: "var(--color-brand-primary)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
