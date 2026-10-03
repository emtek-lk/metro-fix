import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { BillingCycle, CustomerSubscription } from '@metro-fix/core-types';
import { SkeletonCards } from '@metro-fix/ui';
import { API_BASE_URL } from '../../lib/api';
import { CheckoutModal, formatLkr } from './CheckoutModal';

interface Plan {
  id: string;
  tierName: string;
  targetCustomer?: string | null;
  monthlyFeeLkr: number | null;
  annualFeeLkr: number | null;
  isCustomPriced: boolean;
  includedVisitsPerMonth?: number | null;
  includedLabourHoursPerMonth?: number | null;
  labourDiscountPct: number;
  inspectionCadence: string;
  callOutWaived: boolean;
  includedServices?: string;
  status: string;
}

interface PlanPickerProps {
  /** The plan the customer is on now, or null if they have none yet. */
  currentTier: string | null;
  currentCycle?: BillingCycle | null;
  /** Token to pay with while the account is still being set up. */
  token?: string | null;
  onSubscribed: (subscription: CustomerSubscription) => void;
  onDeclined?: (message: string) => void;
}

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/** Plan cards with a monthly / annual switch. Choosing one opens the card checkout. */
import { useAppSettings } from '../../lib/settings';

export function PlanPicker({ currentTier, currentCycle, token, onSubscribed, onDeclined }: PlanPickerProps) {
  const app = useAppSettings();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>(currentCycle ?? 'MONTHLY');
  const [checkout, setCheckout] = useState<{ plan: Plan; intent: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/subscriptions`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Plan[]) => active && setPlans(data.filter((plan) => plan.status === 'Active')))
      .catch(() => active && setError('Could not load the plans. Check your connection and try again.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const currentFee = useMemo(
    () => plans.find((plan) => plan.tierName === currentTier)?.monthlyFeeLkr ?? null,
    [plans, currentTier],
  );

  const intentFor = (plan: Plan) => {
    if (!currentTier) return 'Subscribe';
    if (currentFee === null || plan.monthlyFeeLkr === null) return 'Switch';
    return plan.monthlyFeeLkr > currentFee ? 'Upgrade' : 'Downgrade';
  };

  if (loading) return <SkeletonCards count={2} height={220} />;
  if (error) return <p style={styles.error} role="alert">{error}</p>;

  return (
    <div>
      <div style={styles.cycleSwitch} role="group" aria-label="Billing cycle">
        {(['MONTHLY', 'ANNUAL'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={cycle === value}
            onClick={() => setCycle(value)}
            style={{ ...styles.cycleBtn, ...(cycle === value ? styles.cycleBtnActive : undefined) }}
          >
            {value === 'MONTHLY' ? 'Monthly' : 'Annual · save ~2 months'}
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {plans.map((plan) => {
          const isCurrent = plan.tierName === currentTier && (currentCycle ?? cycle) === cycle;
          const sameTierOtherCycle = plan.tierName === currentTier && !isCurrent;
          const price = cycle === 'ANNUAL' ? plan.annualFeeLkr : plan.monthlyFeeLkr;
          const intent = sameTierOtherCycle ? 'Switch billing' : intentFor(plan);
          const features = (plan.includedServices ?? '').split(';').map((f) => f.trim()).filter(Boolean);
          return (
            <article key={plan.id} style={{ ...styles.plan, ...(isCurrent ? styles.planCurrent : undefined) }} aria-label={`${titleCase(plan.tierName)} plan`}>
              {isCurrent && <span style={styles.currentBadge}>Your plan</span>}
              <h3 style={styles.planName}>{titleCase(plan.tierName)}</h3>
              <div style={styles.target}>{plan.targetCustomer}</div>
              <div style={styles.price}>
                {plan.isCustomPriced ? (
                  <>
                    <span style={styles.from}>from</span> {formatLkr(plan.monthlyFeeLkr ?? 0)}
                    <span style={styles.per}>/month</span>
                  </>
                ) : price === null ? (
                  <span style={styles.muted}>Not offered {cycle === 'ANNUAL' ? 'annually' : 'monthly'}</span>
                ) : (
                  <>
                    {formatLkr(price)}
                    <span style={styles.per}>/{cycle === 'ANNUAL' ? 'year' : 'month'}</span>
                  </>
                )}
              </div>
              <ul style={styles.features}>
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {plan.isCustomPriced ? (
                <a href={`mailto:${app.supportEmail}?subject=Business%20plan%20quote`} style={styles.contact}>
                  Contact us for a quote
                </a>
              ) : (
                <button
                  type="button"
                  style={{ ...styles.choose, ...(isCurrent || price === null ? styles.chooseDisabled : undefined) }}
                  disabled={isCurrent || price === null}
                  onClick={() => setCheckout({ plan, intent })}
                >
                  {isCurrent ? 'Current plan' : `${intent}`}
                </button>
              )}
            </article>
          );
        })}
      </div>

      {checkout && (
        <CheckoutModal
          plan={checkout.plan}
          billingCycle={cycle}
          intent={checkout.intent}
          token={token}
          onDeclined={onDeclined}
          onClose={() => setCheckout(null)}
          onSuccess={(subscription) => {
            setCheckout(null);
            onSubscribed(subscription);
          }}
        />
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  muted: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
  error: { color: '#ff8a80', fontSize: '0.9rem' },
  cycleSwitch: { display: 'inline-flex', padding: 4, borderRadius: 999, borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)', background: 'var(--surface-strong)', marginBottom: 18, gap: 4 },
  cycleBtn: { border: 'none', background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 999, fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' },
  cycleBtnActive: { background: '#f38808', color: '#ffffff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 },
  plan: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, padding: 18, borderRadius: 18, borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)', background: 'var(--surface)' },
  planCurrent: { borderColor: '#f38808', boxShadow: '0 0 0 1px #f38808 inset' },
  currentBadge: { position: 'absolute', top: 12, right: 12, background: '#f38808', color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700 },
  planName: { margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' },
  target: { color: 'var(--text-secondary)', fontSize: '0.8rem', minHeight: 32 },
  price: { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' },
  from: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' },
  per: { fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 2 },
  features: { margin: '4px 0 10px', paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, flex: 1 },
  choose: { borderWidth: '1px', borderStyle: 'solid', borderColor: '#d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#fff', padding: '10px 14px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' },
  chooseDisabled: { opacity: 0.55, cursor: 'default', background: 'var(--surface-strong)', color: 'var(--text-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)' },
  contact: { textAlign: 'center', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(243,136,8,0.55)', color: '#f38808', padding: '10px 14px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' },
};
