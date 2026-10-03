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
  Gallery: undefined;
  Unsupported: undefined;
};
