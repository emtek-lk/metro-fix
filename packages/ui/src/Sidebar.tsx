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
  userProfile?: {
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onViewProfile?: () => void;
}

const SVGIcon = ({ children }: { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const sidebarSections: SidebarSection[] = [
  {
    title: 'CUSTOMER CARE',
    items: [
      { id: 'dispatch-board', label: 'Dispatch Board', icon: <SVGIcon><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></SVGIcon> },
      { id: 'active-roster', label: 'Active Roster', icon: <SVGIcon><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></SVGIcon> },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { id: 'workers', label: 'Workers', icon: <SVGIcon><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></SVGIcon> },
      { id: 'customers', label: 'Customers', icon: <SVGIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></SVGIcon> },
      { id: 'service-catalog', label: 'Service Catalog', icon: <SVGIcon><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></SVGIcon> },
      { id: 'subscriptions', label: 'Subscriptions', icon: <SVGIcon><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></SVGIcon> },
      { id: 'financials', label: 'Financials', icon: <SVGIcon><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></SVGIcon> },
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
  const sidebarWidth = collapsed ? 80 : 260;

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
      data-tooltip={title}
      className={`sidebar-nav-btn ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
      aria-current={active ? 'page' : undefined}
      style={{
        ...styles.navButton,
        ...(collapsed ? styles.navButtonCollapsed : undefined),
        ...(active ? styles.navButtonActive : undefined),
      }}
    >
      <div
        className="sidebar-icon-box"
        style={{ ...styles.iconBox, ...(active ? styles.iconBoxActive : styles.iconBoxInactive) }}
      >
        {icon}
      </div>
      {!collapsed && <span style={styles.navLabel}>{label}</span>}
    </button>
  );

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: sidebarWidth,
        padding: collapsed ? '16px 0' : '16px',
        alignItems: collapsed ? 'center' : 'stretch',
      }}
    >
      <div style={{ ...styles.topBlock, ...(collapsed ? styles.topBlockCollapsed : undefined), width: '100%' }}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`sidebar-nav-btn ${collapsed ? 'collapsed' : ''}`}
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

      <div style={{ ...styles.bottomBlock, ...(collapsed ? { alignItems: 'center' } : undefined), width: '100%' }}>
        {/* User Profile Block at Bottom */}
        {userProfile && (
          <div style={{ ...styles.profileContainer, ...(collapsed ? { display: 'flex', justifyContent: 'center' } : undefined) }}>
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
                    ...(collapsed ? styles.popoverMenuCollapsed : undefined),
                  }}
                  className="metro-modal-card"
                >
                  <div style={styles.popoverHeader}>
                    <div style={styles.popoverName}>{userProfile.fullName}</div>
                    <div style={styles.popoverEmail}>{userProfile.email}</div>
                  </div>
                  <div style={styles.popoverDivider} />
                  <button
                    type="button"
                    className="sidebar-popover-option"
                    style={styles.popoverOption}
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      onViewProfile?.();
                    }}
                  >
                    <SVGIcon><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SVGIcon>
                    <span>View Profile</span>
                  </button>
                  <button
                    type="button"
                    className="sidebar-popover-option"
                    style={{ ...styles.popoverOption, ...styles.popoverLogoutBtn }}
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      onLogout?.();
                    }}
                  >
                    <SVGIcon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></SVGIcon>
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
              className="sidebar-profile-btn"
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
    width: '44px',
    height: '44px',
    minHeight: '44px',
    padding: '0',
    margin: '0 auto',
    borderRadius: '12px',
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
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#ffffff',
    border: '1px solid rgba(16, 36, 38, 0.08)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  iconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
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
    width: '100%',
    padding: 0,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
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
    width: '100%',
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
    width: '44px',
    height: '44px',
    minHeight: '44px',
    padding: '0',
    margin: '0 auto',
    borderRadius: '12px',
    gap: 0,
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
    margin: '0 auto',
    width: '44px',
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
    padding: '6px 8px',
    borderRadius: '12px',
  },
  profileBlockCollapsed: {
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    minHeight: '44px',
    padding: '0',
    margin: '0 auto',
    borderRadius: '12px',
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
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.88rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  profileRole: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '0.74rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
    backgroundColor: '#1c2d40',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '16px',
    padding: '12px',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
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
    left: '84px',
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
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: '#f0f6fc',
    fontSize: '0.88rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
  },
  popoverLogoutBtn: {
    backgroundColor: 'rgba(243, 136, 8, 0.16)',
    color: '#f38808',
    border: '1px solid rgba(243, 136, 8, 0.35)',
    fontWeight: 800,
    marginTop: '2px',
  },
};