import { useState, useMemo, type CSSProperties } from 'react';

export type RosterWorker = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  rating: number;
  currentTask: string;
  status: 'ON_ROUTE' | 'INSPECTION' | 'IN_PROGRESS' | 'AVAILABLE';
  lastPing: string;
};

const rosterData: RosterWorker[] = [
  {
    id: 'wrk-101',
    name: 'Amina Yusuf',
    phone: '+1 (555) 012-4491',
    zone: 'North District',
    rating: 4.9,
    currentTask: 'REQ-1001 • HVAC Chiller Maintenance',
    status: 'IN_PROGRESS',
    lastPing: '2 mins ago (GPS Live)',
  },
  {
    id: 'wrk-102',
    name: 'Malik Thompson',
    phone: '+1 (555) 012-7720',
    zone: 'Central Business',
    rating: 4.7,
    currentTask: 'REQ-1002 • Emergency Deep Clean',
    status: 'ON_ROUTE',
    lastPing: '1 min ago (GPS Live)',
  },
  {
    id: 'wrk-103',
    name: 'Nadia Khan',
    phone: '+1 (555) 012-3310',
    zone: 'East Park',
    rating: 4.8,
    currentTask: 'REQ-1003 • Security Patrol Audit',
    status: 'INSPECTION',
    lastPing: '4 mins ago (GPS Live)',
  },
  {
    id: 'wrk-104',
    name: 'Omar Silva',
    phone: '+1 (555) 012-8843',
    zone: 'Harbor Loop',
    rating: 4.5,
    currentTask: 'Standby / Unassigned',
    status: 'AVAILABLE',
    lastPing: 'Just now (GPS Live)',
  },
  {
    id: 'wrk-105',
    name: 'David Chen',
    phone: '+1 (555) 012-1152',
    zone: 'West Campus',
    rating: 4.6,
    currentTask: 'REQ-1004 • Fire Panel Compliance',
    status: 'ON_ROUTE',
    lastPing: '3 mins ago (GPS Live)',
  },
];

const statusStyles: Record<RosterWorker['status'], { label: string; bg: string; color: string }> = {
  IN_PROGRESS: { label: 'In Progress', bg: 'rgba(243, 136, 8, 0.18)', color: '#f38808' },
  ON_ROUTE: { label: 'On Route', bg: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa' },
  INSPECTION: { label: 'Inspection', bg: 'rgba(168, 85, 247, 0.18)', color: '#c084fc' },
  AVAILABLE: { label: 'Available', bg: 'rgba(74, 173, 131, 0.18)', color: '#4aad83' },
};

export function ActiveRosterView() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoster = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rosterData;
    return rosterData.filter((w) =>
      [w.name, w.zone, w.currentTask, w.status.replace('_', ' ')].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [searchQuery]);

  const isFiltering = searchQuery.trim().length > 0;

  return (
    <div style={styles.container}>
      {/* Modern Search bar */}
      <div className="metro-search-row">
        <div className="metro-search-wrap">
          <div className="metro-search-container">
            <div className="metro-search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="metro-search-input"
              aria-label="Search active roster"
              autoComplete="off"
              spellCheck={false}
            />
            {isFiltering && (
              <button
                type="button"
                aria-label="Clear search"
                className="metro-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {isFiltering && (
          <div className="metro-search-count-pill">
            {filteredRoster.length === 0
              ? 'No matches'
              : `${filteredRoster.length} of ${rosterData.length}`}
          </div>
        )}
      </div>

      <div style={styles.tableShell}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Worker Name</th>
                <th style={styles.th}>Coverage Zone</th>
                <th style={styles.th}>Current Task</th>
                <th style={styles.th}>Internal Rating</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>GPS Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {isFiltering ? 'No workers match your search.' : 'No active roster data.'}
                  </td>
                </tr>
              ) : (
                filteredRoster.map((worker) => {
                const s = statusStyles[worker.status];
                return (
                  <tr key={worker.id}>
                    <td style={styles.tdStrong}>
                      <div>{worker.name}</div>
                      <div style={styles.subtext}>{worker.phone}</div>
                    </td>
                    <td style={styles.td}>{worker.zone}</td>
                    <td style={styles.td}>{worker.currentTask}</td>
                    <td style={styles.td}>
                      <span style={styles.rating}>★ {worker.rating.toFixed(1)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusPill, backgroundColor: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={styles.tdSubtle}>{worker.lastPing}</td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    overflow: 'hidden',
    color: 'var(--text-primary)',
    gap: '12px',
  },
  /* ─── Search row ─── */
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '14px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    boxShadow: '0 2px 8px rgba(14, 20, 21, 0.04)',
  },
  searchIcon: {
    color: 'var(--text-secondary)',
    fontSize: '1.2rem',
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    outline: 'none',
    minWidth: 0,
  },
  searchClear: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.88rem',
    padding: '2px 4px',
    borderRadius: '6px',
    flexShrink: 0,
    lineHeight: 1,
  },
  searchCount: {
    flexShrink: 0,
    fontSize: '0.82rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    padding: '6px 12px',
    borderRadius: '10px',
    background: 'rgba(243, 136, 8, 0.08)',
    border: '1px solid rgba(243, 136, 8, 0.2)',
    color: '#f38808',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 800,
  },
  actionBtn: {
    backgroundColor: '#f38808',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 18px',
    fontWeight: 800,
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(243, 136, 8, 0.35)',
  },
  tableShell: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    height: '100%',
    overflow: 'hidden',
    background: 'var(--surface-strong)',
    borderRadius: '22px',
    border: '1px solid var(--border-subtle)',
  },
  tableWrap: {
    flex: 1,
    minHeight: 0,
    height: '100%',
    overflowY: 'auto',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    color: 'var(--text-primary)',
  },
  th: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    textAlign: 'left',
    padding: '14px 16px',
    backgroundColor: '#2b435f',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    boxShadow: '0 1px 0 var(--border-subtle)',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  tdStrong: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    fontWeight: 700,
    fontSize: '0.92rem',
  },
  subtext: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
    fontWeight: 400,
  },
  tdSubtle: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    fontSize: '0.84rem',
  },
  rating: {
    fontWeight: 700,
    color: '#f38808',
  },
  statusPill: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
};

export default ActiveRosterView;
