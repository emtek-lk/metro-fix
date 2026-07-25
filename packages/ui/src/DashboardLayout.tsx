import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { User } from '@metro-fix/core-types';
import { AdminWorkspace } from './AdminWorkspace';
import { Sidebar, sidebarSections } from './Sidebar';

export interface DashboardLayoutProps {
  children: ReactNode;
  activeRoute: string;
  userProfile: Pick<User, 'fullName' | 'email' | 'role'>;
  onRouteChange?: (route: string) => void;
  settingsSlot?: ReactNode;
}

type WorkspaceRole = 'CUSTOMER_CARE' | 'ADMIN';

const defaultRouteByRole: Record<WorkspaceRole, string> = {
  CUSTOMER_CARE: 'Dispatch Board',
  ADMIN: 'Workers',
};

export function DashboardLayout({
  children,
  activeRoute,
  userProfile,
  onRouteChange,
  settingsSlot,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<WorkspaceRole>('CUSTOMER_CARE');

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

  const toggleRole = (nextRole: WorkspaceRole) => {
    setCurrentUserRole(nextRole);
    onRouteChange?.(defaultRouteByRole[nextRole]);
  };

  const workspace = currentUserRole === 'CUSTOMER_CARE' ? children : <AdminWorkspace />;

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
      />

      <section style={styles.contentPane}>
        <header style={styles.header}>
          <div>
            <div style={styles.routeLabel}>{activeRoute}</div>
            <div style={styles.routeMeta}>Cross-platform command surface</div>
          </div>

          <div style={styles.headerActions}>
            <div style={styles.roleSwitch}>
              <button
                type="button"
                onClick={() => toggleRole('CUSTOMER_CARE')}
                style={{ ...styles.roleButton, ...(currentUserRole === 'CUSTOMER_CARE' ? styles.roleButtonActive : undefined) }}
              >
                Customer Care
              </button>
              <button
                type="button"
                onClick={() => toggleRole('ADMIN')}
                style={{ ...styles.roleButton, ...(currentUserRole === 'ADMIN' ? styles.roleButtonActive : undefined) }}
              >
                Admin
              </button>
            </div>
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
    gap: '24px',
    padding: '22px 28px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--surface)',
    backdropFilter: 'blur(14px)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  roleSwitch: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px',
    borderRadius: '16px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
  },
  roleButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    padding: '8px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  roleButtonActive: {
    background: 'var(--sidebar-accent)',
    color: 'var(--text-inverse)',
  },
  routeLabel: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  routeMeta: {
    marginTop: '6px',
    color: 'var(--color-text-secondary)',
    fontSize: '0.92rem',
  },
  profileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '18px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    minWidth: '260px',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'var(--sidebar-accent)',
    color: 'var(--text-inverse)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    flexShrink: 0,
  },
  profileName: {
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  profileEmail: {
    marginTop: '4px',
    color: 'var(--color-text-secondary)',
    fontSize: '0.85rem',
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: '24px',
    boxSizing: 'border-box',
    overflowX: 'auto',
    overflowY: 'auto',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
  },
};

export default DashboardLayout;