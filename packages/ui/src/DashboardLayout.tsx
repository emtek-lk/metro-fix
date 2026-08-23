import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { User } from '@metro-fix/core-types';
import { AdminWorkspace } from './AdminWorkspace';
import { Sidebar, sidebarSections } from './Sidebar';

export interface DashboardLayoutProps {
  children: ReactNode;
  activeRoute: string;
  userProfile: Pick<User, 'fullName' | 'email' | 'role' | 'avatarUrl'>;
  headerActions?: ReactNode;
  onRouteChange?: (route: string) => void;
  settingsSlot?: ReactNode;
  onLogout?: () => void;
  onViewProfile?: () => void;
}

const adminRoutes = new Set([
  'Workers',
  'Customers',
  'Service Catalog',
  'Subscriptions',
  'Financials',
]);

export function DashboardLayout({
  children,
  activeRoute,
  userProfile,
  headerActions,
  onRouteChange,
  settingsSlot,
  onLogout,
  onViewProfile,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterText, setFilterText] = useState('');

  const filteredSections = useMemo(() => {
    const search = filterText.trim().toLowerCase();

    return sidebarSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !search || item.label.toLowerCase().includes(search)),
      }))
      .filter((entry) => entry.items.length > 0);
  }, [filterText]);

  const initials = userProfile.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const workspace = children;

  return (
    <div style={styles.shell}>
      <Sidebar
        sections={filteredSections}
        activeRoute={activeRoute}
        filterValue={filterText}
        onFilterChange={setFilterText}
        onRouteChange={onRouteChange ?? (() => undefined)}
        collapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed((value) => !value)}
        footerSlot={settingsSlot}
        userProfile={userProfile}
        onLogout={onLogout}
        onViewProfile={onViewProfile}
      />

      <section style={styles.contentPane}>
        <header style={styles.header}>
          <div>
            <div style={styles.routeLabel}>{activeRoute}</div>
          </div>

          <div style={styles.headerActions}>
            {headerActions && <div style={styles.dynamicActions}>{headerActions}</div>}
            <div style={styles.profileChip}>
              <div style={styles.avatar}>{initials}</div>
              <div>
                <div style={styles.profileName}>{userProfile.fullName}</div>
                <div style={styles.profileEmail}>{userProfile.role} · {userProfile.email}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-viewPanel" style={styles.main}>{workspace}</main>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    overflow: 'hidden',
    background: 'var(--app-background)',
    color: 'var(--color-text-primary)',
  },
  contentPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100vh',
    overflow: 'hidden',
  },
  header: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 24px 16px 18px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface) 100%)',
    backdropFilter: 'blur(16px)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dynamicActions: {
    display: 'flex',
    alignItems: 'center',
  },
  routeLabel: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--color-text-primary)',
  },
  profileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    borderRadius: '16px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 8px 18px rgba(14, 20, 21, 0.06)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--sidebar-accent)',
    color: 'var(--text-inverse)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  profileName: {
    fontWeight: 700,
    fontSize: '0.86rem',
    color: 'var(--color-text-primary)',
  },
  profileEmail: {
    color: 'var(--color-text-secondary)',
    fontSize: '0.76rem',
  },
  main: {
    flex: 1,
    minWidth: 0,
    height: 'calc(100vh - 65px)',
    maxHeight: 'calc(100vh - 65px)',
    padding: '18px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};

export default DashboardLayout;