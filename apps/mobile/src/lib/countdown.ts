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
