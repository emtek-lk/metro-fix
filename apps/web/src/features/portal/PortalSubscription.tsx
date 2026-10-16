import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import type { CustomerSubscription } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { RefreshButton } from '../../components/RefreshButton';
import { PlanPicker } from '../subscriptions/PlanPicker';
import { formatLkr } from '../subscriptions/CheckoutModal';

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/** The customer's plan: what they have, change it (upgrade or downgrade), and what they were charged. */
export function PortalSubscription({
  onChanged,
  onDeclined,
}: {
  onChanged?: (subscription: CustomerSubscription) => void;
  onDeclined?: (message: string) => void;
}) {
  const [subscription, setSubscription] = useState<CustomerSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem('metrofix_token');
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/subscriptions/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CustomerSubscription) => setSubscription(data))
      .catch(() => setError('Could not load your subscription.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleSubscribed = (next: CustomerSubscription) => {
    setSubscription(next);
    onChanged?.(next);
  };

  return (
    <section style={styles.page} aria-label="Subscription">
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.heading}>Your subscription</h2>
          <p style={styles.muted}>A plan is needed to raise service requests. Change it any time.</p>
        </div>
        <RefreshButton onClick={load} loading={loading} subject="subscription" />
      </div>

      {error && <p style={styles.error} role="alert">{error}</p>}

      {subscription && (
        <div style={subscription.tier ? styles.summary : { ...styles.summary, ...styles.summaryNone }}>
          {subscription.tier ? (
            <>
              <div>
                <div style={styles.summaryLabel}>Current plan</div>
                <div style={styles.summaryValue}>{titleCase(subscription.tier)}</div>
              </div>
              <div>
                <div style={styles.summaryLabel}>Billing</div>
                <div style={styles.summaryValue}>{subscription.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'}</div>
              </div>
              <div>
                <div style={styles.summaryLabel}>Since</div>
                <div style={styles.summaryValue}>
                  {subscription.subscribedAt ? new Date(subscription.subscribedAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </>
          ) : (
            <div>
              <div style={styles.summaryValue}>No plan yet</div>
              <div style={styles.muted}>Pick a plan below to start raising service requests.</div>
            </div>
          )}
        </div>
      )}

      {subscription && (
        <PlanPicker
          currentTier={subscription.tier}
          currentCycle={subscription.billingCycle}
          onSubscribed={handleSubscribed}
          onDeclined={onDeclined}
        />
      )}

      {subscription && subscription.payments.length > 0 && (
        <div style={styles.history}>
          <h3 style={styles.subheading}>Payment history</h3>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Card</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscription.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={styles.td}>{new Date(payment.createdAt).toLocaleString()}</td>
                    <td style={styles.td}>{titleCase(payment.tier)} · {payment.billingCycle === 'ANNUAL' ? 'annual' : 'monthly'}</td>
                    <td style={styles.td}>{titleCase(payment.cardBrand)} ···· {payment.cardLast4}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{formatLkr(payment.amountLkr)}</td>
                    <td style={{ ...styles.td, color: payment.status === 'SUCCEEDED' ? '#4ade80' : '#ff8a80', fontWeight: 600 }}>
                      {payment.status === 'SUCCEEDED' ? 'Paid' : 'Declined'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 4px 32px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  heading: { margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)' },
  subheading: { margin: '0 0 10px', fontSize: '1rem', color: 'var(--text-primary)' },
  muted: { color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0' },
  error: { color: '#ff8a80' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 18, padding: 18, borderRadius: 16, borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)', background: 'var(--surface)' },
  summaryNone: { borderColor: 'rgba(243, 136, 8, 0.6)', background: 'rgba(243, 136, 8, 0.08)' },
  summaryLabel: { fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700 },
  summaryValue: { fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 },
  history: { marginTop: 8 },
  tableWrap: { overflowX: 'auto', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' },
  td: { padding: '10px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' },
};
