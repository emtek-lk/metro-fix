import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { SkeletonCards } from '@metro-fix/ui';
import { RefreshButton } from '../../components/RefreshButton';
import { apiJson } from './http';
import { humanize } from '../../lib/humanize';
import { SectionCard, StatusLine, inputStyle } from './ui';

interface AuditEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string | null;
  detail: string | null;
  createdAt: string;
}

const ACTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All activity' },
  { value: 'settings.update', label: 'Settings changed' },
  { value: 'user.create', label: 'Staff added' },
  { value: 'user.update', label: 'Account edited' },
  { value: 'user.deactivate', label: 'Account deactivated' },
  { value: 'user.reactivate', label: 'Account reactivated' },
  { value: 'user.reset-password', label: 'Password reset by admin' },
  { value: 'user.unlock', label: 'Account unlocked' },
  { value: 'auth.lockout', label: 'Account locked (too many attempts)' },
  { value: 'auth.change-password', label: 'Password changed' },
  { value: 'data.export', label: 'Data exported' },
];
const ACTION_LABEL = Object.fromEntries(ACTIONS.map((a) => [a.value, a.label]));

/** One readable line per change in an audit entry's details. */
function describe(entry: AuditEntry): string[] {
  if (!entry.detail) return [];
  let data: unknown;
  try {
    data = JSON.parse(entry.detail);
  } catch {
    return [entry.detail];
  }
  if (!data || typeof data !== 'object') return [String(data)];
  return Object.entries(data as Record<string, unknown>).map(([key, value]) => {
    if (value && typeof value === 'object' && 'from' in value && 'to' in value) {
      const { from, to } = value as { from: unknown; to: unknown };
      return `${key}: ${String(from ?? '—')} → ${String(to ?? '—')}`;
    }
    return `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`;
  });
}

/** Who changed what and when, newest first. Settings, account administration, lockouts and exports are recorded. */
export function AuditSection() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiJson<AuditEntry[]>(`/audit-log?limit=200${action ? `&action=${encodeURIComponent(action)}` : ''}`)
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the audit log.'))
      .finally(() => setLoading(false));
  }, [action]);

  useEffect(load, [load]);

  return (
    <SectionCard
      title="Audit log"
      intro="A permanent record of settings changes, account administration, lockouts and data exports. Passwords are never recorded."
      actions={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select aria-label="Filter activity" style={{ ...inputStyle, width: 'auto' }} value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
          <RefreshButton onClick={load} loading={loading} subject="audit log" />
        </div>
      }
    >
      {error && <StatusLine kind="error">{error}</StatusLine>}
      {!entries && !error && <SkeletonCards count={4} height={44} />}
      {entries && entries.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Nothing recorded yet.</p>}
      {entries && entries.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>{['When', 'Who', 'What', 'Details'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 700 }}>{entry.actorName}</div>
                    <div style={styles.sub}>{humanize(entry.actorRole).toLowerCase()}</div>
                  </td>
                  <td style={styles.td}>
                    <div>{ACTION_LABEL[entry.action] ?? humanize(entry.action)}</div>
                    {entry.target && <div style={styles.sub}>{entry.target}</div>}
                  </td>
                  <td style={styles.td}>
                    {describe(entry).map((line) => (
                      <div key={line} style={styles.line}>{line}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

const styles: Record<string, CSSProperties> = {
  tableWrap: { overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' },
  td: { padding: '10px 14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'top' },
  sub: { color: 'var(--text-secondary)', fontSize: '0.76rem', marginTop: 2 },
  line: { fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
};
