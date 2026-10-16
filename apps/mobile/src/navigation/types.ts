import type { ServiceRequest } from '@metro-fix/core-types';

/** Every screen that can be pushed, across all roles. A role only registers the ones it can reach. */
export type RootStackParamList = {
  // Signed out
  Login: undefined;
  Register: undefined;
  // Signed in
  Main: undefined;
  JobDetail: { job: ServiceRequest };
  Tracking: { job: ServiceRequest };
  /** The customer's plans. `onboarding` is the step right after sign-up (with Skip). */
  Plans: { onboarding?: boolean } | undefined;
  Checkout: { tier: string; cycle: 'MONTHLY' | 'ANNUAL'; amountLkr: number; intent: string; onboarding?: boolean };
  Gallery: undefined;
  /** Voluntary password change (Profile). The forced first-sign-in version is not a pushed screen. */
  ChangePassword: undefined;
  Unsupported: undefined;
};
