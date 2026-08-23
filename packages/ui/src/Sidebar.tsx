import { useState, type ReactNode, type CSSProperties } from 'react';
import BrandLogo from './logo.png';

export type SidebarSection = {
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
  }>;
};

export interface SidebarProps {
  sections: SidebarSection[];
  activeRoute: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  onRouteChange: (route: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  footerSlot?: ReactNode;
  userProfile?: {
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onViewProfile?: () => void;
}

export const sidebarSections: SidebarSection[] = [
  {
    title: 'CUSTOMER CARE',
    items: [
      { id: 'dispatch-board', label: 'Dispatch Board', icon: '⌂' },
      { id: 'active-roster', label: 'Active Roster', icon: '☰' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { id: 'workers', label: 'Workers', icon: '◫' },
      { id: 'customers', label: 'Customers', icon: '◔' },
      { id: 'service-catalog', label: 'Service Catalog', icon: '⚙' },
      { id: 'subscriptions', label: 'Subscriptions', icon: '§' },
      { id: 'financials', label: 'Financials', icon: '⟠' },
    ],
  },
];

export function Sidebar({
  sections,
  activeRoute,
  filterValue,
  onFilterChange,
  onRouteChange,
  collapsed,
  onToggleCollapsed,
  footerSlot,
  userProfile,
  onLogout,
  onViewProfile,
}: SidebarProps) {
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
  const sidebarWidth = collapsed ? 60 : 260;

  const initials = userProfile?.fullName
    ? userProfile.fullName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const renderNavButton = (
    key: string,
    label: string,
    icon: ReactNode,
    active: boolean,
    onClick: () => void,
    title?: string,
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      title={title}
      className={active ? 'active' : ''}
      aria-current={active ? 'page' : undefined}
      style={{
        ...styles.navButton,
        ...(collapsed ? styles.navButtonCollapsed : undefined),
        ...(active ? styles.navButtonActive : undefined),
      }}
    >
      <div style={{ ...styles.iconBox, ...(active ? styles.iconBoxActive : styles.iconBoxInactive) }}>{icon}</div>
      {!collapsed && <span style={styles.navLabel}>{label}</span>}
    </button>
  );

  return (
    <aside style={{ ...styles.sidebar, width: sidebarWidth, padding: collapsed ? '12px' : '16px' }}>
      <div style={{ ...styles.topBlock, ...(collapsed ? styles.topBlockCollapsed : undefined) }}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          style={{
            ...styles.navButton,
            ...styles.headerToggle,
            ...(collapsed ? styles.headerToggleCollapsed : styles.headerToggleExpanded),
            ...(collapsed ? styles.navButtonCollapsed : undefined),
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div style={collapsed ? styles.brandBadgeCollapsed : styles.brandBadgeExpanded}>
            <img
              src={BrandLogo}
              alt="Metro-Fix"
              style={collapsed ? styles.brandLogoCollapsed : styles.brandLogoExpanded}
            />
          </div>

          {!collapsed && (
            <div style={styles.brandWordmark}>
              <div style={styles.brandWordmarkTitle}>METRO-FIX</div>
              <div style={styles.brandWordmarkSubtitle}>Facility control center</div>
            </div>
          )}
        </button>

        {!collapsed && (
          <label style={styles.searchContainer}>
            <span style={styles.filterLabel}>Search</span>
            <input
              value={filterValue}
              onChange={(event) => onFilterChange(event.target.value)}
              placeholder="Search menu..."
              className="sidebar-searchInput"
              style={styles.filterInput}
            />
          </label>
        )}
      </div>

      <div className="sidebar-navScroll" style={styles.menuScroll}>
        <nav style={styles.nav}>
          {sections.map((section) => (
            <section key={section.title} style={styles.sectionBlock}>
              {!collapsed && <div style={styles.sectionTitle}>{section.title}</div>}
              <div style={styles.menuGroup}>
                {section.items.map((item) => {
                  const active = item.label === activeRoute;

                  return renderNavButton(
                    item.id,
                    item.label,
                    item.icon ?? item.label.slice(0, 1),
                    active,
                    () => onRouteChange(item.label),
                    collapsed ? item.label : undefined,
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </div>

      <div style={styles.bottomBlock}>
        {footerSlot && (
          <div
            style={{
              ...styles.footerSlot,
              ...(collapsed ? styles.footerButtonWrapCollapsed : styles.footerButtonWrapExpanded),
            }}
          >
            {footerSlot}
          </div>
        )}

        {/* User Profile Block at Bottom */}
        {userProfile && (
          <div style={styles.profileContainer}>
            {/* Logout / View Profile Popover Menu */}
            {isProfilePopoverOpen && (
              <>
                <div
                  style={styles.popoverBackdrop}
                  onClick={() => setIsProfilePopoverOpen(false)}
                />
                <div
                  style={{
                    ...styles.popoverMenu,
                    ...(collapsed ? styles.popoverMenuCollapsed : styles.popoverMenuExpanded),
                  }}
                >
                  <div style={styles.popoverHeader}>
                    <div style={styles.popoverName}>{userProfile.fullName}</div>
                    <div style={styles.popoverEmail}>{userProfile.email}</div>
                  </div>
                  <div style={styles.popoverDivider} />
                  <button
                    type="button"
                    style={styles.popoverOption}
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      onViewProfile?.();
                    }}
                  >
                    <span>👤</span>
                    <span>View Profile</span>
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.popoverOption, ...styles.popoverLogoutBtn }}
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      onLogout?.();
                    }}
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}

            {/* Profile Trigger Button */}
            <button
              type="button"
              onClick={() => setIsProfilePopoverOpen((prev) => !prev)}
              title={collapsed ? `${userProfile.fullName} (${userProfile.role})` : undefined}
              style={{
                ...styles.profileBlock,
                ...(collapsed ? styles.profileBlockCollapsed : styles.profileBlockExpanded),
              }}
            >
              <div style={styles.avatarBox}>
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.fullName} style={styles.avatarImg} />
                ) : (
                  <span style={styles.avatarInitials}>{initials}</span>
                )}
              </div>

              {!collapsed && (
                <div style={styles.profileTextWrapper}>
                  <div style={styles.profileFullName}>{userProfile.fullName}</div>
                  <div style={styles.profileRole}>{userProfile.role}</div>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

const styles: Record<string, CSSProperties> = {
  sidebar: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    minHeight: '100vh',
    boxSizing: 'border-box',
    background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--border-subtle)',
    transition: 'width 180ms ease',
    overflow: 'hidden',
    position: 'relative',
  },
  topBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexShrink: 0,
  },
  topBlockCollapsed: {
    alignItems: 'center',
    gap: '10px',
  },
  headerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '72px',
    width: '100%',
    margin: 0,
    padding: '12px',
    borderRadius: '22px',
    background: 'rgba(255, 255, 255, 0.96)',
    border: '1px solid rgba(16, 36, 38, 0.08)',
    boxShadow: '0 14px 30px rgba(0, 0, 0, 0.18)',
  },
  headerToggleExpanded: {
    justifyContent: 'flex-start',
  },
  headerToggleCollapsed: {
    justifyContent: 'center',
    minHeight: '44px',
    padding: '0',
    borderRadius: '16px',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
  },
  brandBadgeExpanded: {
    width: '50px',
    height: '50px',
    borderRadius: '16px',
    background: '#ffffff',
    border: '1px solid rgba(16, 36, 38, 0.08)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  brandBadgeCollapsed: {
    width: '40px',
    height: '40px',
    borderRadius: '14px',
    background: '#ffffff',
    border: '1px solid rgba(16, 36, 38, 0.08)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  iconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    color: 'currentColor',
    fontSize: '1.2rem',
    fontWeight: 800,
    lineHeight: 1,
    flexShrink: 0,
  },
  iconBoxActive: {
    background: 'var(--sidebar-active-surface)',
    color: 'var(--sidebar-active-text)',
  },
  iconBoxInactive: {
    background: 'rgba(129, 177, 179, 0.12)',
    color: 'var(--sidebar-text)',
  },
  brandLogoExpanded: {
    height: '34px',
    width: '34px',
    objectFit: 'contain',
  },
  brandLogoCollapsed: {
    width: '26px',
    height: '26px',
    objectFit: 'contain',
  },
  brandWordmark: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  brandWordmarkTitle: {
    fontSize: '0.98rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#102426',
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
  },
  brandWordmarkSubtitle: {
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: '#4b6769',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px',
  },
  filterLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--sidebar-text-secondary, #d2dee7)',
  },
  filterInput: {
    width: '100%',
    borderRadius: '12px',
    // Sidebar is always dark regardless of theme — use sidebar-specific glass styling
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.07)',
    color: '#f8fbfd',
    caretColor: '#f8fbfd',
    padding: '10px 12px',
    boxSizing: 'border-box',
    fontSize: '0.88rem',
  },
  menuScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    paddingRight: '2px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    color: 'var(--sidebar-accent)',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    // 10px (nav btn left-padding) + 36px (icon-box) + 12px (gap) = 58px
    paddingLeft: '58px',
  },
  menuGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    minHeight: '52px',
    padding: '0 10px',
    margin: 0,
    borderRadius: '14px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--sidebar-text)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'transform 140ms ease, background-color 140ms ease, box-shadow 140ms ease',
    boxSizing: 'border-box',
  },
  navButtonCollapsed: {
    justifyContent: 'center',
    gap: 0,
    padding: '0',
    margin: 0,
  },
  navButtonActive: {
    color: '#ffffff',
    background: 'rgba(243, 136, 8, 0.14)',
  },
  navLabel: {
    color: 'currentColor',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  bottomBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  footerSlot: {
    display: 'block',
  },
  footerButtonWrapExpanded: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'flex-start',
    margin: '0',
    padding: '0',
    width: '100%',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  footerButtonWrapCollapsed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0',
    width: '100%',
    padding: '0',
    boxSizing: 'border-box',
  },
  profileContainer: {
    position: 'relative',
    width: '100%',
  },
  profileBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    minHeight: '54px',
    padding: '6px 0',
    margin: 0,
    borderRadius: '14px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--sidebar-text)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  profileBlockExpanded: {
    justifyContent: 'flex-start',
  },
  profileBlockCollapsed: {
    justifyContent: 'center',
  },
  avatarBox: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: '#f38808',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '0.92rem',
    flexShrink: 0,
    boxShadow: '0 6px 14px rgba(0, 0, 0, 0.18)',
  },
  avatarImg: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  avatarInitials: {
    color: '#ffffff',
    fontWeight: 800,
  },
  profileTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    textAlign: 'left',
  },
  profileFullName: {
    color: 'var(--text-primary)',
    fontWeight: 700,
    fontSize: '0.88rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  profileRole: {
    color: 'var(--text-secondary)',
    fontSize: '0.76rem',
    whiteSpace: 'nowrap',
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
  popoverMenu: {
    backgroundColor: '#2b435f',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    padding: '12px',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  popoverMenuExpanded: {
    position: 'absolute',
    bottom: '60px',
    left: 0,
    right: 0,
  },
  popoverMenuCollapsed: {
    position: 'fixed',
    left: '72px',
    bottom: '16px',
    width: '220px',
  },
  popoverHeader: {
    padding: '4px 6px',
  },
  popoverName: {
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '0.92rem',
  },
  popoverEmail: {
    color: '#81b1b3',
    fontSize: '0.78rem',
    marginTop: '2px',
  },
  popoverDivider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(243, 136, 8, 0.15)',
    color: '#f38808',
    fontWeight: 800,
    marginTop: '2px',
  },
};