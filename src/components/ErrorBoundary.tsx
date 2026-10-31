import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BOARDPASS Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)] text-[var(--text)]">
          <div className="card max-w-md w-full text-center space-y-4">
            <h2 className="text-lg font-bold text-[var(--danger)]">Something went wrong</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              We encountered an unexpected error. Your clinical records and streak are saved.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--accent)]"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
