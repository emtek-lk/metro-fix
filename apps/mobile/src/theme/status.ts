import { JobStatus } from '@metro-fix/core-types';
import { colors } from './colors';
import type { FeatherIconName } from '../components/ui/Icon';

/**
 * Presentation metadata for the 7 service-request lifecycle stages.
 *
 * This is a *display* lookup only — it does not define, order, or constrain the
 * lifecycle itself, which lives in `@metro-fix/core-types`. It replaces three
 * duplicated colour switches (WorkerDashboard, JobDetail, JobHistory), two of
 * which left REQUESTED / PENDING_ACCEPTANCE / ASSIGNED rendering as the same
 * indistinguishable grey.
 *
 * The four colours that were already in use (ON_ROUTE, INSPECTION,
 * IN_PROGRESS, COMPLETED) are preserved byte-identically.
 */
export interface StatusPresentation {
  label: string;
  color: string;
  icon: FeatherIconName;
}

/**
 * The single lookup: every one of the 7 lifecycle stages defines exactly one
 * colour and one label. `satisfies Record<JobStatus, …>` makes an omitted stage
 * a compile-time error, so this map can never silently fall through to raw
 * enum text.
 */
const STATUS_PRESENTATION = {
  [JobStatus.REQUESTED]: {
    label: 'Requested',
    color: colors.textMuted, // #64748B — unchanged (was the default fallback)
    icon: 'file-text',
  },
  [JobStatus.PENDING_ACCEPTANCE]: {
    label: 'Dispatching',
    color: colors.warning, // #F59E0B — new; previously indistinguishable grey
    icon: 'radio',
  },
  [JobStatus.ASSIGNED]: {
    label: 'Assigned',
    color: '#6366F1', // indigo — new; previously indistinguishable grey
    icon: 'user-check',
  },
  [JobStatus.ON_ROUTE]: {
    label: 'On route',
    color: colors.info, // #3B82F6 — unchanged
    icon: 'navigation',
  },
  [JobStatus.INSPECTION]: {
    label: 'Inspection',
    color: '#8B5CF6', // unchanged
    icon: 'search',
  },
  [JobStatus.IN_PROGRESS]: {
    label: 'In progress',
    color: colors.brand, // #F97316 — unchanged
    icon: 'tool',
  },
  [JobStatus.COMPLETED]: {
    label: 'Completed',
    color: colors.success, // #10B981 — unchanged
    icon: 'check-circle',
  },
} satisfies Record<JobStatus, StatusPresentation>;

/**
 * Used only when a value outside the lifecycle reaches the UI. It renders
 * neutral human text — never the raw enum string.
 */
const FALLBACK: StatusPresentation = {
  label: 'Unknown',
  color: colors.textMuted,
  icon: 'help-circle',
};

/** Look up display metadata for a lifecycle stage. Never throws. */
export function getStatusPresentation(status?: JobStatus | string | null): StatusPresentation {
  if (!status) return FALLBACK;
  return (STATUS_PRESENTATION as Record<string, StatusPresentation>)[status] ?? FALLBACK;
}

/** Human label for a lifecycle stage. Never returns raw enum text. */
export function getStatusLabel(status?: JobStatus | string | null): string {
  return getStatusPresentation(status).label;
}

/** Convenience accessor kept for call sites that only need the colour. */
export function getStatusColor(status?: JobStatus | string | null): string {
  return getStatusPresentation(status).color;
}

// ── Domain chip iconography ──────────────────────────────────────────────

export const PILLAR_ICON: Record<string, FeatherIconName> = {
  HARD: 'tool',
  SOFT: 'droplet',
  STRATEGIC: 'shield',
};

export const FACILITY_ICON: Record<string, FeatherIconName> = {
  RESIDENTIAL: 'home',
  COMMERCIAL: 'briefcase',
  INDUSTRIAL: 'truck',
};
