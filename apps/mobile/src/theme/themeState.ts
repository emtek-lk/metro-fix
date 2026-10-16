import type { ColorScheme } from './palettes';

/**
 * The scheme the UI is currently rendered in. `ThemeProvider` updates this before its children
 * render, and remounts the tree when it changes, so every `colors` / `themedStyles` read during a
 * render sees a consistent value.
 */
let current: ColorScheme = 'dark';

export const getColorScheme = (): ColorScheme => current;

export const setColorScheme = (scheme: ColorScheme): void => {
  current = scheme;
};
