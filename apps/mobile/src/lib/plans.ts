import type { BillingCycle } from '@metro-fix/core-types';

export const formatLkr = (value: number): string => `LKR ${Math.round(value).toLocaleString('en-US')}`;

export const tierLabel = (tier: string): string => tier.charAt(0) + tier.slice(1).toLowerCase();

export type PlanIntent = 'Subscribe' | 'Upgrade' | 'Downgrade' | 'Switch' | 'Switch billing';

/** The verb for moving from the current plan to another: subscribe, upgrade, downgrade or switch. */
export function planIntent(
  current: { tier: string | null; cycle: BillingCycle | null } | null,
  target: { tierName: string; monthlyFeeLkr: number | null },
  currentMonthlyFee: number | null,
): PlanIntent {
  if (!current?.tier) return 'Subscribe';
  if (current.tier === target.tierName) return 'Switch billing';
  if (currentMonthlyFee === null || target.monthlyFeeLkr === null) return 'Switch';
  return target.monthlyFeeLkr > currentMonthlyFee ? 'Upgrade' : 'Downgrade';
}

/** Price for the chosen billing cycle, or null if the plan is not offered that way. */
export function priceFor(
  plan: { monthlyFeeLkr: number | null; annualFeeLkr: number | null },
  cycle: BillingCycle,
): number | null {
  return cycle === 'ANNUAL' ? plan.annualFeeLkr : plan.monthlyFeeLkr;
}
