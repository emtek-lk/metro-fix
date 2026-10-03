import { MapPicker, type PickedLocation } from '../../components/MapPicker';
import { RefreshButton } from '../../components/RefreshButton';
import { SkeletonCards, useMediaQuery } from '@metro-fix/ui';
import { useAppSettings } from '../../lib/settings';
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
  /** Takes the customer to the Subscription page. */
  onNeedSubscription: () => void;
}

export function PortalServices({ onRequested, onNeedSubscription }: PortalServicesProps) {
  const app = useAppSettings();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [pillarFilter, setPillarFilter] = useState<ServicePillar | 'ALL'>('ALL');
  const [services, setServices] = useState<CatalogService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogService | null>(null);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('metrofix_token');
    fetch(`${API_BASE_URL}/subscriptions/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => active && setSubscribed(data ? Boolean(data.tier) || !app.requirePlanToRequest : null))
      .catch(() => active && setSubscribed(null));
    return () => {
      active = false;
    };
  }, [reloadKey, app.requirePlanToRequest]);

  useEffect(() => {
    let active = true;
    setLoading(true);
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
  }, [reloadKey]);

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
      .filter((pillar) => pillarFilter === 'ALL' || pillar === pillarFilter)
      .map((pillar) => ({ pillar, items: visible.filter((s) => s.pillarCategory === pillar) }))
      .filter((entry) => entry.items.length > 0);
  }, [services, query, pillarFilter]);

  return (
    <section style={styles.page} aria-label="Browse services">
      {subscribed === false && (
        <div style={styles.planBanner} role="status">
          <span>
            <strong>Choose a plan to raise requests.</strong> You can browse services now, but a subscription is needed to request one.
          </span>
          <button type="button" style={styles.planBannerBtn} onClick={onNeedSubscription}>
            View plans
          </button>
        </div>
      )}
      <div style={styles.searchRow}>
        <input
          type="search"
          placeholder="Search services…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.search}
          aria-label="Search services"
        />
        <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={loading} subject="services" />
      </div>

      <div style={styles.chipRow} role="group" aria-label="Filter by type of service">
        {([['ALL', 'All'], [ServicePillar.HARD, 'Hard FM'], [ServicePillar.SOFT, 'Soft FM'], [ServicePillar.STRATEGIC, 'Strategic FM']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={pillarFilter === value}
            onClick={() => setPillarFilter(value)}
            style={{ ...styles.filterChip, ...(pillarFilter === value ? styles.filterChipActive : undefined) }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && services.length === 0 && <SkeletonCards count={4} height={110} />}
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
                onClick={() => (subscribed === false ? setGateOpen(true) : setSelected(service))}
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

      {gateOpen && (
        <div style={styles.gateOverlay} role="dialog" aria-modal="true" aria-label="Subscription required">
          <div style={styles.gateCard}>
            <h3 style={styles.gateTitle}>Subscription required</h3>
            <p style={styles.gateCopy}>
              Requests are available on a paid plan. Pick one in a minute and come straight back.
            </p>
            <div style={styles.gateActions}>
              <button type="button" style={styles.gateSecondary} onClick={() => setGateOpen(false)}>Not now</button>
              <button type="button" style={styles.gatePrimary} onClick={onNeedSubscription}>View plans</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <RequestModal
          service={selected}
          onClose={() => setSelected(null)}
          onNeedSubscription={onNeedSubscription}
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
  onNeedSubscription: () => void;
  onClose: () => void;
  onCreated: () => void;
}

function RequestModal({ service, onClose, onCreated, onNeedSubscription }: RequestModalProps) {
  const [needsPlan, setNeedsPlan] = useState(false);
  const isPhone = useMediaQuery('(max-width: 640px)');
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
        if (res.status === 402 && body?.code === 'SUBSCRIPTION_REQUIRED') {
          setNeedsPlan(true);
          throw new Error(body.message);
        }
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
    <div style={{ ...styles.overlay, ...(isPhone ? styles.overlayPhone : undefined) }} onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-request-title"
        tabIndex={-1}
        style={{ ...styles.modal, ...(isPhone ? styles.modalPhone : undefined) }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={styles.modalHead}>
          <div style={{ minWidth: 0 }}>
            <h2 id="portal-request-title" style={styles.modalTitle}>Request: {service.serviceName}</h2>
            <p style={styles.modalSub}>{service.description}</p>
          </div>
          <button type="button" aria-label="Close" style={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        <div style={styles.modalBody}>
          {error && <p style={styles.error} role="alert">{error}</p>}
          {needsPlan && (
            <button type="button" style={styles.submitBtn} onClick={onNeedSubscription}>
              View plans
            </button>
          )}

          <label style={styles.label} htmlFor="req-details">What needs attention? *</label>
          <textarea id="req-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} style={styles.input} />

          <label style={styles.label} htmlFor="req-address">Site address *</label>
          <input id="req-address" value={address} onChange={(e) => setAddress(e.target.value)} style={styles.input} autoComplete="street-address" />

          <div style={{ ...styles.row, ...(isPhone ? styles.rowPhone : undefined) }}>
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
            height={isPhone ? 220 : 260}
            onChange={(picked, label) => {
              setCoords(picked);
              // A searched place fills the address if the customer has not typed one.
              if (label && label !== 'My location') setAddress((current) => current || label);
            }}
          />
        </div>

        <footer style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="button" style={styles.submitBtn} onClick={submit} disabled={busy}>
            {busy ? 'Sending…' : 'Submit request'}
          </button>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 16 },
  searchRow: { display: 'flex', gap: 10, alignItems: 'center' },
  search: { flex: '1 1 160px', minWidth: 0, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '1rem' },
  chipRow: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, margin: '0 -16px', padding: '0 16px 2px', scrollbarWidth: 'none' },
  filterChip: { flexShrink: 0, minHeight: 40, padding: '0 16px', borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  filterChipActive: { background: '#f38808', borderColor: '#f38808', color: '#fff' },
  planBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(243, 136, 8, 0.6)', background: 'rgba(243, 136, 8, 0.1)', color: 'var(--text-primary)', fontSize: '0.9rem' },
  planBannerBtn: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#fff', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', minHeight: 40 },
  gateOverlay: { position: 'fixed', inset: 0, background: 'rgba(4, 10, 11, 0.62)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 99999 },
  gateCard: { width: 'min(420px, 100%)', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border-subtle)', padding: 22, boxShadow: '0 30px 72px rgba(0,0,0,0.35)' },
  gateTitle: { margin: '0 0 8px', color: 'var(--text-primary)' },
  gateCopy: { margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 },
  gateActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  gateSecondary: { border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', padding: '9px 14px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' },
  gatePrimary: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#fff', padding: '9px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' },
  muted: { color: 'var(--text-muted)' },
  error: { color: '#c62828', fontWeight: 600 },
  pillarBlock: { display: 'flex', flexDirection: 'column', gap: 10 },
  pillarHeader: { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  pillarTitle: { margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' },
  pillarBlurb: { color: 'var(--text-secondary)', fontSize: '0.85rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12 },
  card: { display: 'flex', gap: 12, textAlign: 'left', padding: 14, borderRadius: 16, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-elevated)', cursor: 'pointer' },
  cardIcon: { fontSize: '1.6rem', lineHeight: 1 },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  cardTitle: { fontWeight: 800 },
  cardDesc: { fontSize: '0.83rem', color: 'var(--text-secondary)' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(243,136,8,0.14)', color: '#d37105' },
  chipMuted: { fontSize: '0.74rem', padding: '3px 8px', borderRadius: 999, background: 'var(--surface-strong)', color: 'var(--text-secondary)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(4, 10, 11, 0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16 },
  overlayPhone: { alignItems: 'flex-end', padding: 0 },
  modal: { background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 20, width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', maxHeight: '92dvh', overflow: 'hidden', boxShadow: '0 30px 72px rgba(0,0,0,0.35)' },
  modalPhone: { maxWidth: '100%', maxHeight: '96dvh', borderRadius: '20px 20px 0 0', borderBottom: 'none' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '18px 18px 12px', borderBottom: '1px solid var(--border-subtle)' },
  modalBody: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 },
  modalTitle: { margin: 0, fontSize: '1.15rem' },
  modalSub: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.45 },
  closeBtn: { flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'pointer' },
  label: { fontSize: '0.84rem', fontWeight: 600, marginTop: 6 },
  input: { flexShrink: 0, minHeight: 46, padding: '12px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box', width: '100%' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  rowPhone: { gridTemplateColumns: '1fr' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  linkBtn: { alignSelf: 'flex-start', background: 'none', border: 'none', color: '#f38808', fontWeight: 700, cursor: 'pointer', padding: 0 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 18px calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface)' },
  cancelBtn: { background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '12px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, minHeight: 44 },
  submitBtn: { background: '#f38808', border: 'none', color: '#fff', padding: '12px 22px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, minHeight: 44 },
};
