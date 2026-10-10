/** "ON_ROUTE" -> "On route". For any enum-ish value that must never reach a screen with underscores. */
export function humanize(value: string | null | undefined): string {
  const words = (value ?? '').replace(/_/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
