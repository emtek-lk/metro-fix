/**
 * METRO-FIX mobile — colour tokens.
 *
 * Single slate/orange system. No raw hex literals should appear in screens;
 * import from here instead. The legacy teal palette (#81b1b3, #4aad83,
 * #2b435f, #1c2d40) and the second orange (#f38808) are intentionally absent.
 */
export const colors = {
  // ── Surfaces ──
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceRaised: '#243449',
  border: '#334155',
  borderStrong: '#475569',

  // ── Text ──
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // ── Brand ──
  brand: '#F97316',
  brandPressed: '#EA6A0C',
  brandSubtle: 'rgba(249, 115, 22, 0.15)',

  // ── Semantic ──
  success: '#10B981',
  danger: '#EF4444',
  info: '#3B82F6',
  warning: '#F59E0B',

  successSubtle: 'rgba(16, 185, 129, 0.15)',
  dangerSubtle: 'rgba(239, 68, 68, 0.15)',
  /** Lighter red for text/icons on a dark or dangerSubtle background. */
  dangerText: '#FCA5A5',
  /** Pressed fill for danger-variant controls. */
  dangerPressed: 'rgba(239, 68, 68, 0.26)',

  // ── Utility ──
  overlay: 'rgba(2, 6, 23, 0.72)',
  /** Darkening layer over photography, to keep overlaid text legible. */
  scrim: 'rgba(15, 23, 42, 0.45)',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
