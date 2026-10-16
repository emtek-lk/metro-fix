import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AccessibilityInfo, Platform, StatusBar, View, useColorScheme } from 'react-native';
import { storage } from '../lib/storage';
import { palettes, type ColorScheme } from './palettes';
import { setColorScheme } from './themeState';

export type ThemePreference = 'system' | 'light' | 'dark';

const PREFERENCE_KEY = 'metrofix_theme';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

interface ThemeContextValue {
  /** What the user picked: follow the system, or force light / dark. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** The scheme actually in use. */
  scheme: ColorScheme;
  /** True when the OS asks apps to avoid translucent surfaces (iOS "Reduce Transparency"). */
  reduceTransparency: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  setPreference: () => undefined,
  scheme: 'dark',
  reduceTransparency: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);

  // Restore the saved preference before rendering anything, so there is no flash of the wrong theme.
  useEffect(() => {
    let active = true;
    storage
      .getItemAsync(PREFERENCE_KEY)
      .then((saved) => {
        if (active && isPreference(saved)) setPreferenceState(saved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    let active = true;
    try {
      AccessibilityInfo.isReduceTransparencyEnabled?.()
        ?.then((enabled) => active && setReduceTransparency(enabled))
        .catch(() => undefined);
      const subscription = AccessibilityInfo.addEventListener?.(
        'reduceTransparencyChanged',
        setReduceTransparency,
      );
      return () => {
        active = false;
        subscription?.remove?.();
      };
    } catch {
      return undefined;
    }
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    storage.setItemAsync(PREFERENCE_KEY, next).catch(() => undefined);
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  // Must happen before any child renders: `colors` and `themedStyles` read this.
  setColorScheme(scheme);

  const value = useMemo(
    () => ({ preference, setPreference, scheme, reduceTransparency }),
    [preference, setPreference, scheme, reduceTransparency],
  );

  return (
    <ThemeContext.Provider value={value}>
      {loaded ? children : <View style={{ flex: 1, backgroundColor: palettes[scheme].bg }} />}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

/**
 * Remounts everything below it when the scheme changes. Styles are cached per scheme and read
 * lazily, so a fresh mount is what guarantees every screen (including memoised ones) repaints.
 * Keep state that must survive a theme change (auth, query cache) above this boundary.
 */
export const ThemeBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scheme } = useTheme();
  return <React.Fragment key={scheme}>{children}</React.Fragment>;
};

/** Status bar icons that stay legible on the active background. */
export const ThemedStatusBar: React.FC = () => {
  const { scheme } = useTheme();
  return (
    <StatusBar
      barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={palettes[scheme].bg}
    />
  );
};
