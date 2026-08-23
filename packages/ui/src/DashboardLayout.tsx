import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { User } from '@metro-fix/core-types';
import { AdminWorkspace } from './AdminWorkspace';
import { Sidebar, sidebarSections } from './Sidebar';
import { useMediaQuery } from './useMediaQuery';

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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isHeaderProfileOpen, setIsHeaderProfileOpen] = useState(false);

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
        onRouteChange={(route) => {
          if (isMobile) setIsDrawerOpen(false);
          onRouteChange?.(route);
        }}
        collapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed((value) => !value)}
        userProfile={userProfile}
        onLogout={onLogout}
        onViewProfile={onViewProfile}
        isMobile={isMobile}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <section style={styles.contentPane}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                style={styles.hamburgerButton}
                aria-label="Open menu"
                className="metro-header-btn-icon"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            <div style={styles.routeLabel}>{activeRoute}</div>
          </div>

          <div style={styles.headerActions}>
            {headerActions && <div style={styles.dynamicActions}>{headerActions}</div>}
            
            {settingsSlot && <div style={styles.dynamicActions}>{settingsSlot}</div>}

            <div style={styles.headerProfileWrapper}>
              <button
                type="button"
                className="header-profile-btn"
                onClick={() => setIsHeaderProfileOpen((prev) => !prev)}
                style={styles.profileChip}
                aria-label={`Open account menu for ${userProfile.fullName}`}
              >
                <div style={styles.avatar}>{initials}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={styles.profileName}>{userProfile.fullName}</div>
                  <div style={styles.profileEmail}>{userProfile.role} · {userProfile.email}</div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>▼</span>
              </button>

              {isHeaderProfileOpen && (
                <>
                  <div
                    style={styles.popoverBackdrop}
                    onClick={() => setIsHeaderProfileOpen(false)}
                  />
                  <div style={styles.headerPopoverMenu} className="metro-modal-card">
                    <div style={styles.popoverHeader}>
                      <div style={styles.popoverName}>{userProfile.fullName}</div>
                      <div style={styles.popoverEmail}>{userProfile.email}</div>
                    </div>
                    <div style={styles.popoverDivider} />
                    <button
                      type="button"
                      className="header-popover-option"
                      style={styles.popoverOption}
                      onClick={() => {
                        setIsHeaderProfileOpen(false);
                        onViewProfile?.();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>View Profile</span>
                    </button>
                    <button
                      type="button"
                      className="header-popover-option header-popover-logout"
                      style={{ ...styles.popoverOption, ...styles.popoverLogoutBtn }}
                      onClick={() => {
                        setIsHeaderProfileOpen(false);
                        onLogout?.();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="dashboard-viewPanel" style={styles.main}>
          <div className="metro-view-enter" style={styles.viewPort}>
            {workspace}
          </div>
        </main>
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
    position: 'relative',
    zIndex: 1000,
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
  hamburgerButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '4px',
    display: 'grid',
    placeItems: 'center',
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
  headerProfileWrapper: {
    position: 'relative',
  },
  popoverBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99998,
    background: 'transparent',
  },
  headerPopoverMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '230px',
    backgroundColor: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    padding: '12px',
    boxShadow: '0 18px 42px rgba(0, 0, 0, 0.22)',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  popoverHeader: {
    padding: '4px 6px',
  },
  popoverName: {
    color: 'var(--text-primary)',
    fontWeight: 800,
    fontSize: '0.92rem',
  },
  popoverEmail: {
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    marginTop: '2px',
  },
  popoverDivider: {
    height: '1px',
    backgroundColor: 'var(--border-subtle)',
    margin: '4px 0',
  },
  popoverOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
  },
  popoverLogoutBtn: {
    backgroundColor: 'rgba(243, 136, 8, 0.14)',
    color: '#f38808',
    border: '1px solid rgba(243, 136, 8, 0.3)',
    fontWeight: 800,
    marginTop: '2px',
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
  viewPort: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    height: '100%',
    overflow: 'hidden',
  },
};

export default DashboardLayout;