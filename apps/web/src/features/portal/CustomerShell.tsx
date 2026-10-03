import type { CSSProperties, ReactNode } from 'react';
import { BrandLogo, useMediaQuery } from '@metro-fix/ui';
import type { User } from '@metro-fix/core-types';
import ThemeToggle from '../../theme/ThemeToggle';
import { useAppSettings } from '../../lib/settings';

export interface CustomerNavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const CUSTOMER_NAV: CustomerNavItem[] = [
  {
    path: '/portal/services',
    label: 'Services',
    icon: (
      <Icon>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </Icon>
    ),
  },
  {
    path: '/portal/requests',
    label: 'Requests',
    icon: (
      <Icon>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9" />
      </Icon>
    ),
  },
  {
    path: '/portal/subscription',
    label: 'Plan',
    icon: (
      <Icon>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </Icon>
    ),
  },
  {
    path: '/settings',
    label: 'Account',
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </Icon>
    ),
  },
];

interface CustomerShellProps {
  user: Pick<User, 'fullName' | 'email'>;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

/**
 * The customer website's frame. On a phone: a slim top bar and a thumb-height tab bar along the
 * bottom. From tablet up: a top bar with the same four destinations as links and the account on the
 * right, and the page content in a centred column so it never stretches across a wide screen.
 * The page scrolls inside the frame, so the bars stay put.
 */
export function CustomerShell({ user, activePath, onNavigate, onLogout, children }: CustomerShellProps) {
  const isWide = useMediaQuery('(min-width: 860px)');
  const { companyName } = useAppSettings();

  const go = (event: { preventDefault: () => void }, path: string) => {
    event.preventDefault();
    onNavigate(path);
  };

  return (
    <div style={styles.frame}>
      <header style={{ ...styles.top, ...(isWide ? styles.topWide : undefined) }}>
        <a href="/portal/services" onClick={(e) => go(e, '/portal/services')} style={styles.brand} aria-label={`${companyName} home`}>
          <img src={BrandLogo} alt="" style={styles.logo} />
          <span style={styles.brandName}>{companyName}</span>
        </a>

        {isWide && (
          <nav aria-label="Main" style={styles.links}>
            {CUSTOMER_NAV.map((item) => {
              const active = activePath === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className="cshell-link"
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => go(e, item.path)}
                  style={{ ...styles.link, ...(active ? styles.linkActive : undefined) }}
                >
                  {item.label === 'Account' ? 'Settings' : item.label === 'Requests' ? 'My requests' : item.label === 'Plan' ? 'Subscription' : item.label}
                </a>
              );
            })}
          </nav>
        )}

        <div style={styles.right}>
          <ThemeToggle compact />
          {isWide && (
            <>
              <span style={styles.avatar} aria-hidden="true">{initials(user.fullName)}</span>
              <span style={styles.who}>
                <span style={styles.whoName}>{user.fullName}</span>
                <button type="button" className="cshell-signout" style={styles.signOut} onClick={onLogout}>Sign out</button>
              </span>
            </>
          )}
        </div>
      </header>

      <main id="customer-main" style={styles.main}>
        <div style={{ ...styles.content, ...(isWide ? styles.contentWide : undefined) }}>{children}</div>
      </main>

      {!isWide && (
        <nav aria-label="Main" style={styles.tabs}>
          {CUSTOMER_NAV.map((item) => {
            const active = activePath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className="cshell-tab"
                aria-current={active ? 'page' : undefined}
                onClick={(e) => go(e, item.path)}
                style={{ ...styles.tab, ...(active ? styles.tabActive : undefined) }}
              >
                {item.icon}
                <span style={styles.tabLabel}>{item.label}</span>
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  frame: { height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--app-background)', color: 'var(--text-primary)' },
  top: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 'max(10px, env(safe-area-inset-top)) 16px 10px', background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)' },
  topWide: { padding: '12px 32px', gap: 28 },
  brand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)', minWidth: 0 },
  logo: { height: 34, width: 'auto', flexShrink: 0 },
  brandName: { fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  links: { display: 'flex', gap: 6, flex: 1 },
  link: { padding: '9px 14px', borderRadius: 10, textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.92rem' },
  linkActive: { color: '#f38808', background: 'rgba(243, 136, 8, 0.12)' },
  right: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: '#f38808', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.8rem' },
  who: { display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
  whoName: { fontWeight: 700, fontSize: '0.86rem' },
  signOut: { alignSelf: 'flex-start', border: 'none', background: 'transparent', padding: 0, color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' },
  main: { flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' },
  content: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: '16px 16px 24px' },
  contentWide: { padding: '28px 32px 48px' },
  tabs: { flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)', padding: '6px 6px max(6px, env(safe-area-inset-bottom))' },
  tab: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 52, borderRadius: 12, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 },
  tabActive: { color: '#f38808' },
  tabLabel: { lineHeight: 1 },
};
