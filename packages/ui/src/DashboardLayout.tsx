import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { User } from '@metro-fix/core-types';
import { Sidebar, sidebarSections, portalSections } from './Sidebar';
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

/** One line under each page title, so the ribbon says what the page is for. */
const PAGE_BLURB: Record<string, string> = {
  'Dispatch Board': 'Offer jobs to technicians and move every ticket through its stages',
  'Active Roster': 'Live status of every field technician',
  Workers: 'Field technicians, the services they cover and their login access',
  Customers: 'Customer accounts, facilities and subscriptions',
  'Service Catalog': 'The services customers can request, and their pricing',
  Subscriptions: 'Plans, allowances and active accounts',
  Financials: 'Revenue and billing from completed jobs',
  'Browse Services': 'Pick a service and request a technician',
  'My Requests': 'Follow your jobs from request to completion',
  Subscription: 'Your plan, billing and payment history',
  Settings: 'Platform, team and account preferences',
};

const SETTINGS_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const formatToday = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

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

    // Menu follows the role: customers get the portal, dispatchers don't see Administration.
    const roleSections =
      userProfile.role === 'CUSTOMER'
        ? portalSections
        : userProfile.role === 'ADMIN'
          ? sidebarSections
          : sidebarSections.filter((section) => section.title !== 'ADMINISTRATION');

    return roleSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !search || item.label.toLowerCase().includes(search)),
      }))
      .filter((entry) => entry.items.length > 0);
  }, [filterText, userProfile.role]);

  // The page's menu icon and section, so the ribbon title reads as part of the sidebar.
  const page = useMemo(() => {
    for (const section of [...sidebarSections, ...portalSections]) {
      const item = section.items.find((entry) => entry.label === activeRoute);
      if (item) return { kicker: section.title, icon: item.icon };
    }
    if (activeRoute === 'Settings') return { kicker: 'ACCOUNT', icon: SETTINGS_ICON };
    return { kicker: 'METRO-FIX', icon: null };
  }, [activeRoute]);
  const blurb = PAGE_BLURB[activeRoute];

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
            {page.icon && (
              <span style={styles.pageIcon} aria-hidden="true">
                {page.icon}
              </span>
            )}
            <div style={styles.pageText}>
              <div style={styles.pageKicker}>{page.kicker}</div>
              <div style={styles.routeLabel}>{activeRoute}</div>
              {blurb && !isMobile && <div style={styles.pageBlurb}>{blurb}</div>}
            </div>
          </div>

          <div style={styles.headerActions}>
            {!isMobile && <span style={styles.dateChip}>{formatToday()}</span>}
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
        <span style={styles.headerAccent} aria-hidden="true" />
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
    padding: '14px 24px 14px 18px',
    borderBottom: '1px solid var(--border-subtle)',
    // A soft brand-orange glow behind the title, over the usual surface gradient.
    background:
      'radial-gradient(520px 130px at 0% 0%, rgba(243, 136, 8, 0.14), transparent 70%), linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface) 100%)',
    backdropFilter: 'blur(16px)',
  },
  headerAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: '2px',
    background: 'linear-gradient(90deg, #f38808 0%, rgba(243, 136, 8, 0.35) 22%, transparent 60%)',
    pointerEvents: 'none',
  },
  pageIcon: {
    width: '42px',
    height: '42px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '13px',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #f38808, #d37105)',
    boxShadow: '0 8px 18px rgba(243, 136, 8, 0.32)',
  },
  pageText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  pageKicker: {
    fontSize: '0.66rem',
    fontWeight: 800,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#f38808',
  },
  pageBlurb: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dateChip: {
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '0.76rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
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
    margin: 0,
    fontSize: '1.3rem',
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: '-0.01em',
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