import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL) ||
  'http://localhost:3000';

const authHeaders = (): Record<string, string> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('metrofix_token') || localStorage.getItem('metrofix_jwt') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Sends a PATCH and returns the parsed body, or throws an Error whose message is fit to show. */
async function patch(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const fields = data?.errors && Object.values(data.errors).flat().join(' ');
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(fields || message || 'The changes could not be saved.');
  }
  return data;
}

export interface EditableCustomer {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  facilityKey: string;
  planKey: string | null;
  billingKey: string | null;
}

export interface EditableWorker {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  rating: number;
  servicePillars: string[];
  isAvailable: boolean;
}

function Modal({ title, subtitle, onClose, onSubmit, saving, error, children }: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={title} className="metro-modal-overlay">
      <form style={styles.card} onSubmit={onSubmit} className="metro-modal-card" noValidate>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>{subtitle}</div>
            <h3 style={styles.title}>{title}</h3>
          </div>
          <button type="button" style={styles.close} onClick={onClose}>Close</button>
        </div>
        {children}
        {error && <div style={styles.error} role="alert">{error}</div>}
        <div style={styles.actions}>
          <button type="button" style={styles.close} onClick={onClose}>Cancel</button>
          <button type="submit" style={styles.save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}

const Field = ({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) => (
  <div style={styles.field}>
    <label htmlFor={htmlFor} style={styles.label}>{label}</label>
    {children}
    {hint && <div style={styles.hint}>{hint}</div>}
  </div>
);

export function EditCustomerModal({ customer, onClose, onSaved }: { customer: EditableCustomer; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    fullName: customer.fullName,
    companyName: customer.companyName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    facility: customer.facilityKey,
    plan: customer.planKey ?? '',
    billing: customer.billingKey ?? 'MONTHLY',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.fullName.trim().length < 2) return setError('Enter the customer’s full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    setSaving(true);
    setError(null);
    try {
      await patch(`/customers/${customer.id}`, {
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim() || null,
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        address: form.address.trim() || null,
        facilityType: form.facility,
        subscriptionTier: form.plan || null,
        ...(form.plan ? { billingCycle: form.billing } : {}),
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The changes could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${customer.fullName}`} subtitle="Customer" onClose={onClose} onSubmit={submit} saving={saving} error={error}>
      <div style={styles.grid}>
        <Field label="Full name" htmlFor="ec-name"><input id="ec-name" style={styles.input} value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} /></Field>
        <Field label="Company / household" htmlFor="ec-company"><input id="ec-company" style={styles.input} value={form.companyName} onChange={(e) => set('companyName')(e.target.value)} /></Field>
        <Field label="Email" htmlFor="ec-email" hint="This is also their login.">
          <input id="ec-email" type="email" style={styles.input} value={form.email} onChange={(e) => set('email')(e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="ec-phone"><input id="ec-phone" style={styles.input} value={form.phone} onChange={(e) => set('phone')(e.target.value)} /></Field>
      </div>
      <Field label="Address" htmlFor="ec-address"><input id="ec-address" style={styles.input} value={form.address} onChange={(e) => set('address')(e.target.value)} /></Field>
      <div style={styles.grid}>
        <Field label="Facility type" htmlFor="ec-facility">
          <select id="ec-facility" style={styles.input} value={form.facility} onChange={(e) => set('facility')(e.target.value)}>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
          </select>
        </Field>
        <Field label="Plan" htmlFor="ec-plan" hint="Changing the plan here records no payment (use it to comp a plan). “No plan” makes them a lead again.">
          <select id="ec-plan" style={styles.input} value={form.plan} onChange={(e) => set('plan')(e.target.value)}>
            <option value="">No plan (lead)</option>
            <option value="ACCESS">Access</option>
            <option value="ESSENTIAL">Essential</option>
            <option value="PLUS">Plus</option>
            <option value="BUSINESS">Business</option>
          </select>
        </Field>
        {form.plan && (
          <Field label="Billing" htmlFor="ec-billing">
            <select id="ec-billing" style={styles.input} value={form.billing} onChange={(e) => set('billing')(e.target.value)}>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </Field>
        )}
      </div>
    </Modal>
  );
}

const PILLARS = [
  { key: 'HARD', label: 'Hard FM' },
  { key: 'SOFT', label: 'Soft FM' },
  { key: 'STRATEGIC', label: 'Strategic FM' },
];

export function EditWorkerModal({ worker, onClose, onSaved }: { worker: EditableWorker; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    fullName: worker.fullName,
    email: worker.email,
    phone: worker.phone,
    rating: String(worker.rating),
    pillars: worker.servicePillars,
    isAvailable: worker.isAvailable,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePillar = (key: string) =>
    setForm((f) => ({ ...f, pillars: f.pillars.includes(key) ? f.pillars.filter((p) => p !== key) : [...f.pillars, key] }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const rating = Number(form.rating);
    if (form.fullName.trim().length < 2) return setError('Enter the worker’s full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return setError('The rating must be between 1 and 5.');
    if (form.pillars.length === 0) return setError('Pick at least one service the worker covers.');
    setSaving(true);
    setError(null);
    try {
      await patch(`/workers/${worker.id}`, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        rating,
        servicePillars: form.pillars,
        isAvailable: form.isAvailable,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The changes could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${worker.fullName}`} subtitle="Worker" onClose={onClose} onSubmit={submit} saving={saving} error={error}>
      <div style={styles.grid}>
        <Field label="Full name" htmlFor="ew-name"><input id="ew-name" style={styles.input} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></Field>
        <Field label="Email" htmlFor="ew-email" hint="This is also their login."><input id="ew-email" type="email" style={styles.input} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
        <Field label="Phone" htmlFor="ew-phone"><input id="ew-phone" style={styles.input} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
        <Field label="Internal rating (1–5)" htmlFor="ew-rating" hint="Dispatch ranks workers by this.">
          <input id="ew-rating" inputMode="decimal" style={styles.input} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} />
        </Field>
      </div>
      <div style={styles.field}>
        <span style={styles.label}>Services covered</span>
        <div style={styles.checks}>
          {PILLARS.map((pillar) => (
            <label key={pillar.key} style={styles.check}>
              <input type="checkbox" checked={form.pillars.includes(pillar.key)} onChange={() => togglePillar(pillar.key)} />
              {pillar.label}
            </label>
          ))}
        </div>
      </div>
      <label style={styles.check}>
        <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
        On duty (can be offered new jobs)
      </label>
    </Modal>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(4, 10, 11, 0.62)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 99999 },
  card: { width: 'min(640px, 100%)', borderRadius: 22, background: 'var(--surface)', border: '1px solid var(--border-subtle)', padding: 22, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 72px rgba(0,0,0,0.35)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 8 },
  kicker: { color: '#f38808', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.74rem', fontWeight: 700 },
  title: { margin: '4px 0 0', fontSize: '1.2rem', color: 'var(--text-primary)' },
  close: { border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: '#f38808', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 16px' },
  field: { display: 'flex', flexDirection: 'column', margin: '12px 0 0' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit' },
  hint: { fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 },
  checks: { display: 'flex', gap: 18, flexWrap: 'wrap' },
  check: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: 12 },
  error: { marginTop: 14, color: '#ff8a80', fontSize: '0.85rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  save: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#fff', padding: '10px 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' },
};
