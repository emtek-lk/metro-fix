import type { CSSProperties } from 'react';

export interface NotFoundProps {
  onNavigateHome: () => void;
}

export function NotFound({ onNavigateHome }: NotFoundProps) {
  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <div style={styles.codeBlock}>
          <span style={styles.code}>404</span>
        </div>

        <h1 style={styles.title}>Page Not Found</h1>
        <p style={styles.description}>
          The route you're looking for doesn't exist in the Metro-Fix platform.
          It may have been moved, renamed, or is temporarily unavailable.
        </p>

        <div style={styles.divider} />

        <div style={styles.hint}>
          <span style={styles.hintIcon}>💡</span>
          <span>
            If you followed a link to get here, please contact your system
            administrator or return to your dashboard.
          </span>
        </div>

        <button type="button" style={styles.primaryBtn} onClick={onNavigateHome}>
          ← Return to Dashboard
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  screen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    minHeight: '60vh',
    padding: '32px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: 'var(--surface, #1e3247)',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
    borderRadius: '24px',
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
  },
  codeBlock: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '120px',
    height: '120px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, rgba(243, 136, 8, 0.15), rgba(243, 136, 8, 0.05))',
    border: '2px solid rgba(243, 136, 8, 0.3)',
    marginBottom: '24px',
  },
  code: {
    fontSize: '3rem',
    fontWeight: 900,
    color: '#f38808',
    letterSpacing: '-0.02em',
  },
  title: {
    margin: '0 0 12px',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--color-text-primary, #ffffff)',
  },
  description: {
    margin: '0 0 20px',
    fontSize: '0.92rem',
    lineHeight: 1.6,
    color: 'var(--color-text-secondary, rgba(255,255,255,0.7))',
  },
  divider: {
    height: '1px',
    background: 'var(--border-subtle, rgba(255,255,255,0.08))',
    margin: '20px 0',
  },
  hint: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(0, 0, 0, 0.2)',
    fontSize: '0.84rem',
    color: 'var(--color-text-secondary, rgba(255,255,255,0.65))',
    textAlign: 'left',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  hintIcon: {
    flexShrink: 0,
    fontSize: '1.1rem',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 28px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #f38808, #d37105)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(243, 136, 8, 0.35)',
    transition: 'transform 120ms ease, box-shadow 120ms ease',
  },
};

export default NotFound;
