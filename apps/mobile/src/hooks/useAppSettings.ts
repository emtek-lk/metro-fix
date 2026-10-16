import { useQuery } from '@tanstack/react-query';
import { DEFAULT_APP_SETTINGS, OFFER_TIMEOUT_SECONDS, type SignedInAppSettings } from '@metro-fix/core-types';
import { apiService } from '../services/api';

/** Built-in values, used until the answer arrives or when the API cannot be reached. */
export const FALLBACK_APP_SETTINGS: SignedInAppSettings = {
  companyName: DEFAULT_APP_SETTINGS.company.name,
  supportEmail: DEFAULT_APP_SETTINGS.company.supportEmail,
  supportPhone: DEFAULT_APP_SETTINGS.company.supportPhone,
  passwordMinLength: DEFAULT_APP_SETTINGS.security.passwordMinLength,
  currency: 'LKR',
  offerTimeoutHours: OFFER_TIMEOUT_SECONDS / 3600,
  defaultTaxRatePct: DEFAULT_APP_SETTINGS.billing.defaultTaxRatePct,
  defaultLabourRateLkr: DEFAULT_APP_SETTINGS.billing.defaultLabourRateLkr,
  allowCustomerCancellation: true,
  requirePlanToRequest: true,
};

/** The company contact, quoting defaults and request rules an admin sets under Settings. */
export function useAppSettings(): SignedInAppSettings {
  const { data } = useQuery<SignedInAppSettings, Error>({
    queryKey: ['appSettings'],
    queryFn: () => apiService.fetchAppSettings(),
    staleTime: 10 * 60 * 1000,
  });
  return data ?? FALLBACK_APP_SETTINGS;
}
