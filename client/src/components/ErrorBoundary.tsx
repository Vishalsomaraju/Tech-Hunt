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
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
          <div className="glass-panel p-8 max-w-lg w-full text-center space-y-6">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-2xl font-mono neon-text">SYSTEM MALFUNCTION</h1>
            <p className="text-sm text-[var(--color-text-muted)] font-mono">
              Something went wrong. The error has been logged.
            </p>
            {!import.meta.env.PROD && this.state.error && (
              <pre className="text-xs text-left text-[var(--color-error)] bg-[var(--color-bg-surface)] p-3 rounded-lg overflow-auto max-h-40 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary font-mono text-sm"
              >
                RELOAD
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn-secondary font-mono text-sm"
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
