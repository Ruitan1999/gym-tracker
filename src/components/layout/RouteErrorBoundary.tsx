import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reloadFresh } from '../../utils/lazyWithRetry';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
  detail: string;
}

/**
 * Last resort for a route that won't load. Without this a failed chunk sits on
 * the Suspense fallback — a blank screen with no way out and nothing to report.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, detail: '' };

  static getDerivedStateFromError(error: Error): State {
    return { failed: true, detail: `${error.name}: ${error.message}` };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route failed to render:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          COULDN'T LOAD THIS PAGE
        </div>
        <p
          className="font-display mt-2 mb-1"
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--color-text)',
          }}
        >
          Something went missing.
        </p>
        <p className="text-[13px] mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Your workouts are safe. Reloading usually sorts it.
        </p>
        {this.state.detail && (
          <p
            className="font-mono text-[10px] mb-6 max-w-full break-words"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {this.state.detail}
          </p>
        )}
        <button
          type="button"
          onClick={reloadFresh}
          className="h-12 px-6 btn-volt press caps-tight text-[11px]"
          style={{ borderRadius: '2px' }}
        >
          RELOAD →
        </button>
      </div>
    );
  }
}
