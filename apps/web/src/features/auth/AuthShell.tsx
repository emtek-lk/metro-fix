import { useState, type CSSProperties } from 'react';
import { Role, type RegistrationInput, type User } from '@metro-fix/core-types';
import { BrandLogo, useMediaQuery } from '@metro-fix/ui';
import ThemeToggle from '../../theme/ThemeToggle';
import { Login } from './Login';
import { Register } from './Register';

export interface AuthShellProps {
  onAuthenticated: (user: User, token: string, targetPath: string) => void;
}

type AuthMode = 'login' | 'register';

export function AuthShell({ onAuthenticated }: AuthShellProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const isCompact = useMediaQuery('(max-width: 960px)');

  const handleLoginSuccess = (data: { accessToken: string; user: User }) => {
    const { accessToken, user } = data;
    const targetPath = user.role === Role.ADMIN ? '/admin' : '/dispatch';

    try {
      localStorage.setItem('metrofix_token', accessToken);
      localStorage.setItem('metrofix_user', JSON.stringify(user));
    } catch {
      // Storage fallback
    }

    onAuthenticated(user, accessToken, targetPath);
  };

  const handleRegistrationSuccess = (values: RegistrationInput) => {
    const role = values.role || Role.CUSTOMER;
    const targetPath = role === Role.ADMIN ? '/admin' : '/dispatch';
    const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const user: User = {
      id: `usr_${Date.now()}`,
      fullName: values.fullName,
      email: values.email,
      role,
      phoneNumber: values.phoneNumber || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('metrofix_token', mockToken);
      localStorage.setItem('metrofix_user', JSON.stringify(user));
    } catch {
      // Storage fallback
    }

    onAuthenticated(user, mockToken, targetPath);
  };

  return (
    <div style={{ ...styles.screen, ...(isCompact ? styles.screenCompact : undefined) }}>
      <section style={{ ...styles.shell, ...(isCompact ? styles.shellCompact : undefined) }}>
        <aside style={{ ...styles.leftPanel, ...(isCompact ? styles.leftPanelCompact : undefined) }}>
          <div style={styles.leftPattern} />
          <div style={styles.leftPatternGlowA} />
          <div style={styles.leftPatternGlowB} />

          <div style={styles.leftBrandCluster}>
            <div style={styles.brandMarkShell}>
              <img src={BrandLogo} alt="Metro-Fix" style={styles.brandMark} />
            </div>

            <div style={styles.brandBlock}>
              <div style={styles.kicker}>Facility Management Platform</div>
              <h1 style={styles.title}>METRO-FIX</h1>
              <p style={styles.copy}>Managed Dispatch Facility Control Center</p>
            </div>
          </div>

          <div style={{ ...styles.leftFooterCopy, ...(isCompact ? styles.leftFooterCopyCompact : undefined) }}>
            Managed dispatch, facility intake, and workforce coordination in one control surface.
          </div>
        </aside>

        <section style={{ ...styles.rightPanel, ...(isCompact ? styles.rightPanelCompact : undefined) }}>
          <header style={styles.rightHeader}>
            <div style={styles.tabRow} role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => setMode('login')}
                style={{ ...styles.tabButton, ...(mode === 'login' ? styles.tabButtonActive : undefined) }}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => setMode('register')}
                style={{ ...styles.tabButton, ...(mode === 'register' ? styles.tabButtonActive : undefined) }}
              >
                Register Profile
              </button>
            </div>

            <div style={styles.utilityCluster}>
              <ThemeToggle />
              <button type="button" aria-label="Help and support" title="Help and support" style={styles.helpButton}>
                Help
              </button>
            </div>
          </header>

          <div style={{ ...styles.panelBody, ...(isCompact ? styles.panelBodyCompact : undefined) }}>
            <div style={{ ...styles.formSurface, ...(isCompact ? styles.formSurfaceCompact : undefined) }}>
              {mode === 'login' ? (
                <Login onSuccess={handleLoginSuccess} />
              ) : (
                <Register onSubmit={handleRegistrationSuccess} />
              )}
            </div>

            <footer style={{ ...styles.footerRow, ...(isCompact ? styles.footerRowCompact : undefined) }}>
              <a href="mailto:support@metro-fix.com" style={styles.footerLink}>
                Trouble with your account?
              </a>

              <div style={styles.demoCard}>
                <div style={styles.demoTitle}>
                  Demo Credentials <span style={styles.demoHint}>(Password: Password123!)</span>
                </div>
                <div style={styles.demoRows}>
                  <div style={styles.demoRow}>
                    <span style={styles.demoLabel}>Admin:</span>
                    <code style={styles.demoCode}>admin@metro-fix.com</code>
                  </div>
                  <div style={styles.demoRow}>
                    <span style={styles.demoLabel}>Dispatcher:</span>
                    <code style={styles.demoCode}>dispatch@metro-fix.com</code>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  screen: {
    width: '100vw',
    height: '100vh',
    maxHeight: '100vh',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 'clamp(12px, 2vw, 22px)',
    boxSizing: 'border-box',
    background: 'var(--app-background)',
    overflow: 'hidden',
  },
  screenCompact: {
    height: 'auto',
    minHeight: '100vh',
    maxHeight: 'none',
    overflow: 'auto',
  },
  shell: {
    width: 'min(1280px, 100%)',
    height: '100%',
    minHeight: 0,
    display: 'flex',
    alignItems: 'stretch',
    gap: '18px',
  },
  shellCompact: {
    flexDirection: 'column',
    gap: '12px',
    height: 'auto',
    minHeight: '100%',
  },
  leftPanel: {
    position: 'relative',
    flex: '0 0 58%',
    minWidth: 0,
    overflow: 'hidden',
    borderRadius: '30px',
    padding: 'clamp(24px, 3vw, 40px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    boxShadow: '0 30px 70px rgba(6, 19, 20, 0.34)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background:
      'radial-gradient(circle at 20% 20%, rgba(243, 136, 8, 0.16), transparent 26%), radial-gradient(circle at 80% 22%, rgba(255, 214, 117, 0.08), transparent 24%), linear-gradient(160deg, #16373f 0%, #10282f 40%, #0f2328 100%)',
  },
  leftPanelCompact: {
    flex: '0 0 auto',
    minHeight: '220px',
    padding: 'clamp(18px, 4vw, 28px)',
  },
  leftPattern: {
    position: 'absolute',
    inset: 0,
    opacity: 0.35,
    backgroundImage:
      'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.11) 1px, transparent 0), linear-gradient(90deg, rgba(243,136,8,0.16) 1px, transparent 1px), linear-gradient(rgba(243,136,8,0.12) 1px, transparent 1px), linear-gradient(135deg, rgba(255,255,255,0.05), transparent 28%), linear-gradient(225deg, rgba(243,136,8,0.14), transparent 34%)',
    backgroundSize: '34px 34px, 140px 140px, 140px 140px, 100% 100%, 100% 100%',
    backgroundPosition: '0 0, 0 0, 0 0, 0 0, 0 0',
    maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95), rgba(0,0,0,0.65) 72%, transparent 100%)',
  },
  leftPatternGlowA: {
    position: 'absolute',
    width: '340px',
    height: '340px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(243,136,8,0.22) 0%, rgba(243,136,8,0.08) 34%, transparent 70%)',
    filter: 'blur(6px)',
    top: '-90px',
    left: '-120px',
  },
  leftPatternGlowB: {
    position: 'absolute',
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,225,157,0.16) 0%, rgba(255,225,157,0.04) 36%, transparent 74%)',
    filter: 'blur(4px)',
    bottom: '-90px',
    right: '-90px',
  },
  leftBrandCluster: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '18px',
    textAlign: 'center',
    maxWidth: '420px',
    margin: '0 auto',
  },
  brandMarkShell: {
    width: '108px',
    height: '108px',
    borderRadius: '28px',
    display: 'grid',
    placeItems: 'center',
    background: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.72)',
    boxShadow: '0 18px 42px rgba(0, 0, 0, 0.26)',
    backdropFilter: 'blur(12px)',
  },
  brandMark: {
    width: '76px',
    height: '76px',
    objectFit: 'contain',
    display: 'block',
  },
  brandBlock: {
    flex: 1,
  },
  kicker: {
    fontSize: '0.74rem',
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#ffd58a',
  },
  title: {
    margin: '6px 0 4px',
    fontSize: 'clamp(2rem, 4.8vw, 3.1rem)',
    lineHeight: 0.98,
    color: '#f8fbfb',
    fontWeight: 900,
    letterSpacing: '-0.03em',
  },
  copy: {
    margin: 0,
    color: 'rgba(239, 247, 247, 0.78)',
    lineHeight: 1.5,
    fontSize: '0.96rem',
  },
  leftFooterCopy: {
    position: 'absolute',
    left: 'clamp(24px, 3vw, 40px)',
    right: 'clamp(24px, 3vw, 40px)',
    bottom: 'clamp(22px, 3vw, 32px)',
    zIndex: 1,
    color: 'rgba(239, 247, 247, 0.74)',
    fontSize: '0.92rem',
    lineHeight: 1.5,
    letterSpacing: '0.01em',
    maxWidth: '420px',
  },
  leftFooterCopyCompact: {
    display: 'none',
  },
  rightPanel: {
    flex: '1 1 42%',
    minWidth: 0,
    minHeight: 0,
    borderRadius: '30px',
    padding: 'clamp(18px, 2.2vw, 24px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    overflow: 'hidden',
    boxSizing: 'border-box',
    border: '1px solid rgba(16, 36, 38, 0.08)',
    background: 'linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface) 100%)',
    boxShadow: '0 26px 65px rgba(10, 19, 20, 0.22)',
  },
  rightPanelCompact: {
    flex: '0 0 auto',
    minHeight: 'auto',
    padding: '16px',
    overflow: 'visible',
  },
  rightHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    flexWrap: 'wrap',
  },
  tabRow: {
    display: 'inline-grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    padding: '6px',
    borderRadius: '18px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  },
  tabButton: {
    minWidth: '152px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    borderRadius: '13px',
    padding: '11px 16px',
    fontWeight: 800,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabButtonActive: {
    background: 'linear-gradient(135deg, #f7b552 0%, #f38808 55%, #d37105 100%)',
    color: '#ffffff',
    borderColor: 'rgba(211, 113, 5, 0.4)',
    boxShadow: '0 12px 24px rgba(243, 136, 8, 0.24)',
  },
  utilityCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  helpButton: {
    height: '36px',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    padding: '0 14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(15, 24, 25, 0.08)',
  },
  panelBody: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  panelBodyCompact: {
    flex: '0 0 auto',
    minHeight: 'auto',
  },
  formSurface: {
    flex: '1 1 auto',
    minHeight: 0,
    borderRadius: '26px',
    padding: 'clamp(18px, 2vw, 24px)',
    background: 'linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface) 100%)',
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 18px 42px rgba(14, 20, 21, 0.08)',
    overflowY: 'auto',
    scrollbarWidth: 'none',
  },
  formSurfaceCompact: {
    flex: '0 0 auto',
    minHeight: 'auto',
    overflow: 'visible',
  },
  footerRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '14px',
    marginTop: 'auto',
  },
  footerRowCompact: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  footerLink: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '0.92rem',
    padding: '10px 0',
  },
  demoCard: {
    marginLeft: 'auto',
    width: 'min(320px, 100%)',
    padding: '14px 16px',
    borderRadius: '18px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 16px 30px rgba(14, 20, 21, 0.08)',
  },
  demoTitle: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  },
  demoHint: {
    color: 'var(--text-muted)',
    fontWeight: 700,
    textTransform: 'none',
    letterSpacing: '0',
  },
  demoRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  demoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    fontSize: '0.84rem',
  },
  demoLabel: {
    color: 'var(--text-secondary)',
    fontWeight: 700,
  },
  demoCode: {
    background: '#2b435f',
    color: '#f8fbfd',
    padding: '3px 8px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
  },
};

export default AuthShell;