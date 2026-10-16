import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Role, passwordPolicyProblem, type PublicAppSettings } from '@metro-fix/core-types';
import { SkeletonCards } from '@metro-fix/ui';
import { RefreshButton } from '../../components/RefreshButton';
import { API_BASE_URL } from '../../lib/api';
import { apiJson } from './http';
import { Field, SectionCard, StatusLine, buttons, inputStyle } from './ui';

interface StaffAccount {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber: string | null;
  isActive: boolean;
  locked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrator', CUSTOMER_CARE: 'Customer Care' };

/** Who can sign in to run the platform: add staff, change roles, switch accounts off, reset passwords. */
export function TeamSection({ currentUserId }: { currentUserId: string }) {
  const [staff, setStaff] = useState<StaffAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [dialog, setDialog] = useState<{ type: 'add' } | { type: 'reset'; account: StaffAccount } | null>(null);
  const [minLength, setMinLength] = useState(8);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiJson<StaffAccount[]>('/admin/users')
      .then(setStaff)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the team.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d: PublicAppSettings | null) => d && setMinLength(d.passwordMinLength))
      .catch(() => undefined);
  }, []);

  const change = async (account: StaffAccount, body: Record<string, unknown>, done: string) => {
    setNotice(null);
    try {
      const updated = await apiJson<StaffAccount>(`/admin/users/${account.id}`, { method: 'PATCH', body });
      setStaff((list) => list?.map((a) => (a.id === updated.id ? updated : a)) ?? list);
      setNotice({ kind: 'ok', text: done });
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'That change could not be made.' });
    }
  };

  const unlock = async (account: StaffAccount) => {
    setNotice(null);
    try {
      const updated = await apiJson<StaffAccount>(`/admin/users/${account.id}/unlock`, { method: 'POST', body: {} });
      setStaff((list) => list?.map((a) => (a.id === updated.id ? updated : a)) ?? list);
      setNotice({ kind: 'ok', text: `${account.fullName} can sign in again.` });
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Could not unlock.' });
    }
  };

  return (
    <SectionCard
      title="Team & access"
      intro="Administrators and Customer Care staff who can sign in to this dashboard. Technicians and customers are managed under Workers and Customers."
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <RefreshButton onClick={load} loading={loading} subject="team" />
          <button type="button" style={buttons.primary} onClick={() => setDialog({ type: 'add' })}>+ Add staff</button>
        </div>
      }
    >
      {notice && <div style={{ marginBottom: 12 }}><StatusLine kind={notice.kind}>{notice.text}</StatusLine></div>}
      {error && <StatusLine kind="error">{error}</StatusLine>}
      {!staff && !error && <SkeletonCards count={3} height={48} />}
      {staff && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Role', 'Status', 'Last sign-in', ''].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((account) => {
                const isSelf = account.id === currentUserId;
                return (
                  <tr key={account.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 700 }}>{account.fullName}{isSelf && <span style={styles.you}> (you)</span>}</div>
                      <div style={styles.sub}>{account.email}</div>
                    </td>
                    <td style={styles.td}>
                      <select
                        aria-label={`Role for ${account.fullName}`}
                        style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}
                        value={account.role}
                        disabled={isSelf}
                        onChange={(e) => void change(account, { role: e.target.value }, `${account.fullName} is now ${ROLE_LABEL[e.target.value]}.`)}
                      >
                        <option value={Role.ADMIN}>Administrator</option>
                        <option value={Role.CUSTOMER_CARE}>Customer Care</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      {account.locked ? <span style={{ ...styles.pill, ...styles.pillWarn }}>Locked</span> : account.isActive ? <span style={{ ...styles.pill, ...styles.pillOk }}>Active</span> : <span style={{ ...styles.pill, ...styles.pillOff }}>Deactivated</span>}
                    </td>
                    <td style={styles.td}>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={styles.rowActions}>
                        {account.locked && <button type="button" style={buttons.link} onClick={() => void unlock(account)}>Unlock</button>}
                        <button type="button" style={buttons.link} onClick={() => setDialog({ type: 'reset', account })}>Reset password</button>
                        {!isSelf && (
                          account.isActive ? (
                            <button type="button" style={{ ...buttons.link, color: '#ff8a80' }} onClick={() => { if (window.confirm(`Deactivate ${account.fullName}? They will be signed out and unable to sign in.`)) void change(account, { isActive: false }, `${account.fullName} was deactivated.`); }}>Deactivate</button>
                          ) : (
                            <button type="button" style={buttons.link} onClick={() => void change(account, { isActive: true }, `${account.fullName} can sign in again.`)}>Reactivate</button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.type === 'add' && (
        <AddStaffDialog minLength={minLength} onClose={() => setDialog(null)} onCreated={(a) => { setStaff((l) => (l ? [...l, a] : l)); setNotice({ kind: 'ok', text: `${a.fullName} was added. Share the temporary password with them privately.` }); }} />
      )}
      {dialog?.type === 'reset' && (
        <ResetPasswordDialog account={dialog.account} minLength={minLength} onClose={() => setDialog(null)} onDone={() => { setNotice({ kind: 'ok', text: `Password reset for ${dialog.account.fullName}. Share it with them privately.` }); load(); }} />
      )}
    </SectionCard>
  );
}

function Dialog({ title, onClose, onSubmit, busy, error, submitLabel, children }: { title: string; onClose: () => void; onSubmit: (e: FormEvent) => void; busy: boolean; error: string | null; submitLabel: string; children: React.ReactNode }) {
  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <form style={styles.dialog} onSubmit={onSubmit} noValidate>
        <h3 style={{ margin: '0 0 14px', color: 'var(--text-primary)' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
        {error && <div style={{ marginTop: 12 }}><StatusLine kind="error">{error}</StatusLine></div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button type="button" style={buttons.secondary} onClick={onClose}>Cancel</button>
          <button type="submit" style={buttons.primary} disabled={busy}>{busy ? 'Working…' : submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

function AddStaffDialog({ minLength, onClose, onCreated }: { minLength: number; onClose: () => void; onCreated: (a: StaffAccount) => void }) {
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', role: Role.CUSTOMER_CARE as string, password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) return setError('Enter their full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    const problem = passwordPolicyProblem(form.password, minLength);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const created = await apiJson<StaffAccount>('/admin/users', { method: 'POST', body: { ...form, phoneNumber: form.phoneNumber || undefined } });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add them.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog title="Add a staff member" onClose={onClose} onSubmit={submit} busy={busy} error={error} submitLabel="Add staff">
      <Field label="Full name" htmlFor="st-name"><input id="st-name" style={inputStyle} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
      <Field label="Email (their sign-in)" htmlFor="st-email"><input id="st-email" type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Phone (optional)" htmlFor="st-phone"><input id="st-phone" style={inputStyle} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></Field>
      <Field label="Role" htmlFor="st-role" hint="Administrators can change settings and manage accounts; Customer Care runs the dispatch board.">
        <select id="st-role" style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value={Role.CUSTOMER_CARE}>Customer Care</option>
          <option value={Role.ADMIN}>Administrator</option>
        </select>
      </Field>
      <Field label="Temporary password" htmlFor="st-pass" hint={`At least ${minLength} characters with letters and numbers. They should change it after signing in.`}>
        <input id="st-pass" type="text" autoComplete="off" style={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </Field>
    </Dialog>
  );
}

function ResetPasswordDialog({ account, minLength, onClose, onDone }: { account: StaffAccount; minLength: number; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordPolicyProblem(password, minLength);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await apiJson(`/admin/users/${account.id}/reset-password`, { method: 'POST', body: { password } });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog title={`Reset password for ${account.fullName}`} onClose={onClose} onSubmit={submit} busy={busy} error={error} submitLabel="Reset password">
      <Field label="New temporary password" htmlFor="rp-pass" hint={`At least ${minLength} characters with letters and numbers. This also unlocks the account.`}>
        <input id="rp-pass" type="text" autoComplete="off" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
    </Dialog>
  );
}

const styles: Record<string, CSSProperties> = {
  tableWrap: { overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' },
  th: { textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' },
  td: { padding: '12px 14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' },
  sub: { color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 2 },
  you: { fontWeight: 500, color: 'var(--text-secondary)' },
  pill: { display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700 },
  pillOk: { background: 'rgba(74,173,131,0.18)', color: '#4aad83' },
  pillOff: { background: 'rgba(148,163,184,0.18)', color: '#94a3b8' },
  pillWarn: { background: 'rgba(243,136,8,0.18)', color: '#f38808' },
  rowActions: { display: 'flex', gap: 16, justifyContent: 'flex-end', flexWrap: 'nowrap', whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(4,10,11,0.62)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 99999 },
  dialog: { width: 'min(460px, 100%)', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border-subtle)', padding: 22, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' },
};
