import {
  counterpartHost,
  detectSurface,
  resolveApiBase,
  type HostingConfig,
  type Surface,
} from '@metro-fix/core-types';

/**
 * Which website this is and where its API lives, worked out from the address in the browser. No
 * domain is written down anywhere: `admin.<site>` is the staff site, any other real hostname is the
 * customer site, and plain localhost serves both. Build-time settings can override this:
 *   VITE_ADMIN_SUBDOMAIN  the staff label (default "admin")
 *   VITE_SURFACE          admin | customer | any
 *   VITE_API_URL          the full API address
 */
const env = (typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string | undefined> }).env : undefined) ?? {};

const asSurface = (value: string | undefined): Surface | undefined =>
  value === 'admin' || value === 'customer' || value === 'any' ? value : undefined;

export const HOSTING_CONFIG: HostingConfig = {
  adminLabel: env.VITE_ADMIN_SUBDOMAIN || undefined,
  surface: asSurface(env.VITE_SURFACE),
  apiBase: env.VITE_API_URL || undefined,
};

const here = typeof window !== 'undefined' ? window.location : { protocol: 'http:', hostname: 'localhost', port: '', host: 'localhost' };

/** The API address for this page. */
export const API_BASE_URL: string = resolveApiBase(here, HOSTING_CONFIG);

/** Who this website is for. */
export const SURFACE: Surface = detectSurface(here.hostname, HOSTING_CONFIG);

/** The address of the other website (staff or customer) for the same installation, or null on plain localhost. */
export function siteUrl(target: 'admin' | 'customer'): string | null {
  const host = counterpartHost(here.host, target, HOSTING_CONFIG);
  return host ? `${here.protocol}//${host}` : null;
}
