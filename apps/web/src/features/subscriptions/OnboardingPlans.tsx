import type { CSSProperties } from 'react';
import { BrandLogo } from '@metro-fix/ui';
import type { CustomerSubscription } from '@metro-fix/core-types';
import { PlanPicker } from './PlanPicker';

interface OnboardingPlansProps {
  firstName: string;
  token: string;
  /** Called after paying, or with null when the customer skips. */
  onDone: (subscription: CustomerSubscription | null) => void;
}

/** Step two of sign-up: the account already exists (as a lead); pick a plan now or skip. */
export function OnboardingPlans({ firstName, token, onDone }: OnboardingPlansProps) {
  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <header style={styles.header}>
          <img src={BrandLogo} alt="METRO-FIX" style={styles.logo} />
          <button type="button" style={styles.skip} onClick={() => onDone(null)}>
            Skip for now
          </button>
        </header>

        <h1 style={styles.title}>Welcome, {firstName}. Choose your plan</h1>
        <p style={styles.copy}>
          A plan lets you raise service requests and unlocks priority dispatch and discounts. You can
          skip this and subscribe later from <strong>Subscription</strong> in the menu, but you will need a plan
          before you can raise a request.
        </p>

        <PlanPicker currentTier={null} token={token} onSubscribed={(subscription) => onDone(subscription)} />

        <div style={styles.footer}>
          <button type="button" style={styles.skipLink} onClick={() => onDone(null)}>
            I’ll choose a plan later
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  screen: { minHeight: '100vh', overflowY: 'auto', background: 'var(--surface-strong)', display: 'flex', justifyContent: 'center', padding: '32px 16px', boxSizing: 'border-box' },
  card: { width: 'min(1040px, 100%)', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 24, padding: 28, boxSizing: 'border-box', height: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logo: { height: 44, width: 'auto' },
  skip: { border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: 999, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' },
  title: { margin: '0 0 8px', fontSize: '1.6rem', color: 'var(--text-primary)' },
  copy: { margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.55, maxWidth: 720 },
  footer: { display: 'flex', justifyContent: 'center', marginTop: 22 },
  skipLink: { border: 'none', background: 'transparent', color: '#f38808', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
};
