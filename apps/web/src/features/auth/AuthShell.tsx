import { useState, type CSSProperties } from 'react';
import { Role, type LoginInput, type RegistrationInput, type User } from '@metro-fix/core-types';
import { Login } from './Login';
import { Register } from './Register';
import { useMediaQuery } from '@metro-fix/ui';
import ThemeToggle from '../../theme/ThemeToggle';

export interface AuthShellProps {
  onAuthenticated: (user: User) => void;
}

type AuthMode = 'login' | 'register';

export function AuthShell({ onAuthenticated }: AuthShellProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const isCompact = useMediaQuery('(max-width: 820px)');

  const handleRegistrationSuccess = (values: RegistrationInput) => {
    onAuthenticated({
      id: `usr_${Date.now()}`,
      fullName: values.fullName,
      email: values.email,
      role: values.role,
      phoneNumber: values.phoneNumber || undefined,
      createdAt: new Date().toISOString(),
    });
  };

  const handleLoginSuccess = (values: LoginInput) => {
    const normalizedRole = values.email.includes('admin') ? Role.Admin : Role.CustomerCare;

    onAuthenticated({
      id: `usr_${Date.now()}`,
      fullName: values.email.split('@')[0].replace(/[._-]/g, ' '),
      email: values.email,
      role: normalizedRole,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div style={styles.screen}>
      <section style={{ ...styles.card, ...(isCompact ? styles.cardCompact : undefined) }}>
        <div style={{ ...styles.cardHeader, ...(isCompact ? styles.cardHeaderCompact : undefined) }}>
          <div style={styles.brandBlock}>
            <div style={styles.kicker}>Facility Management Platform</div>
            <h1 style={styles.title}>Metro-Fix control center</h1>
            <p style={styles.copy}>
              One authentication shell that can be reused by web, mobile, and backend validation flows.
            </p>
          </div>

          <ThemeToggle />
        </div>

        <div style={{ ...styles.toggleRow, ...(isCompact ? styles.toggleRowCompact : undefined) }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{ ...styles.toggleButton, ...(mode === 'login' ? styles.toggleActive : undefined) }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            style={{ ...styles.toggleButton, ...(mode === 'register' ? styles.toggleActive : undefined) }}
          >
            Register
          </button>
        </div>

        <div style={styles.formPanel}>
          {mode === 'login' ? <Login onSubmit={handleLoginSuccess} /> : <Register onSubmit={handleRegistrationSuccess} />}
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  screen: {
    minHeight: '100svh',
    display: 'grid',
    placeItems: 'center',
    padding: 'clamp(16px, 3vw, 32px)',
    boxSizing: 'border-box',
    background: 'var(--app-background)',
  },
  card: {
    width: 'min(860px, 100%)',
    background: 'var(--surface)',
    borderRadius: '28px',
    padding: 'clamp(18px, 2.5vw, 32px)',
    boxShadow: 'var(--shadow-elevated)',
    border: '1px solid var(--border-subtle)',
  },
  cardCompact: {
    borderRadius: '22px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
  },
  cardHeaderCompact: {
    flexDirection: 'column',
  },
  brandBlock: {
    flex: 1,
    maxWidth: '620px',
  },
  kicker: {
    fontSize: '0.82rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  },
  title: {
    margin: '12px 0 10px',
    fontSize: 'clamp(1.9rem, 4vw, 3rem)',
    lineHeight: 1.08,
    color: 'var(--text-primary)',
  },
  copy: {
    margin: 0,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  toggleRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginBottom: '24px',
  },
  toggleButton: {
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: 'var(--text-secondary)',
    borderRadius: '16px',
    padding: '14px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  toggleRowCompact: {
    gridTemplateColumns: '1fr',
  },
  toggleActive: {
    background: 'var(--accent-strong)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--accent-strong)',
  },
  formPanel: {
    background: 'var(--surface-elevated)',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid var(--border-subtle)',
  },
};

export default AuthShell;