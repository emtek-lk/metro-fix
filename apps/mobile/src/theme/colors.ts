/**
 * METRO-FIX mobile — colour tokens.
 *
 * `colors` resolves against the active theme every time a token is read, so existing
 * `colors.bg` style code keeps working in both light and dark. Because it is read lazily, never
 * capture a token in a module-level constant — read it inside a function, or inside
 * `themedStyles(() => …)`.
 */
import { palettes, type ThemeColors } from './palettes';
import { getColorScheme } from './themeState';

export type { ThemeColors } from './palettes';

export const colors: ThemeColors = new Proxy({} as ThemeColors, {
  get: (_target, token: string) => palettes[getColorScheme()][token as keyof ThemeColors],
  has: (_target, token: string) => token in palettes.dark,
  ownKeys: () => Reflect.ownKeys(palettes.dark),
  getOwnPropertyDescriptor: (_target, token: string) =>
    token in palettes.dark
      ? { enumerable: true, configurable: true, value: palettes[getColorScheme()][token as keyof ThemeColors] }
      : undefined,
});

export type ColorToken = keyof ThemeColors;
