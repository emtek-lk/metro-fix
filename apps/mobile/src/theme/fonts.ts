import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

/**
 * The app's own font on Android (Inter, bundled in android/app/src/main/assets/fonts).
 *
 * Without one, Android draws text in the phone's system font. Manufacturers replace that font (Xiaomi's
 * MIUI, for one): it is wider than Roboto and often has no real bold, so headings look thin and text is
 * measured one way and drawn another, which clips the last letters ("Sign..." instead of "Sign In").
 * Shipping our own font gives every phone the same letter shapes and widths and real weights.
 *
 * Android loads a font file per family name, so each weight is its own family and `fontWeight` is dropped
 * (leaving it would make Android bold an already-bold font a second time). iOS keeps the system font.
 */
const FAMILY_BY_WEIGHT: Record<number, string> = {
  400: 'Inter-Regular',
  500: 'Inter-Medium',
  600: 'Inter-SemiBold',
  700: 'Inter-Bold',
  800: 'Inter-ExtraBold',
};

/** The bundled family for a `fontWeight` value; weights we do not ship snap to the nearest one we do. */
export function fontFamilyForWeight(weight: TextStyle['fontWeight']): string {
  const numeric = weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : Number(weight);
  if (!Number.isFinite(numeric) || numeric <= 450) return FAMILY_BY_WEIGHT[400];
  if (numeric < 550) return FAMILY_BY_WEIGHT[500];
  if (numeric < 650) return FAMILY_BY_WEIGHT[600];
  if (numeric < 750) return FAMILY_BY_WEIGHT[700];
  return FAMILY_BY_WEIGHT[800];
}

/** Applies the app font to a text style. Off Android, or when a style names its own family, it is untouched. */
export function withAppFont(style: StyleProp<TextStyle>, os: string = Platform.OS): StyleProp<TextStyle> {
  if (os !== 'android') return style;
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style;
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: fontFamilyForWeight(fontWeight) };
}
