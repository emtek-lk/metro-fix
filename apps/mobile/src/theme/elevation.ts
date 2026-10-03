import type { ViewStyle } from 'react-native';
import { getColorScheme } from './themeState';
import type { ColorScheme } from './palettes';

/**
 * Elevation scale. Each level pairs an iOS shadow with a matching Android
 * `elevation`, so surfaces read consistently on both platforms. Light mode uses softer, cooler
 * shadows than dark mode.
 *
 *  e0 — flat / inset
 *  e1 — list cards
 *  e2 — raised & hero cards
 *  e3 — floating tab bar, modals
 *
 * Levels resolve against the active theme when read, so read them inside `themedStyles(...)` or a
 * render, not at module level.
 */
const flat = {
  shadowColor: 'transparent',
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
  elevation: 0,
} as const satisfies ViewStyle;

const scale = {
  dark: {
    e0: flat,
    e1: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2 },
    e2: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 6 },
    e3: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 20, elevation: 12 },
  },
  light: {
    e0: flat,
    e1: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    e2: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 5 },
    e3: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 22, elevation: 10 },
  },
} as const satisfies Record<ColorScheme, Record<string, ViewStyle>>;

export type ElevationToken = keyof (typeof scale)['dark'];

export const elevation = {
  get e0() {
    return scale[getColorScheme()].e0;
  },
  get e1() {
    return scale[getColorScheme()].e1;
  },
  get e2() {
    return scale[getColorScheme()].e2;
  },
  get e3() {
    return scale[getColorScheme()].e3;
  },
};
