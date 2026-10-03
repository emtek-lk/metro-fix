import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { passwordPolicyProblem, type PublicAppSettings, type User } from '@metro-fix/core-types';
import ThemeToggle from '../../theme/ThemeToggle';
import { API_BASE_URL } from '../../lib/api';
import { apiJson } from './http';
import { Field, SectionCard, StatusLine, buttons, inputStyle } from './ui';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  CUSTOMER_CARE: 'Customer Care',
  WORKER: 'Technician',
  CUSTOMER: 'Customer',
};

/** Everyone's own settings: contact details, password, appearance and signing out. */
export function AccountSection({
  user,
  onProfileUpdated,
  onLogout,
}: {
  user: User;
  onProfileUpdated: (user: User) => void;
  onLogout: () => void;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phoneNumber ?? '');
  const [profileResult, setProfileResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [minLength, setMinLength] = useState(8);
  const [passwordResult, setPasswordResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicAppSettings | null) => data && setMinLength(data.passwordMinLength))
      .catch(() => undefined);
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (fullName.trim().length < 2) return setProfileResult({ kind: 'error', text: 'Enter your full name.' });
    setSavingProfile(true);
    setProfileResult(null);
    try {
      const updated = await apiJson<{ fullName?: string; phoneNumber?: string }>('/auth/profile', {
        method: 'PATCH',
        body: { fullName: fullName.trim(), phoneNumber: phone.trim() },
      });
      const profile: User = { ...user, fullName: updated.fullName ?? fullName.trim(), phoneNumber: updated.phoneNumber ?? phone.trim() };
      try {
        localStorage.setItem('metrofix_user', JSON.stringify(profile));
      } catch {
        // Storage safety
      }
      onProfileUpdated(profile);
      setProfileResult({ kind: 'ok', text: 'Your details were saved.' });
    } catch (e) {
      setProfileResult({ kind: 'error', text: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    const problem = passwordPolicyProblem(next, minLength);
    if (!current) return setPasswordResult({ kind: 'error', text: 'Enter your current password.' });
    if (problem) return setPasswordResult({ kind: 'error', text: problem });
    if (next !== confirm) return setPasswordResult({ kind: 'error', text: 'The two new passwords do not match.' });
    setSavingPassword(true);
    setPasswordResult(null);
    try {
      await apiJson('/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      setCurrent('');
      setNext('');
      setConfirm('');
      setPasswordResult({ kind: 'ok', text: 'Password changed. Use it the next time you sign in.' });
    } catch (e) {
      setPasswordResult({ kind: 'error', text: e instanceof Error ? e.message : 'Could not change the password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={styles.stack}>
      <SectionCard title="Your details" intro={`Signed in as ${user.email} · ${ROLE_LABEL[user.role] ?? user.role}. Your email is your sign-in; an administrator can change it.`}>
        <form onSubmit={saveProfile} noValidate>
          <div style={styles.grid}>
            <Field label="Full name" htmlFor="acc-name"><input id="acc-name" style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
            <Field label="Phone" htmlFor="acc-phone"><input id="acc-phone" style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          </div>
          {profileResult && <div style={{ marginTop: 12 }}><StatusLine kind={profileResult.kind}>{profileResult.text}</StatusLine></div>}
          <div style={styles.actions}>
            <button type="submit" style={buttons.primary} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save details'}</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Password" intro={`Use at least ${minLength} characters with letters and numbers.`}>
        <form onSubmit={savePassword} noValidate>
          <div style={styles.grid}>
            <Field label="Current password" htmlFor="acc-current"><input id="acc-current" type="password" autoComplete="current-password" style={inputStyle} value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
            <Field label="New password" htmlFor="acc-new"><input id="acc-new" type="password" autoComplete="new-password" style={inputStyle} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
            <Field label="Confirm new password" htmlFor="acc-confirm"><input id="acc-confirm" type="password" autoComplete="new-password" style={inputStyle} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
          </div>
          {passwordResult && <div style={{ marginTop: 12 }}><StatusLine kind={passwordResult.kind}>{passwordResult.text}</StatusLine></div>}
          <div style={styles.actions}>
            <button type="submit" style={buttons.primary} disabled={savingPassword}>{savingPassword ? 'Changing…' : 'Change password'}</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Appearance & session">
        <div style={styles.row}>
          <div>
            <div style={styles.rowTitle}>Theme</div>
            <div style={styles.rowHint}>Light, dark, or follow your device. Saved in this browser.</div>
          </div>
          <ThemeToggle />
        </div>
        <div style={{ ...styles.row, marginTop: 14 }}>
          <div>
            <div style={styles.rowTitle}>Sign out</div>
            <div style={styles.rowHint}>Ends your session on this browser.</div>
          </div>
          <button type="button" style={buttons.danger} onClick={onLogout}>Sign out</button>
        </div>
      </SectionCard>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  stack: { display: 'flex', flexDirection: 'column', gap: 18 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px 22px' },
  actions: { display: 'flex', justifyContent: 'flex-end', marginTop: 16 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  rowTitle: { fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' },
  rowHint: { color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 2 },
};
