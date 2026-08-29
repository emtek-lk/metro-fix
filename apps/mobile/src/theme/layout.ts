import type { EdgeInsets } from 'react-native-safe-area-context';

/** 4pt spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

/** Corner radii. List cards use `lg`; hero/feature cards use `xxl`. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

/** Shared layout constants. */
export const layout = {
  screenPadding: spacing.xl,
  /** Height of the floating tab bar pill. */
  tabBarHeight: 68,
  /** Gap between the tab bar and the bottom of the screen. */
  tabBarInset: spacing.lg,
  /** Minimum accessible tap target. */
  minTap: 44,
} as const;

/**
 * Single source of truth for how much bottom padding a scrollable screen needs
 * so its last item clears the floating tab bar.
 *
 * Replaces the previously hardcoded 100 / 110 / 80 / 40 values, and — unlike
 * those — accounts for the device's home-indicator inset.
 */
export function tabBarClearance(insets?: Pick<EdgeInsets, 'bottom'>): number {
  return (
    layout.tabBarHeight +
    layout.tabBarInset +
    (insets?.bottom ?? 0) +
    spacing.lg
  );
}
