import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { FacilityType, ServicePillar } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { MapPicker, type PickedLocation } from '../../components/MapPicker';

interface CustomerOption {
  id: string;
  facilityType?: FacilityType;
  latitude?: number | null;
  longitude?: number | null;
  companyName?: string | null;
  user?: { fullName?: string; email?: string; phoneNumber?: string | null };
}

interface CreateRequestModalProps {
  onClose: () => void;
  /** Called with the job the API created, so the board can show it straight away. */
  onCreated: (job: any) => void;
}

const URGENCIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('metrofix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Dispatch raises a request on behalf of a customer, e.g. when they phone support instead of using the app. */
export function CreateRequestModal({ onClose, onCreated }: CreateRequestModalProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servicePillar, setServicePillar] = useState<ServicePillar>(ServicePillar.HARD);
  const [facilityType, setFacilityType] = useState<FacilityType>(FacilityType.COMMERCIAL);
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>('MEDIUM');
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/customers`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CustomerOption[]) => active && setCustomers(Array.isArray(data) ? data : []))
      .catch(() => active && setCustomersError('Could not load customers.'));
    return () => {
      active = false;
    };
  }, []);

  const matches = useMemo(() => {
    const q = customerQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 50);
    return customers
      .filter((c) =>
        [c.user?.fullName, c.companyName, c.user?.email, c.user?.phoneNumber].some((text) => (text ?? '').toLowerCase().includes(q)),
      )
      .slice(0, 50);
  }, [customers, customerQuery]);

  const pickCustomer = (customer: CustomerOption) => {
    setCustomerId(customer.id);
    if (customer.facilityType) setFacilityType(customer.facilityType);
    // Start the map at the customer's registered facility, if we have one.
    if (customer.latitude != null && customer.longitude != null && !location) {
      setLocation({ latitude: customer.latitude, longitude: customer.longitude });
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!customerId) return setError('Choose the customer this request is for.');
    if (title.trim().length < 3) return setError('Give the request a short title (3+ characters).');
    if (description.trim().length < 5) return setError('Describe the problem (5+ characters).');
    if (!location) return setError('Drop a pin on the map for the site location.');
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          servicePillar,
          facilityType,
          urgency,
          customerId,
          location,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || (body?.errors && Object.values(body.errors).flat().join(' '));
        throw new Error(message || 'The request could not be created.');
      }
      onCreated(await response.json());
      onClose();
    } catch (e: any) {
      setError(e?.message || 'The request could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  const selected = customers.find((c) => c.id === customerId);

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Create service request" className="metro-modal-overlay">
      <form style={styles.card} className="metro-modal-card" onSubmit={submit}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Support</div>
            <h3 style={styles.title}>New service request</h3>
          </div>
          <button type="button" style={styles.close} onClick={onClose}>
            Close
          </button>
        </div>

        <label style={styles.label}>Customer</label>
        {selected ? (
          <div style={styles.selected}>
            <span>
              <strong>{selected.companyName ? `${selected.companyName} · ` : ''}{selected.user?.fullName}</strong> · {selected.user?.email}
              {selected.user?.phoneNumber ? ` · ${selected.user.phoneNumber}` : ''}
            </span>
            <button type="button" style={styles.link} onClick={() => setCustomerId('')}>
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              type="search"
              style={styles.input}
              placeholder="Search customers by name, email or phone…"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              aria-label="Search customers"
            />
            <div style={styles.customerList} role="listbox" aria-label="Customers">
              {customersError && <div style={styles.muted}>{customersError}</div>}
              {!customersError && matches.length === 0 && <div style={styles.muted}>No customers match.</div>}
              {matches.map((customer) => (
                <button key={customer.id} type="button" role="option" aria-selected={false} style={styles.customerRow} onClick={() => pickCustomer(customer)}>
                  <strong>{customer.companyName ? `${customer.companyName} · ` : ''}{customer.user?.fullName ?? 'Customer'}</strong>
                  <span style={styles.muted}>
                    {customer.user?.email}
                    {customer.user?.phoneNumber ? ` · ${customer.user.phoneNumber}` : ''}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <label style={styles.label} htmlFor="req-title">Title</label>
        <input id="req-title" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AC not cooling in server room" maxLength={120} />

        <label style={styles.label} htmlFor="req-desc">Description</label>
        <textarea id="req-desc" style={{ ...styles.input, minHeight: 84, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is wrong, and anything the technician should know" />

        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label} htmlFor="req-pillar">Service</label>
            <select id="req-pillar" style={styles.input} value={servicePillar} onChange={(e) => setServicePillar(e.target.value as ServicePillar)}>
              <option value={ServicePillar.HARD}>Hard FM</option>
              <option value={ServicePillar.SOFT}>Soft FM</option>
              <option value={ServicePillar.STRATEGIC}>Strategic FM</option>
            </select>
          </div>
          <div style={styles.col}>
            <label style={styles.label} htmlFor="req-facility">Facility</label>
            <select id="req-facility" style={styles.input} value={facilityType} onChange={(e) => setFacilityType(e.target.value as FacilityType)}>
              <option value={FacilityType.RESIDENTIAL}>Residential</option>
              <option value={FacilityType.COMMERCIAL}>Commercial</option>
              <option value={FacilityType.INDUSTRIAL}>Industrial</option>
            </select>
          </div>
          <div style={styles.col}>
            <label style={styles.label} htmlFor="req-urgency">Urgency</label>
            <select id="req-urgency" style={styles.input} value={urgency} onChange={(e) => setUrgency(e.target.value as (typeof URGENCIES)[number])}>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>{u.charAt(0) + u.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={styles.label}>Site location</label>
        <MapPicker value={location} onChange={(picked) => setLocation(picked)} />

        {error && <div style={styles.error} role="alert">{error}</div>}

        <div style={styles.actions}>
          <button type="button" style={styles.close} onClick={onClose}>Cancel</button>
          <button type="submit" style={styles.primary} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create request'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(4, 10, 11, 0.62)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 99999 },
  card: { width: 'min(720px, 100%)', borderRadius: 24, background: 'var(--surface)', border: '1px solid var(--border-subtle)', padding: 20, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 72px rgba(0, 0, 0, 0.32)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 },
  kicker: { color: '#f38808', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.78rem', fontWeight: 700 },
  title: { margin: '4px 0 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 },
  close: { border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: '#f38808', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' },
  label: { display: 'block', margin: '14px 0 6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit' },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  col: { flex: '1 1 150px', minWidth: 0 },
  customerList: { marginTop: 8, maxHeight: 170, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 10, background: 'var(--surface-strong)' },
  customerRow: { display: 'flex', flexDirection: 'column', gap: 2, width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' },
  selected: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(243, 136, 8, 0.55)', background: 'var(--surface-strong)', color: 'var(--text-primary)', fontSize: '0.85rem' },
  link: { border: 'none', background: 'transparent', color: '#f38808', fontWeight: 700, cursor: 'pointer' },
  muted: { color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '8px 12px' },
  error: { marginTop: 14, color: '#ff8a80', fontSize: '0.85rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  primary: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#ffffff', padding: '10px 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' },
};
