import type { TextStyle } from 'react-native';

/**
 * METRO-FIX mobile — type scale.
 *
 * Replaces ad-hoc font sizes (10→26) and normalises weights to 500/600/700/800.
 * Spread a token into a StyleSheet entry: `title: { ...typography.h1 }`.
 */
export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  h1: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  h2: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  h3: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
