import type { CSSProperties } from 'react';
import type { Role } from '@metro-fix/core-types';

export interface UnauthorizedProps {
  userRole?: Role | string;
  requiredRoles?: Role[];
  onNavigateHome: () => void;
  onLogout?: () => void;
}

export function Unauthorized({
  userRole,
  requiredRoles,
  onNavigateHome,
  onLogout,
}: UnauthorizedProps) {
  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <div style={styles.codeBlock}>
          <span style={styles.code}>403</span>
        </div>

        <h1 style={styles.title}>Access Restricted</h1>
        <p style={styles.description}>
          Your current role does not have permission to access this resource.
          Contact your system administrator if you believe this is an error.
        </p>

        <div style={styles.detailGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Your Role</span>
            <span style={styles.roleBadge}>{userRole || 'Unknown'}</span>
          </div>
          {requiredRoles && requiredRoles.length > 0 && (
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Required</span>
              <span style={styles.requiredBadge}>{requiredRoles.join(', ')}</span>
            </div>
          )}
        </div>

        <div style={styles.divider} />

        <div style={styles.hint}>
          <span style={styles.hintIcon}>🔒</span>
          <span>
            Metro-Fix enforces role-based access control. Administrative views
            require elevated privileges assigned by a platform administrator.
          </span>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.primaryBtn} onClick={onNavigateHome}>
            ← Back to Dashboard
          </button>
          {onLogout && (
            <button type="button" style={styles.secondaryBtn} onClick={onLogout}>
              Switch Account
            </button>
          )}
        </div>
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
    maxWidth: '500px',
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
    background: 'linear-gradient(135deg, rgba(198, 40, 40, 0.18), rgba(198, 40, 40, 0.06))',
    border: '2px solid rgba(198, 40, 40, 0.35)',
    marginBottom: '24px',
  },
  code: {
    fontSize: '3rem',
    fontWeight: 900,
    color: '#ef5350',
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
  detailGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-text-secondary, rgba(255,255,255,0.55))',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: '8px',
    background: 'rgba(243, 136, 8, 0.15)',
    border: '1px solid rgba(243, 136, 8, 0.3)',
    color: '#f38808',
    fontWeight: 800,
    fontSize: '0.82rem',
    letterSpacing: '0.04em',
  },
  requiredBadge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: '8px',
    background: 'rgba(198, 40, 40, 0.12)',
    border: '1px solid rgba(198, 40, 40, 0.3)',
    color: '#ef5350',
    fontWeight: 800,
    fontSize: '0.82rem',
    letterSpacing: '0.04em',
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
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
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
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 28px',
    borderRadius: '14px',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.2))',
    background: 'transparent',
    color: 'var(--color-text-primary, #ffffff)',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background 120ms ease',
  },
};

export default Unauthorized;
