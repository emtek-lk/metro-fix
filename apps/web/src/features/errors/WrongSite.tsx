import type { CSSProperties } from 'react';
import { SURFACE, siteUrl } from '@metro-fix/ui';
import { Role } from '@metro-fix/core-types';

interface WrongSiteProps {
  role: string;
  onSignOut: () => void;
}

/** Shown when someone signs in on the other audience's website: staff on the customer site, or customers on the staff site. */
export function WrongSite({ role, onSignOut }: WrongSiteProps) {
  const onStaffSite = SURFACE === 'admin';
  const isWorker = role === Role.WORKER;
  const target = siteUrl(onStaffSite ? 'customer' : 'admin');

  const title = onStaffSite ? 'This is the staff site' : isWorker ? 'Technicians use the mobile app' : 'This is the customer site';
  const body = onStaffSite
    ? 'Customer accounts sign in on the customer website.'
    : isWorker
      ? 'Technician accounts work from the METRO-FIX mobile app, not the website.'
      : 'Staff accounts sign in on the staff website.';

  return (
    <main style={styles.screen}>
      <div role="alert" style={styles.card}>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.copy}>{body}</p>
        <div style={styles.actions}>
          {target && !isWorker && (
            <a href={target} style={styles.primary}>
              {onStaffSite ? 'Go to the customer site' : 'Go to the staff site'}
            </a>
          )}
          <button type="button" style={styles.secondary} onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  screen: { minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20, background: 'var(--app-background)' },
  card: { width: 'min(440px, 100%)', padding: 28, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 20, boxShadow: 'var(--shadow-elevated)' },
  title: { margin: '0 0 8px', fontSize: '1.3rem', color: 'var(--text-primary)' },
  copy: { margin: '0 0 20px', color: 'var(--text-secondary)', lineHeight: 1.5 },
  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  primary: { display: 'block', padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#fff', fontWeight: 700, textDecoration: 'none', border: '1px solid #d37105' },
  secondary: { padding: '12px 18px', borderRadius: 12, background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-subtle)' },
};
