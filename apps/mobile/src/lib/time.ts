const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Short relative time for list cards: "just now", "12m ago", "3h ago", "2d ago", then a date.
 * Future or unparseable dates fall back to a plain date / empty string rather than throwing.
 */
export function relativeTime(value: string | Date | null | undefined, now: number = Date.now()): string {
  if (!value) return '';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '';

  const diff = now - time;
  if (diff < 0) return new Date(time).toLocaleDateString();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(time).toLocaleDateString();
}
