import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';

/**
 * True when a screen's code file failed to download. After a new release the old file names no longer
 * exist, so someone with the site already open hits this the next time they open a screen.
 */
export function isLoadFailure(error: unknown): boolean {
  const text = `${(error as Error)?.name ?? ''} ${(error as Error)?.message ?? ''}`;
  return /dynamically imported module|importing a module script failed|ChunkLoadError|error loading dynamically|Loading chunk|Failed to fetch dynamically/i.test(text);
}

interface Props {
  children: ReactNode;
  /** Changing this clears a previous error, e.g. when the person moves to another screen. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/** Catches a screen that failed to load or crashed, and says what to do instead of leaving a blank page. */
export class LoadErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[LoadErrorBoundary]', error.message, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const outdated = isLoadFailure(error);
    return (
      <div role="alert" style={styles.wrap}>
        <h2 style={styles.title}>{outdated ? 'A new version is available' : 'Something went wrong on this screen'}</h2>
        <p style={styles.copy}>
          {outdated
            ? 'METRO-FIX was updated while this page was open. Reload to get the latest version; you will stay signed in.'
            : 'You can try again, or reload the page. If it keeps happening, tell support what you were doing.'}
        </p>
        <div style={styles.actions}>
          {!outdated && (
            <button type="button" style={styles.secondary} onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          )}
          <button type="button" style={styles.primary} onClick={() => window.location.reload()}>
            {outdated ? 'Reload to update' : 'Reload page'}
          </button>
        </div>
      </div>
    );
  }
}

const styles: Record<string, CSSProperties> = {
  wrap: { margin: '48px auto', maxWidth: 460, padding: 24, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 18 },
  title: { margin: '0 0 8px', fontSize: '1.15rem', color: 'var(--text-primary)' },
  copy: { margin: '0 0 18px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 },
  actions: { display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  primary: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#fff', padding: '10px 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' },
  secondary: { border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: '#f38808', padding: '10px 16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' },
};
