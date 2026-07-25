import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const themeTokens: Record<ResolvedTheme, Record<string, string>> = {
  light: {
    '--app-background': 'linear-gradient(180deg, #eef6f4 0%, #ddebea 100%)',
    '--bg-primary': '#f4faf9',
    '--surface': '#ffffff',
    '--surface-strong': '#f4faf9',
    '--surface-elevated': '#fbfdfd',
    '--text-primary': '#102426',
    '--text-secondary': '#4b6769',
    '--color-text-primary': '#0f172a',
    '--color-text-secondary': '#475569',
    '--text-muted': '#6f8586',
    '--text-inverse': '#ffffff',
    '--sidebar-text': '#f8fbfd',
    '--sidebar-text-secondary': '#d2dee7',
    '--sidebar-text-muted': '#aebdcb',
    '--sidebar-active-surface': '#f38808',
    '--sidebar-active-text': '#ffffff',
    '--border-subtle': 'rgba(21, 48, 51, 0.12)',
    '--sidebar-bg': '#2b435f',
    '--sidebar-accent': '#f38808',
    '--accent': '#f38808',
    '--accent-strong': '#d37105',
    '--accent-hover': '#d37105',
    '--shadow-elevated': '0 18px 40px rgba(18, 38, 40, 0.14)',
  },
  dark: {
    '--app-background': 'linear-gradient(180deg, #2b435f 0%, #1b2d2f 100%)',
    '--bg-primary': '#2b435f',
    '--surface': '#102426',
    '--surface-strong': '#142223',
    '--surface-elevated': '#1b2d2f',
    '--text-primary': '#f3fbfb',
    '--text-secondary': '#b7cbcc',
    '--color-text-primary': '#f8fafc',
    '--color-text-secondary': '#cbd5e1',
    '--text-muted': '#8ea7a8',
    '--text-inverse': '#102426',
    '--sidebar-text': '#f8fbfd',
    '--sidebar-text-secondary': '#d2dee7',
    '--sidebar-text-muted': '#aebdcb',
    '--sidebar-active-surface': '#f38808',
    '--sidebar-active-text': '#ffffff',
    '--border-subtle': 'rgba(243, 136, 8, 0.16)',
    '--sidebar-bg': '#2b435f',
    '--sidebar-accent': '#f38808',
    '--accent': '#f38808',
    '--accent-strong': '#d37105',
    '--accent-hover': '#d37105',
    '--shadow-elevated': '0 18px 40px rgba(0, 0, 0, 0.28)',
  },
};

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }

    return (window.localStorage.getItem('metro-fix-theme') as ThemeMode | null) ?? 'system';
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metro-fix-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    const tokens = themeTokens[resolvedTheme];

    Object.entries(tokens).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });

    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    document.body.style.background = 'var(--app-background)';
    document.body.style.color = 'var(--text-primary)';
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}