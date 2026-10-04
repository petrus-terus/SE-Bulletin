import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorWrapper} role="alert">
          <div className={styles.errorCard}>
            <div className={styles.logoBadge}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '32px', color: '#0055A4' }}
              >
                bolt
              </span>
            </div>

            <h1 className={styles.title}>Display Recovery Notice</h1>

            <p className={styles.description}>
              The bulletin feed encountered an unexpected display issue. Your corporate session and
              saved items remain secure.
            </p>

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={this.handleReload}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  refresh
                </span>
                <span>Reload SE Bulletin</span>
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={this.handleReset}
              >
                Dismiss & Try Again
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className={styles.devDetails}>
                <summary className={styles.devSummary}>Technical Diagnostic Details</summary>
                <pre className={styles.devPre}>
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
