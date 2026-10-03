import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { RefreshButton } from '../../components/RefreshButton';
import { API_BASE_URL } from '../../lib/api';
import { apiJson, downloadFile } from './http';
import { SectionCard, StatusLine, buttons } from './ui';

interface SystemInfo {
  environment: string;
  nodeVersion: string;
  uptimeSeconds: number;
  database: 'ok' | 'unreachable';
  counts: { users: number; customers: number; workers: number; jobs: number };
}

const EXPORTS = [
  { path: '/admin/export/customers', file: 'customers.csv', title: 'Customers', note: 'Contact details, company, plan and billing.' },
  { path: '/admin/export/workers', file: 'workers.csv', title: 'Workers', note: 'Contact details, rating, services and duty status.' },
  { path: '/admin/export/jobs', file: 'jobs.csv', title: 'Jobs', note: 'Every ticket with status, people and quoted amount.' },
  { path: '/financials/export', file: 'invoices.csv', title: 'Invoices', note: 'Invoiced and awaiting-approval jobs, with due dates.' },
];

const uptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/** Downloads of the platform's data and a health check of the running system. */
export function DataSection() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiJson<SystemInfo>('/admin/system')
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const download = async (item: (typeof EXPORTS)[number]) => {
    setBusy(item.path);
    setNotice(null);
    try {
      await downloadFile(item.path, item.file);
      setNotice({ kind: 'ok', text: `${item.title} exported. The download is recorded in the audit log.` });
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'The export failed.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={styles.stack}>
      <SectionCard title="Export data" intro="CSV files for accounting, reporting and backups. Passwords and tokens are never included, and each export is recorded in the audit log.">
        {notice && <div style={{ marginBottom: 12 }}><StatusLine kind={notice.kind}>{notice.text}</StatusLine></div>}
        <div style={styles.exportGrid}>
          {EXPORTS.map((item) => (
            <div key={item.path} style={styles.exportCard}>
              <div>
                <div style={styles.exportTitle}>{item.title}</div>
                <div style={styles.exportNote}>{item.note}</div>
              </div>
              <button type="button" style={buttons.secondary} disabled={busy === item.path} onClick={() => void download(item)}>
                {busy === item.path ? 'Preparing…' : 'Download CSV'}
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="System" intro="The state of the running platform." actions={<RefreshButton onClick={load} loading={loading} subject="system status" />}>
        {!info ? (
          <StatusLine kind="error">System status is unavailable right now.</StatusLine>
        ) : (
          <div style={styles.facts}>
            {[
              ['Database', info.database === 'ok' ? 'Connected' : 'Unreachable'],
              ['Environment', info.environment],
              ['Server uptime', uptime(info.uptimeSeconds)],
              ['Node.js', info.nodeVersion],
              ['API address', API_BASE_URL],
              ['Accounts', String(info.counts.users)],
              ['Customers', String(info.counts.customers)],
              ['Workers', String(info.counts.workers)],
              ['Jobs', String(info.counts.jobs)],
            ].map(([label, value]) => (
              <div key={label} style={styles.fact}>
                <div style={styles.factLabel}>{label}</div>
                <div style={{ ...styles.factValue, ...(label === 'Database' && value === 'Unreachable' ? { color: '#ff8a80' } : undefined) }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  stack: { display: 'flex', flexDirection: 'column', gap: 18 },
  exportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 },
  exportCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-strong)' },
  exportTitle: { fontWeight: 700, color: 'var(--text-primary)' },
  exportNote: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 },
  facts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 },
  fact: { padding: '12px 14px', border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--surface-strong)' },
  factLabel: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700 },
  factValue: { marginTop: 4, fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' },
};
