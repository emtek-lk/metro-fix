import { getColorScheme } from './themeState';
import type { ColorScheme } from './palettes';

/**
 * Theme-aware replacement for a module-level `StyleSheet.create(...)`:
 *
 *   const styles = themedStyles(() => StyleSheet.create({ box: { backgroundColor: colors.bg } }));
 *
 * The factory runs once per scheme, on first use, and the result is cached; reading `styles.box`
 * during render returns the entry for the active scheme.
 */
export function themedStyles<T extends object>(factory: () => T): T {
  const cache: Partial<Record<ColorScheme, T>> = {};
  const resolve = (): T => {
    const scheme = getColorScheme();
    return (cache[scheme] ??= factory());
  };

  return new Proxy({} as T, {
    get: (_target, key) => (resolve() as Record<PropertyKey, unknown>)[key],
    has: (_target, key) => key in resolve(),
    ownKeys: () => Reflect.ownKeys(resolve()),
    getOwnPropertyDescriptor: (_target, key) => {
      const target = resolve();
      return key in target
        ? { enumerable: true, configurable: true, value: (target as Record<PropertyKey, unknown>)[key] }
        : undefined;
    },
  });
}
