import { type CSSProperties } from 'react';

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
  return (
    <div style={styles.container}>
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
              {rosterData.map((worker) => {
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
              })}
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
    borderRadius: '18px',
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
