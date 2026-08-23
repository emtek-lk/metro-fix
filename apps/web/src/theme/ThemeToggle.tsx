import type { CSSProperties } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const icon = resolvedTheme === 'dark' ? '☾' : '☼';
  const label = resolvedTheme === 'dark' ? 'dark' : 'light';

  // Always flip to the opposite of the *resolved* (visible) theme.
  // This means one click is always responsive regardless of whether
  // the previous setting was 'system'.
  const cycleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      aria-label={`Theme: ${label}. Click to switch theme.`}
      title={`Theme: ${label}`}
      onClick={cycleTheme}
      className="metro-theme-btn"
      style={styles.iconButton}
    >
      <span aria-hidden="true" style={styles.iconGlyph}>
        {icon}
      </span>
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  iconButton: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: 'var(--sidebar-accent)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(14, 20, 21, 0.1)',
  },
  iconGlyph: {
    fontSize: '1rem',
    lineHeight: 1,
  },
};

export default ThemeToggle;