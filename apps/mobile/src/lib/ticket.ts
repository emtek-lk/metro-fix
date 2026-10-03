/**
 * A short, stable reference for display ("TICKET #K3F9Q2") derived from the whole id.
 *
 * Do not use the tail of the id: SQL Server's sequential GUIDs share their last 12 characters, so
 * every ticket would read the same. This is a display convenience only; a proper sequential ticket
 * number should come from the backend, and this helper can then be retired.
 */
export function shortRef(id: string | null | undefined, length = 6): string {
  if (!id) return '';
  // FNV-1a over the full id.
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(length, '0').slice(-length);
}
