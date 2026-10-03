import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Role, type User } from '@metro-fix/core-types';
import { useMediaQuery } from '@metro-fix/ui';
import { AccountSection } from './AccountSection';
import { AuditSection } from './AuditSection';
import { DataSection } from './DataSection';
import { SECTION_CONFIGS, SettingsFormSection } from './SettingsFormSection';
import { TeamSection } from './TeamSection';

interface SectionDef {
  id: string;
  label: string;
  adminOnly: boolean;
}

const SECTIONS: SectionDef[] = [
  { id: 'account', label: 'My account', adminOnly: false },
  { id: 'company', label: 'Company', adminOnly: true },
  { id: 'dispatch', label: 'Dispatch', adminOnly: true },
  { id: 'billing', label: 'Billing & tax', adminOnly: true },
  { id: 'requests', label: 'Requests & plans', adminOnly: true },
  { id: 'security', label: 'Security', adminOnly: true },
  { id: 'team', label: 'Team & access', adminOnly: true },
  { id: 'audit', label: 'Audit log', adminOnly: true },
  { id: 'data', label: 'Data & system', adminOnly: true },
];

interface SettingsPageProps {
  user: User;
  onProfileUpdated: (user: User) => void;
  onLogout: () => void;
}

/**
 * Settings. Everyone gets *My account* (details, password, theme, sign out); administrators also
 * get the platform settings, team and access, the audit log and data tools.
 */
export function SettingsPage({ user, onProfileUpdated, onLogout }: SettingsPageProps) {
  const isAdmin = user.role === Role.ADMIN;
  const sections = useMemo(() => SECTIONS.filter((s) => isAdmin || !s.adminOnly), [isAdmin]);
  const isCompact = useMediaQuery('(max-width: 860px)');

  const fromHash = () => {
    const wanted = window.location.hash.replace('#', '');
    return sections.some((s) => s.id === wanted) ? wanted : sections[0].id;
  };
  const [active, setActive] = useState<string>(fromHash);

  useEffect(() => {
    const onHash = () => setActive(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const choose = (id: string) => {
    setActive(id);
    window.history.replaceState(null, '', `${window.location.pathname}#${id}`);
  };

  const body = () => {
    if (active === 'account') return <AccountSection user={user} onProfileUpdated={onProfileUpdated} onLogout={onLogout} />;
    if (active === 'team') return <TeamSection currentUserId={user.id} />;
    if (active === 'audit') return <AuditSection />;
    if (active === 'data') return <DataSection />;
    const config = SECTION_CONFIGS[active];
    return config ? <SettingsFormSection key={active} config={config} /> : null;
  };

  return (
    <div style={{ ...styles.page, ...(isCompact ? styles.pageCompact : undefined) }}>
      <nav aria-label="Settings sections" style={{ ...styles.nav, ...(isCompact ? styles.navCompact : undefined) }}>
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="metro-settings-nav"
            aria-current={active === section.id ? 'page' : undefined}
            onClick={() => choose(section.id)}
            style={{ ...styles.navButton, ...(active === section.id ? styles.navButtonActive : undefined) }}
          >
            {section.label}
          </button>
        ))}
      </nav>
      <div style={styles.content}>{body()}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 22, alignItems: 'start', paddingBottom: 32 },
  pageCompact: { gridTemplateColumns: '1fr', gap: 14 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 0 },
  navCompact: { flexDirection: 'row', overflowX: 'auto', position: 'static', paddingBottom: 4 },
  navButton: { textAlign: 'left', padding: '10px 14px', borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  navButtonActive: { background: 'var(--surface)', borderColor: 'var(--border-subtle)', color: '#f38808' },
  content: { minWidth: 0 },
};
