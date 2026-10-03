import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import {
  cardDigits,
  detectCardBrand,
  formatCardExpiry,
  formatCardNumber,
  isValidCardCvc,
  isValidCardExpiry,
  isValidCardNumber,
  type BillingCycle,
  type CheckoutInput,
  type CustomerSubscription,
} from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';

export interface PlanSummary {
  tierName: string;
  monthlyFeeLkr: number | null;
  annualFeeLkr: number | null;
}

interface CheckoutModalProps {
  plan: PlanSummary;
  billingCycle: BillingCycle;
  /** "Upgrade", "Downgrade" or "Subscribe": only wording. */
  intent: string;
  /** Used instead of the stored login while a new account is still being set up. */
  token?: string | null;
  onClose: () => void;
  onSuccess: (subscription: CustomerSubscription) => void;
  /** Also told when the card is declined, so the page can raise a toast on top of the inline message. */
  onDeclined?: (message: string) => void;
}

export const formatLkr = (value: number) => `LKR ${value.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const BRAND_LABEL = { VISA: 'VISA', MASTERCARD: 'Mastercard', AMEX: 'AMEX', UNKNOWN: 'Card' } as const;

/**
 * A demo card checkout. It looks and validates like a real one, but nothing is charged: the API's
 * demo gateway approves any valid card number. 4242 4242 4242 4242 works; 4000 0000 0000 0002 is declined.
 */
export function CheckoutModal({ plan, billingCycle, intent, token, onClose, onSuccess, onDeclined }: CheckoutModalProps) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = billingCycle === 'ANNUAL' ? plan.annualFeeLkr : plan.monthlyFeeLkr;
  const brand = detectCardBrand(number);
  const problems = useMemo(
    () => ({
      number: isValidCardNumber(number) ? null : 'Enter a valid card number.',
      name: name.trim() ? null : 'Enter the name on the card.',
      expiry: isValidCardExpiry(expiry) ? null : 'Use a future date as MM/YY.',
      cvc: isValidCardCvc(cvc, brand) ? null : brand === 'AMEX' ? 'Enter the 4-digit code.' : 'Enter the 3-digit code.',
    }),
    [number, name, expiry, cvc, brand],
  );
  const show = (field: keyof typeof problems) => (touched[field] ? problems[field] : null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ number: true, name: true, expiry: true, cvc: true });
    if (Object.values(problems).some(Boolean)) return;
    setBusy(true);
    setError(null);
    const bearer = token ?? localStorage.getItem('metrofix_token');
    const body: CheckoutInput = {
      tier: plan.tierName as CheckoutInput['tier'],
      billingCycle,
      card: { number: cardDigits(number), name: name.trim(), expiry, cvc },
    };
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'The payment could not be completed.');
      onSuccess(data as CustomerSubscription);
    } catch (e: any) {
      const message = e?.message || 'The payment could not be completed.';
      setError(message);
      onDeclined?.(message);
    } finally {
      setBusy(false);
    }
  };

  const fieldStyle = (field: keyof typeof problems): CSSProperties => ({
    ...styles.input,
    ...(show(field) ? { borderColor: '#ff8a80' } : undefined),
  });

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={`${intent} ${plan.tierName}`}>
      <form style={styles.card} onSubmit={submit} noValidate>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Secure checkout · demo</div>
            <h3 style={styles.title}>
              {intent} to {plan.tierName.charAt(0) + plan.tierName.slice(1).toLowerCase()}
            </h3>
          </div>
          <button type="button" style={styles.close} onClick={onClose}>Close</button>
        </div>

        <div style={styles.preview} aria-hidden="true">
          <div style={styles.previewBrand}>{BRAND_LABEL[brand]}</div>
          <div style={styles.previewNumber}>{formatCardNumber(number) || '•••• •••• •••• ••••'}</div>
          <div style={styles.previewRow}>
            <span>{name.trim() || 'NAME ON CARD'}</span>
            <span>{expiry || 'MM/YY'}</span>
          </div>
        </div>

        <label style={styles.label} htmlFor="card-number">Card number</label>
        <input
          id="card-number"
          style={fieldStyle('number')}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          value={formatCardNumber(number)}
          onChange={(e) => setNumber(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, number: true }))}
        />
        {show('number') && <div style={styles.fieldError}>{show('number')}</div>}

        <label style={styles.label} htmlFor="card-name">Name on card</label>
        <input
          id="card-name"
          style={fieldStyle('name')}
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
        />
        {show('name') && <div style={styles.fieldError}>{show('name')}</div>}

        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label} htmlFor="card-expiry">Expiry</label>
            <input
              id="card-expiry"
              style={fieldStyle('expiry')}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatCardExpiry(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
            />
            {show('expiry') && <div style={styles.fieldError}>{show('expiry')}</div>}
          </div>
          <div style={styles.col}>
            <label style={styles.label} htmlFor="card-cvc">Security code</label>
            <input
              id="card-cvc"
              style={fieldStyle('cvc')}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={brand === 'AMEX' ? '1234' : '123'}
              value={cvc}
              maxLength={4}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
              onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
            />
            {show('cvc') && <div style={styles.fieldError}>{show('cvc')}</div>}
          </div>
        </div>

        <div style={styles.hint}>
          Demo mode: no money moves. Use <code>4242 4242 4242 4242</code> with any future date and code.
          <code> 4000 0000 0000 0002</code> is declined.
        </div>

        {error && <div style={styles.error} role="alert">{error}</div>}

        <div style={styles.actions}>
          <button type="button" style={styles.close} onClick={onClose}>Cancel</button>
          <button type="submit" style={styles.pay} disabled={busy || price === null}>
            {busy ? 'Processing…' : price === null ? 'Unavailable' : `Pay ${formatLkr(price)}`}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(4, 10, 11, 0.7)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 100000 },
  card: { width: 'min(460px, 100%)', borderRadius: 22, background: 'var(--surface)', border: '1px solid var(--border-subtle)', padding: 22, boxSizing: 'border-box', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 72px rgba(0, 0, 0, 0.4)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
  kicker: { color: '#f38808', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.74rem', fontWeight: 700 },
  title: { margin: '4px 0 0', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 },
  close: { border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: '#f38808', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' },
  preview: { background: 'linear-gradient(135deg, #2b435f, #1b2b40)', color: '#fff', borderRadius: 16, padding: 18, marginBottom: 6, boxShadow: '0 10px 24px rgba(0,0,0,0.3)' },
  previewBrand: { fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.9rem', color: '#f38808' },
  previewNumber: { fontSize: '1.25rem', letterSpacing: '0.12em', margin: '18px 0 14px', fontVariantNumeric: 'tabular-nums' },
  previewRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.9 },
  label: { display: 'block', margin: '12px 0 6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'inherit' },
  fieldError: { color: '#ff8a80', fontSize: '0.78rem', marginTop: 4 },
  row: { display: 'flex', gap: 12 },
  col: { flex: 1, minWidth: 0 },
  hint: { marginTop: 14, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
  error: { marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255, 138, 128, 0.12)', color: '#ff8a80', fontSize: '0.85rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  pay: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#ffffff', padding: '10px 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' },
};
