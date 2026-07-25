import type { ReactNode, CSSProperties } from 'react';
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
}: SidebarProps) {
  const sidebarWidth = collapsed ? 60 : 260;

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
      <div style={styles.topBlock}>
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
          <img
            src={BrandLogo}
            alt="Metro-Fix"
            style={collapsed ? styles.brandLogoCollapsed : styles.brandLogoExpanded}
          />
        </button>

        {!collapsed && (
          <label style={styles.searchContainer}>
            <span style={styles.filterLabel}>Filter Navigator</span>
            <input
              value={filterValue}
              onChange={(event) => onFilterChange(event.target.value)}
              placeholder="Type to filter"
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
  },
  topBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    flexShrink: 0,
  },
  headerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '60px',
    width: '100%',
    margin: 0,
    padding: 0,
  },
  headerToggleExpanded: {
    justifyContent: 'flex-start',
  },
  headerToggleCollapsed: {
    justifyContent: 'center',
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
  headerIconBox: {
    background: 'var(--sidebar-accent)',
    color: 'var(--text-inverse)',
  },
  brandLogoExpanded: {
    height: '40px',
    width: 'auto',
    objectFit: 'contain',
  },
  brandLogoCollapsed: {
    maxWidth: '40px',
    height: 'auto',
    objectFit: 'contain',
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  filterLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  filterInput: {
    width: '100%',
    borderRadius: '14px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: 'var(--color-text-primary, #000)',
    caretColor: 'var(--color-text-primary, #000)',
    padding: '12px 14px',
    boxSizing: 'border-box',
  },
  menuScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    color: 'var(--sidebar-accent)',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    paddingLeft: '62px',
  },
  menuGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    minHeight: '60px',
    padding: '0',
    margin: 0,
    borderRadius: '14px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--sidebar-text)',
    textAlign: 'left',
    cursor: 'pointer',
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
  },
  navLabel: {
    color: 'currentColor',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  bottomBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexShrink: 0,
    paddingTop: '12px',
  },
  footerSlot: {
    display: 'block',
  },
  footerButtonWrapExpanded: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'flex-start',
    margin: '0 16px',
    padding: '8px',
    width: 'calc(100% - 32px)',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  footerButtonWrapCollapsed: {
    justifyContent: 'center',
    margin: '0 0 16px 0',
    width: '100%',
    padding: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
};