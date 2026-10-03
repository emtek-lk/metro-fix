import { planIntent, priceFor, formatLkr, tierLabel } from '../src/lib/plans';
import { isSubscriptionRequired } from '../src/lib/errors';
import {
  detectCardBrand,
  formatCardExpiry,
  formatCardNumber,
  isValidCardCvc,
  isValidCardExpiry,
  isValidCardNumber,
} from '@metro-fix/core-types';

const plan = (tierName: string, monthlyFeeLkr: number | null, annualFeeLkr: number | null = null) => ({ tierName, monthlyFeeLkr, annualFeeLkr });

describe('plan changes', () => {
  it('says subscribe until the customer has a plan', () => {
    expect(planIntent({ tier: null, cycle: null }, plan('ESSENTIAL', 3500), null)).toBe('Subscribe');
    expect(planIntent(null, plan('ESSENTIAL', 3500), null)).toBe('Subscribe');
  });

  it('tells upgrade, downgrade and billing switches apart', () => {
    const current = { tier: 'ESSENTIAL', cycle: 'MONTHLY' as const };
    expect(planIntent(current, plan('PLUS', 7500), 3500)).toBe('Upgrade');
    expect(planIntent(current, plan('ACCESS', 1500), 3500)).toBe('Downgrade');
    expect(planIntent(current, plan('ESSENTIAL', 3500), 3500)).toBe('Switch billing');
  });

  it('prices by billing cycle and formats LKR', () => {
    expect(priceFor(plan('PLUS', 7500, 75000), 'ANNUAL')).toBe(75000);
    expect(priceFor(plan('BUSINESS', 15000, null), 'ANNUAL')).toBeNull();
    expect(formatLkr(7500)).toBe('LKR 7,500');
    expect(tierLabel('ESSENTIAL')).toBe('Essential');
  });
});

describe('card input helpers', () => {
  it('validates numbers with the Luhn check and knows the brand', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true);
    expect(isValidCardNumber('4242 4242 4242 4241')).toBe(false);
    expect(detectCardBrand('5555 5555 5555 4444')).toBe('MASTERCARD');
    expect(detectCardBrand('3782 822463 10005')).toBe('AMEX');
  });

  it('formats as the customer types', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
    expect(formatCardExpiry('1230')).toBe('12/30');
    expect(formatCardExpiry('1')).toBe('1');
  });

  it('accepts a future expiry and rejects past or impossible ones', () => {
    const now = new Date('2026-10-04');
    expect(isValidCardExpiry('10/26', now)).toBe(true);
    expect(isValidCardExpiry('09/26', now)).toBe(false);
    expect(isValidCardExpiry('13/30', now)).toBe(false);
    expect(isValidCardCvc('123')).toBe(true);
    expect(isValidCardCvc('123', 'AMEX')).toBe(false);
  });
});

describe('subscription gate errors', () => {
  it('recognises the API refusing a request for lack of a plan', () => {
    const error = { response: { status: 402, data: { code: 'SUBSCRIPTION_REQUIRED' } } };
    expect(isSubscriptionRequired(error)).toBe(true);
    expect(isSubscriptionRequired({ response: { status: 402, data: { message: 'Your card was declined.' } } })).toBe(false);
    expect(isSubscriptionRequired(new Error('x'))).toBe(false);
  });
});

describe('customer status alerts', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { statusChangeAlert } = require('../src/lib/trackingCopy');
  const job = (status: string, name?: string) => ({ title: 'Leaky tap', status, worker: name ? { user: { fullName: name } } : null });

  it('tells the customer when a request moves on, naming the technician', () => {
    expect(statusChangeAlert('PENDING_ACCEPTANCE', job('ASSIGNED', 'Carlos Rivera'))).toEqual({
      title: 'Leaky tap: Technician confirmed',
      message: 'Carlos Rivera has accepted your job and will head to you soon.',
    });
  });

  it('stays quiet when nothing changed or the request is new to this device', () => {
    expect(statusChangeAlert('ASSIGNED', job('ASSIGNED'))).toBeNull();
    expect(statusChangeAlert(undefined, job('ASSIGNED'))).toBeNull();
  });
});
