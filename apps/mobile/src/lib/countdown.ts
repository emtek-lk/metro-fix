/** Whole seconds until `expiresAt`, never negative. Missing or unreadable deadlines count as 0. */
export function secondsUntil(expiresAt: string | Date | null | undefined, now: number = Date.now()): number {
  if (!expiresAt) return 0;
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - now) / 1000));
}

/** m:ss (h:mm:ss from an hour up), e.g. 75 -> "1:15", 5 -> "0:05", 32400 -> "9:00:00". */
export { formatCountdown } from '@metro-fix/core-types';

/** 1 when the offer has just been made, 0 when it has lapsed. Used for the progress bar. */
export function fractionLeft(secondsLeft: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, secondsLeft / totalSeconds));
}

/**
 * How long this offer was open in total, so the progress bar fills correctly whatever window dispatch
 * has configured (Settings > Dispatch). Falls back to `fallbackSeconds` if the offer lacks its dates.
 */
export function offerWindowSeconds(
  job: { offeredAt?: string | Date | null; offerExpiresAt?: string | Date | null } | null | undefined,
  fallbackSeconds: number,
): number {
  if (!job?.offeredAt || !job?.offerExpiresAt) return fallbackSeconds;
  const total = (new Date(job.offerExpiresAt).getTime() - new Date(job.offeredAt).getTime()) / 1000;
  return Number.isFinite(total) && total > 0 ? Math.round(total) : fallbackSeconds;
}
