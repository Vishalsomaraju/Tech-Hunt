// ============================================================================
// TECH HUNT — Error Boundary
// Catches uncaught React errors and displays a themed error screen with a
// "Reload" button instead of a blank white page.
// ============================================================================

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      "[ErrorBoundary] Uncaught error:",
      error,
      info.componentStack,
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-base)", padding: "var(--space-md)" }}
        >
          <div
            className="panel border-glow text-center"
            style={{ maxWidth: "480px", width: "100%", padding: "32px" }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h1
              className="font-mono glow-text"
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                marginBottom: "12px",
              }}
            >
              SYSTEM MALFUNCTION
            </h1>
            <p
              className="font-mono"
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "20px",
              }}
            >
              Something went wrong. The error has been logged.
            </p>
            {!import.meta.env.PROD && this.state.error && (
              <pre
                className="font-mono"
                style={{
                  fontSize: "11px",
                  textAlign: "left",
                  color: "var(--danger)",
                  background: "var(--bg-elevated)",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  overflow: "auto",
                  maxHeight: "160px",
                  marginBottom: "20px",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div className="flex justify-center" style={{ gap: "12px" }}>
              <button
                onClick={this.handleReload}
                className="btn-primary font-mono"
                style={{
                  width: "auto",
                  padding: "10px 20px",
                  fontSize: "12px",
                }}
              >
                RELOAD
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn-secondary font-mono"
                style={{
                  width: "auto",
                  padding: "10px 20px",
                  fontSize: "12px",
                }}
              >
                BACK TO HQ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
