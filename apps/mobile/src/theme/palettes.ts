/**
 * METRO-FIX mobile — colour palettes (dark + light).
 *
 * Both palettes define exactly the same tokens; `ThemeColors` is derived from the dark one and the
 * light palette is type-checked against it, so a token can never exist in only one theme.
 * The legacy teal palette (#81b1b3, #4aad83, #2b435f, #1c2d40) and the second orange (#f38808)
 * are intentionally absent.
 */
export const darkPalette = {
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
  /** Red for text/icons on a dangerSubtle background. */
  dangerText: '#FCA5A5',
  /** Pressed fill for danger-variant controls. */
  dangerPressed: 'rgba(239, 68, 68, 0.26)',

  // ── Utility ──
  overlay: 'rgba(2, 6, 23, 0.72)',
  /** Darkening layer over photography, to keep overlaid text legible. */
  scrim: 'rgba(15, 23, 42, 0.45)',
  white: '#FFFFFF',

  // ── Glass & ambient background ──
  /** Tint laid over blurred content on floating glass surfaces. */
  glassTint: 'rgba(30, 41, 59, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  /** Opaque stand-in for glass when transparency is reduced. */
  glassSolid: '#1E293B',
  /** Android has no blur material, so its glass stand-in is nearly opaque to keep text legible. */
  glassAndroid: 'rgba(30, 41, 59, 0.94)',
  /** The sliding tab "bubble": native glass tint on iOS 26+, plain fill / sheen / rim elsewhere. */
  bubbleTint: 'rgba(249, 115, 22, 0.16)',
  bubbleFill: 'rgba(255, 255, 255, 0.07)',
  /** Body shading: light falls from the top, the lower edge sits in shade. */
  bubbleLight: 'rgba(255, 255, 255, 0.20)',
  bubbleShade: 'rgba(2, 6, 23, 0.34)',
  /** Warm light bounced up along the bottom edge. */
  bubbleGlow: 'rgba(251, 146, 60, 0.34)',
  /** The bright highlight near the top. */
  bubbleSpecular: 'rgba(255, 255, 255, 0.60)',
  /** Rim light: strongest on top, warm on the bottom. */
  bubbleRimTop: 'rgba(255, 255, 255, 0.80)',
  bubbleRimSide: 'rgba(255, 255, 255, 0.26)',
  bubbleRimBottom: 'rgba(251, 146, 60, 0.60)',
  bubbleShadow: '#000000',
  /** Round controls laid over photography: identical in both themes, since the photo is. */
  photoControl: 'rgba(255, 255, 255, 0.92)',
  photoControlIcon: '#0F172A',
  /** Soft brand glow and cool counter-glow behind the app content. */
  ambientWarm: 'rgba(249, 115, 22, 0.16)',
  ambientCool: 'rgba(59, 130, 246, 0.14)',
};

export type ThemeColors = { [K in keyof typeof darkPalette]: string };

export const lightPalette: ThemeColors = {
  // ── Surfaces ──
  bg: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceRaised: '#EAEFF6',
  border: '#DCE2EC',
  borderStrong: '#C2CBDA',

  // ── Text ──
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  // ── Brand ──
  brand: '#EA580C',
  brandPressed: '#C2410C',
  brandSubtle: 'rgba(234, 88, 12, 0.12)',

  // ── Semantic ──
  success: '#059669',
  danger: '#DC2626',
  info: '#2563EB',
  warning: '#D97706',

  successSubtle: 'rgba(5, 150, 105, 0.12)',
  dangerSubtle: 'rgba(220, 38, 38, 0.10)',
  dangerText: '#B91C1C',
  dangerPressed: 'rgba(220, 38, 38, 0.18)',

  // ── Utility ──
  overlay: 'rgba(15, 23, 42, 0.45)',
  scrim: 'rgba(15, 23, 42, 0.30)',
  white: '#FFFFFF',

  // ── Glass & ambient background ──
  glassTint: 'rgba(255, 255, 255, 0.62)',
  glassBorder: 'rgba(255, 255, 255, 0.75)',
  glassSolid: '#FFFFFF',
  glassAndroid: 'rgba(255, 255, 255, 0.95)',
  bubbleTint: 'rgba(234, 88, 12, 0.24)',
  bubbleFill: 'rgba(255, 255, 255, 0.40)',
  bubbleLight: 'rgba(255, 255, 255, 0.90)',
  bubbleShade: 'rgba(234, 88, 12, 0.20)',
  bubbleGlow: 'rgba(234, 88, 12, 0.24)',
  bubbleSpecular: 'rgba(255, 255, 255, 1)',
  bubbleRimTop: 'rgba(255, 255, 255, 1)',
  bubbleRimSide: 'rgba(255, 255, 255, 0.70)',
  bubbleRimBottom: 'rgba(234, 88, 12, 0.50)',
  bubbleShadow: '#9A3412',
  photoControl: 'rgba(255, 255, 255, 0.92)',
  photoControlIcon: '#0F172A',
  ambientWarm: 'rgba(249, 115, 22, 0.14)',
  ambientCool: 'rgba(37, 99, 235, 0.10)',
};

export type ColorScheme = 'light' | 'dark';

export const palettes: Record<ColorScheme, ThemeColors> = {
  dark: darkPalette,
  light: lightPalette,
};
