import { MapPicker, type PickedLocation } from '../../components/MapPicker';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { FacilityType, ServicePillar } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import {
  PILLAR_BLURBS,
  PILLAR_LABELS,
  SERVICE_GROUP_LABELS,
  TIER_LABELS,
  formatLkr,
  type CatalogService,
} from '../../lib/catalog';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

// Feather icon names from the seed data -> an emoji so the portal needs no icon package.
const ICONS: Record<string, string> = {
  thermometer: '🌡️', zap: '⚡', droplet: '💧', cpu: '🖥️', home: '🏠', 'alert-triangle': '🧯',
  'arrow-up': '🛗', wind: '🧹', 'trash-2': '♻️', shield: '🛡️', sun: '🌿', coffee: '☕',
  package: '📦', 'battery-charging': '🔋', clipboard: '📋', 'bar-chart-2': '📊',
};

// Colombo, used when the browser cannot share a location.

type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PortalServicesProps {
  onRequested: () => void;
}

export function PortalServices({ onRequested }: PortalServicesProps) {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogService | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/services`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CatalogService[]) => active && setServices(data.filter((s) => s.status === 'Active')))
      .catch(() => active && setError('Could not load the service catalog. Please try again shortly.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const pillars = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = services.filter(
      (s) =>
        !q ||
        s.serviceName.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        (s.serviceGroup ? SERVICE_GROUP_LABELS[s.serviceGroup] : '').toLowerCase().includes(q),
    );
    return [ServicePillar.HARD, ServicePillar.SOFT, ServicePillar.STRATEGIC]
      .map((pillar) => ({ pillar, items: visible.filter((s) => s.pillarCategory === pillar) }))
      .filter((entry) => entry.items.length > 0);
  }, [services, query]);

  return (
    <section style={styles.page} aria-label="Browse services">
      <input
        type="search"
        placeholder="Search services…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.search}
        aria-label="Search services"
      />

      {loading && <p style={styles.muted}>Loading services…</p>}
      {error && <p style={styles.error}>{error}</p>}
      {!loading && !error && pillars.length === 0 && <p style={styles.muted}>No services match your search.</p>}

      {pillars.map(({ pillar, items }) => (
        <div key={pillar} style={styles.pillarBlock}>
          <header style={styles.pillarHeader}>
            <h2 style={styles.pillarTitle}>{PILLAR_LABELS[pillar]}</h2>
            <span style={styles.pillarBlurb}>{PILLAR_BLURBS[pillar]}</span>
          </header>
          <div style={styles.grid}>
            {items.map((service) => (
              <button
                key={service.id}
                type="button"
                style={styles.card}
                onClick={() => setSelected(service)}
                aria-label={`Request ${service.serviceName}`}
              >
                <span style={styles.cardIcon} aria-hidden="true">{ICONS[service.icon ?? ''] ?? '🔧'}</span>
                <span style={styles.cardBody}>
                  <span style={styles.cardTitle}>{service.serviceName}</span>
                  <span style={styles.cardDesc}>{service.description}</span>
                  <span style={styles.chips}>
                    <span style={styles.chip}>
                      {service.basePrice != null && !service.requiresQuote
                        ? `From ${formatLkr(service.basePrice)}`
                        : service.requiresQuote
                          ? 'Specialist · quoted'
                          : 'Priced per job'}
                    </span>
                    <span style={styles.chipMuted}>{TIER_LABELS[service.requiredSubscriptionTier]}+</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <RequestModal
          service={selected}
          onClose={() => setSelected(null)}
          onCreated={() => {
            setSelected(null);
            onRequested();
          }}
        />
      )}
    </section>
  );
}

interface RequestModalProps {
  service: CatalogService;
  onClose: () => void;
  onCreated: () => void;
}

function RequestModal({ service, onClose, onCreated }: RequestModalProps) {
  const modalRef = useModalAccessibility(true, onClose);
  const [details, setDetails] = useState('');
  const [address, setAddress] = useState('');
  const [facilityType, setFacilityType] = useState<FacilityType>(FacilityType.RESIDENTIAL);
  const [urgency, setUrgency] = useState<Urgency>('MEDIUM');
  const [coords, setCoords] = useState<PickedLocation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (details.trim().length < 5) return setError('Please describe the problem (at least 5 characters).');
    if (address.trim().length < 3) return setError('Please enter the site address.');
    if (!coords) return setError('Please drop a pin on the map for the site.');
    setBusy(true);
    setError(null);
    const token = localStorage.getItem('metrofix_token');
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: service.serviceName,
          description: `${details.trim()}\n\nSite address: ${address.trim()}`,
          servicePillar: service.pillarCategory,
          facilityType,
          // The API replaces this with the logged-in customer's own profile.
          customerId: 'self',
          location: coords,
          urgency,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Request failed (HTTP ${res.status}).`);
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-request-title"
        tabIndex={-1}
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="portal-request-title" style={styles.modalTitle}>Request: {service.serviceName}</h2>
        <p style={styles.modalSub}>{service.description}</p>
        {error && <p style={styles.error}>{error}</p>}

        <label style={styles.label} htmlFor="req-details">What needs attention? *</label>
        <textarea id="req-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} style={styles.input} />

        <label style={styles.label} htmlFor="req-address">Site address *</label>
        <input id="req-address" value={address} onChange={(e) => setAddress(e.target.value)} style={styles.input} />

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="req-facility">Facility type</label>
            <select id="req-facility" value={facilityType} onChange={(e) => setFacilityType(e.target.value as FacilityType)} style={styles.input}>
              <option value={FacilityType.RESIDENTIAL}>Residential</option>
              <option value={FacilityType.COMMERCIAL}>Commercial</option>
              <option value={FacilityType.INDUSTRIAL}>Industrial</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="req-urgency">Urgency</label>
            <select id="req-urgency" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)} style={styles.input}>
              <option value="LOW">Routine</option>
              <option value="MEDIUM">Standard</option>
              <option value="HIGH">Urgent</option>
              <option value="CRITICAL">Emergency</option>
            </select>
          </div>
        </div>

        <label style={styles.label}>Pin the site on the map *</label>
        <MapPicker
          value={coords}
          height={240}
          onChange={(picked, label) => {
            setCoords(picked);
            // A searched place fills the address if the customer has not typed one.
            if (label && label !== 'My location') setAddress((current) => current || label);
          }}
        />

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="button" style={styles.submitBtn} onClick={submit} disabled={busy}>
            {busy ? 'Sending…' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 4px 32px' },
  search: { padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text-primary)', maxWidth: 420 },
  muted: { color: 'var(--text-muted)' },
  error: { color: '#c62828', fontWeight: 600 },
  pillarBlock: { display: 'flex', flexDirection: 'column', gap: 10 },
  pillarHeader: { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  pillarTitle: { margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' },
  pillarBlurb: { color: 'var(--text-secondary)', fontSize: '0.85rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 },
  card: { display: 'flex', gap: 12, textAlign: 'left', padding: 14, borderRadius: 16, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-elevated)', cursor: 'pointer' },
  cardIcon: { fontSize: '1.6rem', lineHeight: 1 },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  cardTitle: { fontWeight: 800 },
  cardDesc: { fontSize: '0.83rem', color: 'var(--text-secondary)' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(243,136,8,0.14)', color: '#d37105' },
  chipMuted: { fontSize: '0.74rem', padding: '3px 8px', borderRadius: 999, background: 'var(--surface-strong)', color: 'var(--text-secondary)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16 },
  modal: { background: '#2b435f', color: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { margin: 0, fontSize: '1.2rem' },
  modalSub: { margin: '0 0 6px', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' },
  label: { fontSize: '0.84rem', fontWeight: 600 },
  input: { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', width: '100%' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  linkBtn: { alignSelf: 'flex-start', background: 'none', border: 'none', color: '#f38808', fontWeight: 700, cursor: 'pointer', padding: 0 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  submitBtn: { background: '#f38808', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
};
