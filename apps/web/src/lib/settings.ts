import { useEffect, useState } from 'react';
import { DEFAULT_APP_SETTINGS, OFFER_TIMEOUT_SECONDS, type PublicAppSettings, type SignedInAppSettings } from '@metro-fix/core-types';
import { API_BASE_URL } from './api';

const FALLBACK: SignedInAppSettings = {
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

let cached: SignedInAppSettings | null = null;

/**
 * The company contact and rules every screen may show, from Settings. Signed-out screens get the
 * public part; signed-in ones the full set. Until the answer arrives (or if the API is down) the
 * built-in defaults are used, so a link or a sentence is never blank.
 */
export function useAppSettings(): SignedInAppSettings {
  const [settings, setSettings] = useState<SignedInAppSettings>(cached ?? FALLBACK);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('metrofix_token');
    const read = async (): Promise<SignedInAppSettings | null> => {
      if (token) {
        const full = await fetch(`${API_BASE_URL}/settings/app`, { headers: { Authorization: `Bearer ${token}` } });
        if (full.ok) return (await full.json()) as SignedInAppSettings;
      }
      const pub = await fetch(`${API_BASE_URL}/settings/public`);
      return pub.ok ? { ...FALLBACK, ...((await pub.json()) as PublicAppSettings) } : null;
    };
    read()
      .then((value) => {
        if (value) {
          cached = value;
          if (active) setSettings(value);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return settings;
}

/** "9 hours", "90 minutes" for the offer window. */
export function describeHours(hours: number): string {
  if (hours >= 1 && Number.isInteger(hours)) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  const minutes = Math.round(hours * 60);
  return minutes % 60 === 0 ? `${minutes / 60} hours` : `${minutes} minutes`;
}
