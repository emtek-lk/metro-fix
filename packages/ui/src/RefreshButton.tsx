import type { CSSProperties } from 'react';

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  /** Names what is refreshed, for screen readers: "Refresh customers". */
  subject?: string;
}

/** The standard "reload this data" control: one look and one behaviour everywhere in the web app. */
export function RefreshButton({ onClick, loading = false, label = 'Refresh', subject }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={subject ? `Refresh ${subject}` : 'Refresh'}
      aria-busy={loading}
      title={subject ? `Refresh ${subject}` : 'Refresh'}
      style={styles.button}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={loading ? { animation: 'metro-spin 0.8s linear infinite' } : undefined}
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
      <span>{loading ? 'Refreshing…' : label}</span>
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid rgba(243, 136, 8, 0.55)',
    background: 'transparent',
    color: '#f38808',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
