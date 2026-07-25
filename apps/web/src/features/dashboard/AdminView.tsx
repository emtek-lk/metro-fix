import type { CSSProperties } from 'react';
import { useMediaQuery } from '@metro-fix/ui';

type SubscriptionRow = {
  id: string;
  account: string;
  plan: string;
  service: string;
  status: 'Active' | 'Pending' | 'Paused';
  renewal: string;
};

const subscriptions: SubscriptionRow[] = [
  {
    id: 'sub-101',
    account: 'Metro Towers',
    plan: 'Premium Operations',
    service: 'Hard + Soft',
    status: 'Active',
    renewal: '2026-08-12',
  },
  {
    id: 'sub-102',
    account: 'Central Mall',
    plan: 'Enterprise Coverage',
    service: 'Strategic',
    status: 'Pending',
    renewal: '2026-08-18',
  },
  {
    id: 'sub-103',
    account: 'North Campus',
    plan: 'Standard FM',
    service: 'Hard',
    status: 'Paused',
    renewal: '2026-09-01',
  },
];

const services = [
  { name: 'Hard FM', coverage: 'Mechanical, electrical, HVAC', utilization: '92%' },
  { name: 'Soft FM', coverage: 'Cleaning, reception, security', utilization: '78%' },
  { name: 'Strategic FM', coverage: 'Audits, planning, vendor governance', utilization: '66%' },
];

export function AdminView() {
  const isCompact = useMediaQuery('(max-width: 980px)');

  return (
    <section style={styles.view}>
      <div style={{ ...styles.hero, ...(isCompact ? styles.heroCompact : undefined) }}>
        <div>
          <div style={styles.kicker}>Management Workspace</div>
          <h2 style={styles.title}>Subscription and services control</h2>
          <p style={styles.copy}>
            Track customer subscriptions, service coverage, and plan-level utilization in a clean operations table.
          </p>
        </div>
      </div>

      <div style={{ ...styles.statGrid, ...(isCompact ? styles.statGridCompact : undefined) }}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active subscriptions</div>
          <div style={styles.statValue}>148</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Managed services</div>
          <div style={styles.statValue}>12</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Renewals this week</div>
          <div style={styles.statValue}>24</div>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>Subscriptions</h3>
          <span style={styles.panelMeta}>Manage contract lifecycle and renewal readiness</span>
        </div>

        <div style={styles.tableWrap}>
          <table style={{ ...styles.table, minWidth: 760 }}>
            <thead>
              <tr>
                <th style={styles.th}>Account</th>
                <th style={styles.th}>Plan</th>
                <th style={styles.th}>Service mix</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Renewal</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((row) => (
                <tr key={row.id}>
                  <td style={styles.tdStrong}>{row.account}</td>
                  <td style={styles.td}>{row.plan}</td>
                  <td style={styles.td}>{row.service}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusChip, ...statusTone[row.status] }}>{row.status}</span>
                  </td>
                  <td style={styles.td}>{row.renewal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>Services</h3>
          <span style={styles.panelMeta}>Service catalog posture and utilization</span>
        </div>

        <div style={{ ...styles.serviceCards, ...(isCompact ? styles.serviceCardsCompact : undefined) }}>
          {services.map((service) => (
            <article key={service.name} style={styles.serviceCard}>
              <div style={styles.serviceTopRow}>
                <h4 style={styles.serviceName}>{service.name}</h4>
                <span style={styles.utilization}>{service.utilization}</span>
              </div>
              <p style={{ ...styles.copy, color: '#4e6769' }}>{service.coverage}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const statusTone: Record<SubscriptionRow['status'], CSSProperties> = {
  Active: {
    background: 'rgba(74, 173, 131, 0.12)',
    color: '#2d7d58',
  },
  Pending: {
    background: 'rgba(224, 169, 54, 0.14)',
    color: '#956c14',
  },
  Paused: {
    background: 'rgba(149, 92, 188, 0.12)',
    color: '#6f4491',
  },
};

const styles: Record<string, CSSProperties> = {
  view: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
    color: '#eff7f7',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroCompact: {
    flexDirection: 'column',
  },
  kicker: {
    color: '#81b1b3',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  title: {
    margin: '10px 0 8px',
    fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
  },
  copy: {
    margin: 0,
    color: 'rgba(234, 243, 243, 0.72)',
    lineHeight: 1.6,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
  },
  statGridCompact: {
    gridTemplateColumns: '1fr',
  },
  statCard: {
    padding: '20px',
    borderRadius: '20px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
  },
  statLabel: {
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  panel: {
    padding: '22px',
    borderRadius: '22px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  panelTitle: {
    margin: 0,
    fontSize: '1.2rem',
  },
  panelMeta: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    color: 'var(--text-primary)',
  },
  th: {
    textAlign: 'left',
    padding: '14px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--sidebar-accent)',
    fontSize: '0.84rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
  },
  tdStrong: {
    padding: '14px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontWeight: 700,
  },
  statusChip: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '6px 10px',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  serviceCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
  },
  serviceCardsCompact: {
    gridTemplateColumns: '1fr',
  },
  serviceCard: {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: '18px',
    padding: '18px',
  },
  serviceTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  },
  serviceName: {
    margin: 0,
    fontSize: '1rem',
  },
  utilization: {
    borderRadius: '999px',
    padding: '6px 10px',
    background: 'var(--sidebar-accent)',
    color: 'var(--text-inverse)',
    fontWeight: 700,
    fontSize: '0.8rem',
  },
};

export default AdminView;